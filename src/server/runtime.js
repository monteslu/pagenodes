/**
 * PageNodes Server Runtime
 *
 * This adapts the worker runtime to run on the Node.js main thread.
 * It imports the same node runtime implementations and provides
 * the same rawr RPC interface, but over WebSocket instead of postMessage.
 */

import rawr, { transports } from 'rawr';
import mqtt from 'mqtt';
import { io } from 'socket.io-client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import os from 'os';
import { generateId } from '../utils/id.js';
import { runtimeRegistry } from './runtime-registry.js';
import { createLogger } from '../utils/logger.js';

// Cached password hash (loaded from settings at startup)
let cachedPasswordHash = null;

// Session tokens: token -> { createdAt }
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const activeSessions = new Map();

function createSessionToken() {
  const token = crypto.randomUUID();
  activeSessions.set(token, { createdAt: Date.now() });
  return token;
}

function validateSessionToken(token) {
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_MAX_AGE) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

// Clean up expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions) {
    if (now - session.createdAt > SESSION_MAX_AGE) {
      activeSessions.delete(token);
    }
  }
}, 60 * 60 * 1000);

// Make mqtt and io available globally for runtime implementations
globalThis.mqtt = mqtt;
globalThis.io = io;

// Server-side logger
const PN = createLogger('server');
PN.mode = 'server';
globalThis.PN = PN;

// Flow context storage
const context = {
  flow: new Map(),
  global: new Map()
};

// Active node instances
const nodes = new Map();

// Config node instances (by ID)
const configNodes = new Map();

// Set of node IDs that have errors and should be skipped
let errorNodeIds = new Set();

// Previous config node states for change detection (id -> serialized config)
const previousConfigStates = new Map();

// Catch nodes for error routing
let catchNodes = [];

// Connected browser peers (multiple browsers can connect)
const browserPeers = new Map();

// MCP connection state
let mcpSocket = null;
let mcpPeer = null;
let mcpReconnectTimer = null;
let mcpPort = null;
let mcpClientUrl = null;
let mcpCurrentStatus = 'disabled';

// Storage reference (set when first browser connects)
let storageRef = null;

// Server-side flow state (storage format: flat nodes, no _node wrapper)
let serverFlowState = { flows: [], nodes: [], configNodes: [] };

// Debug/error message buffers for MCP queries
const debugMessages = [];
const errorMessages = [];
const MAX_BUFFER_SIZE = 200;

// MCP message queue (for mcp-output nodes)
const mcpMessageQueue = [];

/**
 * Route an error to catch nodes
 * Returns true if a catch node handled the error
 */
function handleError(sourceNode, errorText, originalMsg, errorObj) {
  const _msgid = originalMsg?._msgid || generateId();

  // Build error message
  const errorMessage = {
    _msgid,
    error: {
      message: errorText,
      source: {
        id: sourceNode.id,
        type: sourceNode.type,
        name: sourceNode.name || sourceNode.type
      }
    }
  };

  // Add stack trace if available
  if (errorObj instanceof Error) {
    errorMessage.error.stack = errorObj.stack;
  }

  // Copy original message properties (except _msgid which we set)
  if (originalMsg && typeof originalMsg === 'object') {
    for (const key of Object.keys(originalMsg)) {
      if (key !== '_msgid' && key !== 'error') {
        errorMessage[key] = originalMsg[key];
      }
    }
  }

  // Buffer error for MCP queries and notify browsers
  const errorEntry = {
    nodeId: sourceNode.id,
    nodeName: sourceNode.name || sourceNode.type,
    nodeType: sourceNode.type,
    message: errorText,
    stack: errorMessage.error.stack,
    _msgid,
    timestamp: Date.now()
  };
  errorMessages.unshift(errorEntry);
  if (errorMessages.length > MAX_BUFFER_SIZE) errorMessages.length = MAX_BUFFER_SIZE;
  notifyAllBrowsers('error', errorEntry);

  // Find matching catch nodes
  let handled = false;

  // Sort: regular catch nodes first, then uncaught
  const sortedCatchNodes = [...catchNodes].sort((a, b) => {
    const aUncaught = a.config.scope === 'uncaught' ? 1 : 0;
    const bUncaught = b.config.scope === 'uncaught' ? 1 : 0;
    return aUncaught - bUncaught;
  });

  for (const catchNode of sortedCatchNodes) {
    const scope = catchNode.config.scope || 'all';

    if (scope === 'uncaught' && handled) {
      continue;
    }

    try {
      catchNode.send(errorMessage);
      handled = true;

      if (scope !== 'uncaught') {
        break;
      }
    } catch (e) {
      PN.error('Error in catch node:', e);
    }
  }

  return handled;
}

/**
 * Compare two config nodes to see if connection-relevant properties changed.
 */
function configsEqual(prevNode, newNode) {
  if (!prevNode || !newNode) return false;
  if (prevNode._node.type !== newNode._node.type) return false;

  const prevConfig = { ...prevNode };
  const newConfig = { ...newNode };
  delete prevConfig._node;
  delete newConfig._node;

  return JSON.stringify(prevConfig) === JSON.stringify(newConfig);
}

/**
 * Store config node state for future comparison
 */
function storeConfigState(configNode) {
  previousConfigStates.set(configNode._node.id, {
    _node: {
      id: configNode._node.id,
      type: configNode._node.type
    },
    ...configNode
  });
}

/**
 * Base Node class
 */
class RuntimeNode {
  constructor(nodeDef, runtimeDef) {
    this.id = nodeDef._node.id;
    this.type = nodeDef._node.type;
    this.name = nodeDef._node.name || '';
    this.z = nodeDef._node.z;
    this.wires = nodeDef._node.wires || [];

    this.config = { ...nodeDef };
    delete this.config._node;

    this._closeCallbacks = [];
    this._eventListeners = new Map();
    this._context = new Map();

    const nodeContext = this._context;
    this._contextObj = {
      get: (key) => nodeContext.get(key),
      set: (key, value) => { nodeContext.set(key, value); },
      keys: () => [...nodeContext.keys()],
      flow: {
        get: (key) => context.flow.get(key),
        set: (key, value) => { context.flow.set(key, value); },
        keys: () => [...context.flow.keys()]
      },
      global: {
        get: (key) => context.global.get(key),
        set: (key, value) => { context.global.set(key, value); },
        keys: () => [...context.global.keys()]
      }
    };

    if (runtimeDef) {
      if (runtimeDef.onInit) this.onInit = runtimeDef.onInit.bind(this);
      if (runtimeDef.onInput) this.onInput = runtimeDef.onInput.bind(this);
      if (runtimeDef.onClose) this._onClose = runtimeDef.onClose.bind(this);

      for (const key of Object.keys(runtimeDef)) {
        if (key !== 'type' && key !== 'onInit' && key !== 'onInput' && key !== 'onClose' && typeof runtimeDef[key] === 'function') {
          this[key] = runtimeDef[key].bind(this);
        }
      }
    }
  }

  send(msg) {
    if (!msg) return;
    if (errorNodeIds.has(this.id)) return;

    const msgs = Array.isArray(msg) ? msg : [[msg]];

    for (let outputIndex = 0; outputIndex < this.wires.length; outputIndex++) {
      const outputWires = this.wires[outputIndex] || [];
      const outputMsgs = msgs[outputIndex];

      if (!outputMsgs) continue;

      const msgsToSend = Array.isArray(outputMsgs) ? outputMsgs : [outputMsgs];

      for (const m of msgsToSend) {
        if (!m) continue;
        if (!m._msgid) m._msgid = generateId();

        for (const targetId of outputWires) {
          if (errorNodeIds.has(targetId)) continue;

          const targetNode = nodes.get(targetId);
          if (targetNode) {
            setImmediate(() => targetNode.receive(m));
          }
        }
      }
    }
  }

  receive(msg) {
    if (this._hasErrorStatus) {
      this._hasErrorStatus = false;
      this.status({});
    }
    try {
      if (this.onInput) {
        const result = this.onInput(msg);
        if (result instanceof Promise) {
          result.catch(err => this.error(err.message, msg));
        }
      }
    } catch (err) {
      this.error(err.message, msg);
    }
  }

  log(text) {
    notifyAllBrowsers('log', { nodeId: this.id, level: 'info', text });
  }

  warn(text) {
    notifyAllBrowsers('log', { nodeId: this.id, level: 'warn', text });
  }

  error(text, msg, errorObj) {
    notifyAllBrowsers('log', { nodeId: this.id, level: 'error', text });
    this._hasErrorStatus = true;
    const errorText = typeof text === 'string' ? text : (text?.message || 'error');
    this.status({ fill: 'red', shape: 'dot', text: errorText });
    handleError(this, text, msg, errorObj || (text instanceof Error ? text : null));
  }

  debug(output, topic = '', _msgid) {
    // Strip non-serializable internal properties (e.g. _res from http-in)
    let payload = output;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const { _res, ...rest } = payload;
      if (_res) payload = rest;
    }

    const msg = {
      nodeId: this.id,
      nodeName: this.name || this.type,
      payload,
      topic,
      _msgid,
      timestamp: Date.now()
    };
    // Buffer for MCP queries
    debugMessages.unshift(msg);
    if (debugMessages.length > MAX_BUFFER_SIZE) debugMessages.length = MAX_BUFFER_SIZE;
    notifyAllBrowsers('debug', msg);
  }

  status(status) {
    notifyAllBrowsers('status', { nodeId: this.id, status });
  }

  notifyDownload({ filename, content, mimeType }) {
    notifyAllBrowsers('download', {
      nodeId: this.id,
      nodeName: this.name || this.type,
      filename,
      content,
      mimeType
    });
  }

  context() {
    return this._contextObj;
  }

  getConfigNode(id) {
    return configNodes.get(id);
  }

  getNode(id) {
    return nodes.get(id);
  }

  /**
   * Request main thread (browser) to execute an action
   * In server mode, this delegates to connected browser
   */
  mainThread(action, params = {}) {
    // In headless server mode, we notify the browser to handle mainThread operations
    notifyAllBrowsers('mainThreadRequest', {
      nodeId: this.id,
      nodeType: this.type,
      action,
      params
    });
  }

  /**
   * Request main thread (browser) to execute an action and return result
   * In server mode, this is more complex - needs to call browser and wait for response
   */
  async mainThreadCall(action, _params = {}) {
    // For now, throw an error - browser delegation for sync calls needs more work
    throw new Error('mainThreadCall not yet implemented in server mode');
  }

  on(event, callback) {
    if (event === 'close') {
      this._closeCallbacks.push(callback);
    } else {
      if (!this._eventListeners.has(event)) {
        this._eventListeners.set(event, []);
      }
      this._eventListeners.get(event).push(callback);
    }
  }

  emit(event, ...args) {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(...args);
        } catch (e) {
          PN.error('Error in event listener', event, e);
        }
      }
    }
  }

  close() {
    if (this._onClose) {
      try {
        this._onClose();
      } catch (e) {
        PN.error('Error in onClose', e);
      }
    }

    for (const cb of this._closeCallbacks) {
      try {
        cb();
      } catch (e) {
        PN.error('Error in close callback', e);
      }
    }
  }
}

/**
 * Create a node instance from definition
 */
function createNode(nodeDef) {
  const runtimeDef = runtimeRegistry.get(nodeDef._node.type);

  if (!runtimeDef) {
    PN.warn(`Unknown node type: ${nodeDef._node.type}`);
    return new RuntimeNode(nodeDef, null);
  }

  // Check if node is browser-only (has mainThread but no worker runtime)
  // For now, allow all nodes - browser-only ones will delegate via mainThread
  return new RuntimeNode(nodeDef, runtimeDef);
}

/**
 * Deploy flows
 */
async function deployFlows(flowNodes, flowConfigNodes = [], skipNodeIds = []) {
  errorNodeIds = new Set(skipNodeIds);

  const unchangedConfigIds = new Set();
  const incomingConfigIds = new Set(flowConfigNodes.map(c => c._node.id));

  // Determine which config nodes have changed
  for (const configNode of flowConfigNodes) {
    const prevState = previousConfigStates.get(configNode._node.id);
    if (prevState && configsEqual(prevState, configNode)) {
      unchangedConfigIds.add(configNode._node.id);
      PN.log(`Config node ${configNode._node.id} unchanged, keeping connection`);
    }
  }

  // Close regular nodes
  for (const [id, node] of nodes.entries()) {
    if (configNodes.has(id)) continue;
    try {
      node.close();
    } catch (e) {
      PN.error('Error closing node', id, e);
    }
  }

  // Close config nodes that were removed or changed
  for (const [id] of configNodes.entries()) {
    const wasRemoved = !incomingConfigIds.has(id);
    const wasChanged = !unchangedConfigIds.has(id);

    if (wasRemoved || wasChanged) {
      const instance = nodes.get(id);
      if (instance) {
        try {
          PN.log(`Closing config node ${id} - ${wasRemoved ? 'removed' : 'changed'}`);
          instance.close();
        } catch (e) {
          PN.error('Error closing config node', id, e);
        }
        nodes.delete(id);
      }
      previousConfigStates.delete(id);
    }
  }

  // Clear non-config nodes from map
  for (const id of nodes.keys()) {
    if (!unchangedConfigIds.has(id)) {
      nodes.delete(id);
    }
  }

  // Update configNodes map
  configNodes.clear();
  for (const configNode of flowConfigNodes) {
    configNodes.set(configNode._node.id, {
      id: configNode._node.id,
      type: configNode._node.type,
      name: configNode._node.name,
      ...configNode
    });
  }

  // Create new/changed config node instances
  for (const configNode of flowConfigNodes) {
    if (errorNodeIds.has(configNode._node.id)) continue;
    if (unchangedConfigIds.has(configNode._node.id)) {
      storeConfigState(configNode);
      continue;
    }

    const node = createNode(configNode);
    nodes.set(node.id, node);
    storeConfigState(configNode);
  }

  // Initialize new/changed config nodes
  for (const configNode of flowConfigNodes) {
    if (errorNodeIds.has(configNode._node.id)) continue;
    if (unchangedConfigIds.has(configNode._node.id)) continue;

    const node = nodes.get(configNode._node.id);
    if (node && node.onInit) {
      try {
        node.onInit();
      } catch (e) {
        PN.error('Error initializing config node', node.id, e);
      }
    }
  }

  // Create regular node instances
  for (const nodeDef of flowNodes) {
    if (errorNodeIds.has(nodeDef._node.id)) continue;
    const node = createNode(nodeDef);
    nodes.set(node.id, node);
  }

  // Initialize all regular nodes
  const initPromises = [];
  for (const nodeDef of flowNodes) {
    if (errorNodeIds.has(nodeDef._node.id)) continue;
    const node = nodes.get(nodeDef._node.id);
    if (node && node.onInit) {
      try {
        const result = node.onInit();
        if (result && typeof result.then === 'function') {
          initPromises.push(result.catch(e => {
            PN.error('Error in async onInit for node', node.id, e);
          }));
        }
      } catch (e) {
        PN.error('Error initializing node', node.id, e);
      }
    }
  }

  if (initPromises.length > 0) {
    await Promise.all(initPromises);
  }

  // Populate catch nodes array
  catchNodes = [];
  for (const node of nodes.values()) {
    if (node.type === 'catch') {
      catchNodes.push(node);
    }
  }
  PN.log(`Deploy complete: ${catchNodes.length} catch node(s)`);

  broadcastMcpStatus(mcpCurrentStatus);

  const skippedCount = skipNodeIds.length;
  const reusedConfigCount = unchangedConfigIds.size;
  return {
    nodeCount: flowNodes.length - skippedCount,
    configCount: flowConfigNodes.length,
    skippedCount,
    reusedConfigCount,
    reusedConfigIds: [...unchangedConfigIds]
  };
}

/**
 * Inject a message into a node
 */
function injectNode(nodeId, msg = {}) {
  if (errorNodeIds.has(nodeId)) {
    return { success: false, error: 'Node has errors' };
  }

  const node = nodes.get(nodeId);
  if (!node) {
    return { success: false, error: 'Node not found' };
  }

  const _msgid = generateId();

  if (node.type === 'inject') {
    let payload;
    if (msg.payload !== undefined) {
      payload = msg.payload;
    } else {
      switch (node.config.payloadType) {
        case 'date': payload = Date.now(); break;
        case 'str': payload = node.config.payload; break;
        case 'num': payload = parseFloat(node.config.payload) || 0; break;
        case 'json':
          try { payload = JSON.parse(node.config.payload); }
          catch { payload = {}; }
          break;
        case 'bool': payload = node.config.payload === 'true'; break;
        default: payload = node.config.payload;
      }
    }
    node.send({ _msgid, topic: node.config.topic || '', payload });
  } else {
    node.receive({ _msgid, ...msg });
  }

  return { success: true, _msgid };
}

/**
 * Trigger any node by sending a message to its input
 */
function triggerNode(nodeId, msg = {}) {
  if (errorNodeIds.has(nodeId)) {
    return { success: false, error: 'Node has errors' };
  }

  const node = nodes.get(nodeId);
  if (!node) {
    return { success: false, error: 'Node not found' };
  }

  const _msgid = msg._msgid || generateId();
  node.receive({ _msgid, ...msg });

  return { success: true, _msgid, nodeType: node.type };
}

/**
 * Stop the runtime
 */
function stopRuntime() {
  for (const node of nodes.values()) {
    try {
      node.close();
    } catch (e) {
      PN.error('Error closing node', e);
    }
  }
  nodes.clear();
  configNodes.clear();
  context.flow.clear();
  context.global.clear();
  PN.log('Runtime stopped');
}

/**
 * Handle result from main thread (browser delegation)
 */
function handleMainThreadResult(nodeId, result) {
  const node = nodes.get(nodeId);
  if (node) {
    node.send(result);
  }
}

/**
 * Handle events from main thread for specific node types
 */
function handleMainThreadEvent(nodeId, event, data) {
  const node = nodes.get(nodeId);
  if (node) {
    if (event === 'error') {
      const errorMsg = typeof data === 'string' ? data : (data?.message || 'Unknown error');
      node.error(errorMsg, null, new Error(errorMsg));
    } else {
      node.emit(event, data);
    }
  }
}

/**
 * Broadcast to all nodes of a specific type
 */
function broadcastToType(nodeType, action, params) {
  for (const node of nodes.values()) {
    if (node.type === nodeType && typeof node.fromMainThread === 'function') {
      try {
        node.fromMainThread(action, params);
      } catch (e) {
        PN.error(`Error in fromMainThread for ${nodeType}:`, e);
      }
    }
  }
}

/**
 * Broadcast MCP status to mcp-input/mcp-output nodes
 */
function broadcastMcpStatus(status) {
  mcpCurrentStatus = status;
  for (const node of nodes.values()) {
    if (node.type === 'mcp-input' || node.type === 'mcp-output') {
      node.emit('mcpConnectionStatus', { status });
    }
  }
}

/**
 * Get MCP status
 */
function getMcpStatus() {
  return mcpCurrentStatus;
}

/**
 * Notify all connected browsers of something
 */
function notifyAllBrowsers(notification, data) {
  for (const [, { peer }] of browserPeers.entries()) {
    try {
      peer.notifiers[notification](data);
    } catch (err) {
      // Only silence connection errors, log everything else
      const msg = err?.message || '';
      if (msg.includes('circular') || msg.includes('serialize') || msg.includes('convert')) {
        PN.warn(`Failed to send '${notification}' to browser: ${msg}`);
      }
      // Connection errors (browser disconnected) are expected and silenced
    }
  }
}


/**
 * Convert a flat storage-format node to runtime format with _node wrapper
 */
function storageNodeToRuntime(item) {
  const nodeDef = {
    _node: {
      id: item.id,
      type: item.type,
      name: item.name,
      z: item.z,
      wires: item.wires || []
    }
  };

  // Copy all other properties to config
  for (const key of Object.keys(item)) {
    if (!['id', 'type', 'name', 'z', 'wires', 'x', 'y'].includes(key)) {
      nodeDef[key] = item[key];
    }
  }

  return nodeDef;
}

/**
 * Save serverFlowState to storage and notify connected browsers
 */
async function saveAndNotifyBrowsers() {
  if (storageRef) {
    await storageRef.saveFlows(serverFlowState);
  }
  notifyAllBrowsers('flowsChanged', null);
}

/**
 * Deploy flows from storage format (used on server startup and MCP deploy)
 * Accepts both flat array format and structured { flows, nodes, configNodes } format
 */
export async function deployFlowsFromStorage(flowConfig) {
  if (!flowConfig) {
    return { nodeCount: 0, configCount: 0, skippedCount: 0 };
  }

  let allItems;

  if (Array.isArray(flowConfig)) {
    // Legacy flat array format
    allItems = flowConfig;
  } else {
    // Structured format: { flows, nodes, configNodes }
    allItems = [
      ...(flowConfig.flows || []),
      ...(flowConfig.nodes || []),
      ...(flowConfig.configNodes || [])
    ];
    // Update serverFlowState from structured format
    serverFlowState = {
      flows: flowConfig.flows || [],
      nodes: flowConfig.nodes || [],
      configNodes: flowConfig.configNodes || []
    };
  }

  // Separate flows, config nodes, and regular nodes
  const flowNodes = [];
  const flowConfigNodes = [];
  const storedFlows = [];
  const storedNodes = [];
  const storedConfigNodes = [];

  for (const item of allItems) {
    if (item.type === 'tab') {
      storedFlows.push(item);
      continue;
    }

    const nodeDef = storageNodeToRuntime(item);

    // Check if this is a config node (no z property means it's a config node)
    if (!item.z) {
      flowConfigNodes.push(nodeDef);
      storedConfigNodes.push(item);
    } else {
      flowNodes.push(nodeDef);
      storedNodes.push(item);
    }
  }

  // If we parsed from flat array, update serverFlowState
  if (Array.isArray(flowConfig)) {
    serverFlowState = {
      flows: storedFlows,
      nodes: storedNodes,
      configNodes: storedConfigNodes
    };
  }

  return deployFlows(flowNodes, flowConfigNodes, []);
}

/**
 * Register all authenticated handlers on a peer connection
 */
function registerAuthenticatedHandlers(peer, storage, peerId, log) {
  // Register handlers that the browser UI can call
  peer.addHandler('deploy', async (flows, configNodes, skipNodeIds) => {
    const result = await deployFlows(flows, configNodes, skipNodeIds);
    return result;
  });

  peer.addHandler('inject', (nodeId, payload) => injectNode(nodeId, payload));
  peer.addHandler('trigger', (nodeId, msg) => triggerNode(nodeId, msg));
  peer.addHandler('stop', () => stopRuntime());
  peer.addHandler('connectMcp', (options) => connectMcp(options, peer));
  peer.addHandler('disconnectMcp', () => disconnectMcp());
  peer.addHandler('getMcpStatus', () => getMcpStatus());

  // Storage handlers - browser UI calls these to persist flows
  peer.addHandler('getFlows', () => storage.getFlows());
  peer.addHandler('saveFlows', async (flowConfig) => {
    PN.log('saveFlows:', flowConfig?.nodes?.length || 0, 'nodes');
    await storage.saveFlows(flowConfig);
    // Keep server flow state in sync with browser saves
    if (flowConfig && !Array.isArray(flowConfig)) {
      serverFlowState = {
        flows: flowConfig.flows || [],
        nodes: flowConfig.nodes || [],
        configNodes: flowConfig.configNodes || []
      };
    }
    return { success: true };
  });
  peer.addHandler('getCredentials', () => storage.getCredentials());
  peer.addHandler('saveCredentials', async (creds) => {
    await storage.saveCredentials(creds);
    return { success: true };
  });
  peer.addHandler('getSettings', async () => {
    const settings = await storage.getSettings();
    // Don't send password hash to browser
    const { password, ...safeSettings } = settings;
    return { ...safeSettings, hasPassword: !!password };
  });
  peer.addHandler('saveSettings', async (settings) => {
    // Handle password: hash if provided, null to remove
    if (settings.password && settings.password !== true) {
      settings.password = await bcrypt.hash(settings.password, 10);
      cachedPasswordHash = settings.password;
    } else if (settings.password === null || settings.password === '') {
      settings.password = null;
      cachedPasswordHash = null;
    } else {
      // password === true means "unchanged" — preserve existing
      const existing = await storage.getSettings();
      settings.password = existing.password;
    }
    await storage.saveSettings(settings);
    return { success: true };
  });

  // Handlers for browser delegation back to server
  peer.addHandler('sendResult', (nodeId, msg) => handleMainThreadResult(nodeId, msg));
  peer.addHandler('emitEvent', (nodeId, event, data) => handleMainThreadEvent(nodeId, event, data));
  peer.addHandler('broadcastToType', (type, event, data) => broadcastToType(type, event, data));

  // Add to authenticated peers and notify ready
  browserPeers.set(peerId, { ...browserPeers.get(peerId), authenticated: true });
  peer.notifiers.ready();
  log(`Browser authenticated: ${peerId}`);
}

/**
 * Handle a new browser WebSocket connection
 * @param {object} socket - WebSocket connection
 * @param {object} storage - Storage interface
 * @param {Function} log - Logging function
 * @param {boolean} preAuthenticated - Whether the connection was pre-authenticated (e.g. via session cookie)
 */
export function handleBrowserConnection(socket, storage, log = console.log, preAuthenticated = false) {
  storageRef = storage;
  const peerId = generateId();
  log(`Browser connected: ${peerId} (preAuth: ${preAuthenticated})`);

  const transport = transports.websocket(socket);
  const peer = rawr({ transport });

  browserPeers.set(peerId, { peer, socket, transport, authenticated: false });

  if (preAuthenticated || !cachedPasswordHash) {
    // No auth needed — register all handlers immediately
    registerAuthenticatedHandlers(peer, storage, peerId, log);
  }
  // If auth is required and not pre-authenticated, the browser must call
  // /_pn/auth/login first to get a session token, then reconnect.
  // The WebSocket itself doesn't handle authentication.

  // Handle disconnect
  socket.on('close', () => {
    log(`Browser disconnected: ${peerId}`);
    browserPeers.delete(peerId);
  });

  return peer;
}

/**
 * Get the first connected browser peer (for proxying MCP flow-edit operations)
 */
function getActiveBrowserPeer() {
  PN.log(`getActiveBrowserPeer: ${browserPeers.size} browser(s) connected`);
  for (const { peer } of browserPeers.values()) {
    return peer;
  }
  return null;
}

/**
 * Connect to MCP server
 */
function connectMcp(options, _callerPeer) {
  const port = typeof options === 'object' ? options.port : options;
  const url = typeof options === 'object' ? options.url : null;

  PN.log(`connectMcp called: port=${port}, url=${url}`);

  mcpPort = port;
  mcpClientUrl = url;

  if (mcpSocket) {
    mcpSocket.close();
    mcpSocket = null;
  }

  if (mcpPeer) {
    mcpPeer = null;
  }

  if (mcpReconnectTimer) {
    clearTimeout(mcpReconnectTimer);
    mcpReconnectTimer = null;
  }

  notifyAllBrowsers('mcpStatus', { status: 'connecting' });
  broadcastMcpStatus('connecting');

  try {
    const socket = new WebSocket(`ws://localhost:${port}`);
    mcpSocket = socket;

    socket.onopen = () => {
      if (mcpSocket !== socket) {
        PN.log('MCP WebSocket connected but socket was replaced, ignoring');
        socket.close();
        return;
      }

      PN.log('MCP WebSocket connected');

      mcpPeer = rawr({
        transport: transports.websocket(socket)
      });

      // --- MCP Handlers ---
      // These handle requests from the MCP bridge server.
      // Flow-editing operations proxy to a connected browser peer.
      // Runtime operations (inject, debug, etc.) are handled directly.

      mcpPeer.addHandler('getState', async () => {
        // Try browser peer first (has full editor state with unsaved changes)
        const bp = getActiveBrowserPeer();
        if (bp) {
          try { return await bp.methods.mcpGetState(); } catch { /* fall through */ }
        }
        // Fallback: use server flow state
        const nodeCatalog = runtimeRegistry.getAll().map(def => ({
          type: def.type,
          category: def.category,
          description: def.description || ''
        }));
        return {
          nodeCatalog,
          flows: serverFlowState.flows,
          nodes: serverFlowState.nodes,
          configNodes: serverFlowState.configNodes
        };
      });

      mcpPeer.addHandler('getFlows', async () => {
        // Try browser peer first (has unsaved changes)
        const bp = getActiveBrowserPeer();
        if (bp) {
          try { return await bp.methods.mcpGetFlows(); } catch { /* fall through */ }
        }
        return {
          flows: serverFlowState.flows,
          nodes: serverFlowState.nodes,
          configNodes: serverFlowState.configNodes
        };
      });

      mcpPeer.addHandler('createFlow', async (label) => {
        const newFlow = {
          id: generateId(),
          type: 'tab',
          label: label || `Flow ${serverFlowState.flows.length + 1}`
        };
        serverFlowState.flows.push(newFlow);
        await saveAndNotifyBrowsers();
        return { success: true, flow: newFlow };
      });

      mcpPeer.addHandler('addNode', async (args) => {
        const errors = [];
        if (!args || typeof args !== 'object') {
          return { success: false, errors: ['args must be an object'] };
        }

        const { type, flowId, x, y, name, config } = args;
        if (!type || typeof type !== 'string') {
          errors.push('type is required and must be a string');
        }

        const runtimeDef = type ? runtimeRegistry.get(type) : null;
        if (type && !runtimeDef) {
          errors.push(`Unknown node type: "${type}"`);
        }

        // Config nodes have no z (flow ID)
        const isConfigNode = !flowId;

        if (!isConfigNode) {
          if (!flowId || typeof flowId !== 'string') {
            errors.push('flowId is required for non-config nodes');
          } else {
            const flowExists = serverFlowState.flows.some(f => f.id === flowId);
            if (!flowExists) {
              errors.push(`Flow not found: "${flowId}"`);
            }
          }
        }

        if (errors.length > 0) {
          return { success: false, errors };
        }

        const newNode = {
          id: generateId(),
          type,
          name: name || '',
          ...(isConfigNode ? {} : { z: flowId, x: x || 100, y: y || 100 }),
          wires: [],
          ...config
        };

        if (isConfigNode) {
          serverFlowState.configNodes.push(newNode);
        } else {
          serverFlowState.nodes.push(newNode);
        }

        await saveAndNotifyBrowsers();
        return { success: true, node: newNode };
      });

      mcpPeer.addHandler('addNodes', async (flowId, nodesArr) => {
        const errors = [];
        const warnings = [];

        if (!Array.isArray(nodesArr)) {
          return { success: false, errors: ['nodes must be an array'] };
        }
        if (nodesArr.length === 0) {
          return { success: false, errors: ['nodes array cannot be empty'] };
        }

        if (!flowId || typeof flowId !== 'string') {
          errors.push('flowId is required and must be a string');
        } else {
          const flowExists = serverFlowState.flows.some(f => f.id === flowId);
          if (!flowExists) {
            errors.push(`Flow not found: "${flowId}"`);
          }
        }

        if (errors.length > 0) {
          return { success: false, errors };
        }

        // First pass: validate all nodes and collect tempIds
        const tempIds = new Set();
        for (let i = 0; i < nodesArr.length; i++) {
          const node = nodesArr[i];
          const nodeLabel = node.tempId || node.name || `node[${i}]`;

          if (!node || typeof node !== 'object') {
            errors.push(`${nodeLabel}: must be an object`);
            continue;
          }
          if (!node.type || typeof node.type !== 'string') {
            errors.push(`${nodeLabel}: type is required and must be a string`);
          }
          if (!node.tempId || typeof node.tempId !== 'string') {
            errors.push(`${nodeLabel}: tempId is required and must be a string`);
          } else if (tempIds.has(node.tempId)) {
            errors.push(`${nodeLabel}: duplicate tempId: "${node.tempId}"`);
          } else {
            tempIds.add(node.tempId);
          }

          const runtimeDef = node.type ? runtimeRegistry.get(node.type) : null;
          if (node.type && !runtimeDef) {
            errors.push(`${nodeLabel}: unknown node type: "${node.type}"`);
          }
        }

        if (errors.length > 0) {
          return { success: false, errors };
        }

        // Second pass: validate wires reference valid tempIds or existing nodes
        const existingNodeIds = new Set(serverFlowState.nodes.map(n => n.id));
        for (let i = 0; i < nodesArr.length; i++) {
          const node = nodesArr[i];
          const nodeLabel = node.tempId || `node[${i}]`;
          if (node.wires && Array.isArray(node.wires)) {
            for (let port = 0; port < node.wires.length; port++) {
              const outputWires = node.wires[port];
              if (!Array.isArray(outputWires)) {
                errors.push(`${nodeLabel}: wires[${port}] must be an array`);
                continue;
              }
              for (const targetId of outputWires) {
                if (typeof targetId !== 'string') {
                  errors.push(`${nodeLabel}: wire target must be a string`);
                } else if (!tempIds.has(targetId) && !existingNodeIds.has(targetId)) {
                  warnings.push(`${nodeLabel}: wire target "${targetId}" not found`);
                }
              }
            }
          }
        }

        if (errors.length > 0) {
          return { success: false, errors, warnings: warnings.length > 0 ? warnings : undefined };
        }

        // Third pass: generate real IDs and map tempIds
        const tempToReal = {};
        for (const node of nodesArr) {
          tempToReal[node.tempId] = generateId();
        }

        // Fourth pass: create nodes with mapped wires
        const createdNodes = [];
        for (const node of nodesArr) {
          const { tempId, type, x, y, name, wires, streamWires, ...config } = node;
          const realId = tempToReal[tempId];

          const mappedWires = (wires || []).map(outputWires =>
            (outputWires || []).map(targetTempId => tempToReal[targetTempId] || targetTempId)
          );

          const isConfigNode = !flowId;
          const newNode = {
            id: realId,
            type,
            name: name || '',
            ...(isConfigNode ? {} : { z: flowId, x: x || 100, y: y || 100 }),
            wires: mappedWires,
            ...config
          };

          if (streamWires) {
            newNode.streamWires = streamWires.map(outputWires =>
              (outputWires || []).map(targetTempId => tempToReal[targetTempId] || targetTempId)
            );
          }

          if (isConfigNode) {
            serverFlowState.configNodes.push(newNode);
          } else {
            serverFlowState.nodes.push(newNode);
          }

          createdNodes.push({ tempId, id: realId, node: newNode });
        }

        await saveAndNotifyBrowsers();

        const result = {
          success: true,
          nodes: createdNodes.map(({ tempId, id, node }) => ({ tempId, id, node }))
        };
        if (warnings.length > 0) {
          result.warnings = warnings;
        }
        return result;
      });

      mcpPeer.addHandler('updateNode', async (nodeId, updates) => {
        if (!nodeId || typeof nodeId !== 'string') {
          return { success: false, errors: ['nodeId is required and must be a string'] };
        }
        if (!updates || typeof updates !== 'object') {
          return { success: false, errors: ['updates is required and must be an object'] };
        }

        // Find node in serverFlowState (either regular or config)
        let nodeIdx = serverFlowState.nodes.findIndex(n => n.id === nodeId);
        let isConfig = false;
        if (nodeIdx === -1) {
          nodeIdx = serverFlowState.configNodes.findIndex(n => n.id === nodeId);
          isConfig = true;
        }
        if (nodeIdx === -1) {
          return { success: false, errors: [`Node not found: "${nodeId}"`] };
        }

        const arr = isConfig ? serverFlowState.configNodes : serverFlowState.nodes;
        arr[nodeIdx] = { ...arr[nodeIdx], ...updates };

        await saveAndNotifyBrowsers();
        return { success: true };
      });

      mcpPeer.addHandler('deleteNode', async (nodeId) => {
        if (!nodeId || typeof nodeId !== 'string') {
          return { success: false, errors: ['nodeId is required and must be a string'] };
        }

        // Try regular nodes first, then config nodes
        let found = false;
        const nodeIdx = serverFlowState.nodes.findIndex(n => n.id === nodeId);
        if (nodeIdx !== -1) {
          serverFlowState.nodes.splice(nodeIdx, 1);
          found = true;
        } else {
          const configIdx = serverFlowState.configNodes.findIndex(n => n.id === nodeId);
          if (configIdx !== -1) {
            serverFlowState.configNodes.splice(configIdx, 1);
            found = true;
          }
        }

        if (!found) {
          return { success: false, errors: [`Node not found: "${nodeId}"`] };
        }

        // Clean wires referencing deleted node
        for (const node of serverFlowState.nodes) {
          if (node.wires) {
            node.wires = node.wires.map(outputWires =>
              (outputWires || []).filter(id => id !== nodeId)
            );
          }
        }

        await saveAndNotifyBrowsers();
        return { success: true };
      });

      mcpPeer.addHandler('connectNodes', async (sourceId, targetId, sourcePort = 0) => {
        const errors = [];
        if (!sourceId || typeof sourceId !== 'string') errors.push('sourceId is required');
        if (!targetId || typeof targetId !== 'string') errors.push('targetId is required');
        if (typeof sourcePort !== 'number' || sourcePort < 0) errors.push('sourcePort must be non-negative');
        if (errors.length > 0) return { success: false, errors };

        const sourceNode = serverFlowState.nodes.find(n => n.id === sourceId);
        if (!sourceNode) return { success: false, errors: [`Source node not found: "${sourceId}"`] };
        const targetNode = serverFlowState.nodes.find(n => n.id === targetId);
        if (!targetNode) return { success: false, errors: [`Target node not found: "${targetId}"`] };

        if (!sourceNode.wires) sourceNode.wires = [];
        while (sourceNode.wires.length <= sourcePort) sourceNode.wires.push([]);
        if (!sourceNode.wires[sourcePort].includes(targetId)) {
          sourceNode.wires[sourcePort].push(targetId);
        }

        await saveAndNotifyBrowsers();
        return { success: true };
      });

      mcpPeer.addHandler('disconnectNodes', async (sourceId, targetId, sourcePort = 0) => {
        const sourceNode = serverFlowState.nodes.find(n => n.id === sourceId);
        if (!sourceNode) return { success: false, errors: ['Source node not found'] };

        if (sourceNode.wires && sourceNode.wires[sourcePort]) {
          sourceNode.wires[sourcePort] = sourceNode.wires[sourcePort].filter(id => id !== targetId);
        }

        await saveAndNotifyBrowsers();
        return { success: true };
      });

      mcpPeer.addHandler('deploy', async () => {
        try {
          if (storageRef) {
            await storageRef.saveFlows(serverFlowState);
          }
          const result = await deployFlowsFromStorage(serverFlowState);
          notifyAllBrowsers('flowsChanged', null);
          return { success: true, ...result };
        } catch (err) {
          return { success: false, errors: [err.message] };
        }
      });

      // Runtime operations - handled directly by server
      mcpPeer.addHandler('getDebugOutput', (limit = 10) => {
        return debugMessages.slice(0, limit);
      });

      mcpPeer.addHandler('getErrors', (limit = 10) => {
        return errorMessages.slice(0, limit);
      });

      mcpPeer.addHandler('getLogs', (limit = 100, ctx = null, level = null) => {
        return PN.getLogs ? PN.getLogs(limit, ctx, level) : [];
      });

      mcpPeer.addHandler('clearLogs', () => {
        if (PN.clear) PN.clear();
        return { success: true };
      });

      mcpPeer.addHandler('getInjectNodes', async () => {
        // Try browser peer first for full state
        const bp = getActiveBrowserPeer();
        if (bp) {
          try { return await bp.methods.mcpGetInjectNodes(); } catch { /* fall through */ }
        }
        // Fallback: check active nodes
        const injectNodes = [];
        for (const node of nodes.values()) {
          if (node.type === 'inject') {
            injectNodes.push({
              id: node.id,
              name: node.name || 'inject',
              flowId: node.z,
              payload: node.config.payload,
              payloadType: node.config.payloadType,
              topic: node.config.topic
            });
          }
        }
        return injectNodes;
      });

      mcpPeer.addHandler('inject', (nodeId, payload) => {
        const msg = (payload !== undefined && payload !== null) ? { payload } : {};
        return injectNode(nodeId, msg);
      });

      mcpPeer.addHandler('trigger', (nodeId, msg) => {
        const message = (msg !== undefined && msg !== null) ? msg : {};
        return triggerNode(nodeId, message);
      });

      mcpPeer.addHandler('clearDebug', () => {
        debugMessages.length = 0;
        return { success: true };
      });

      mcpPeer.addHandler('clearErrors', () => {
        errorMessages.length = 0;
        return { success: true };
      });

      mcpPeer.addHandler('getNodeStatuses', async () => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          try { return await bp.methods.mcpGetNodeStatuses(); } catch { /* fall through */ }
        }
        return {};
      });

      mcpPeer.addHandler('getCanvasSvg', async () => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          try { return await bp.methods.mcpGetCanvasSvg(); } catch { /* fall through */ }
        }
        return { success: false, errors: ['No browser connected - canvas SVG requires the editor UI'] };
      });

      mcpPeer.addHandler('getNodeDetails', async (type) => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          try { return await bp.methods.mcpGetNodeDetails(type); } catch { /* fall through */ }
        }
        // Fallback: basic info from registry
        const nodeDef = runtimeRegistry.get(type);
        if (!nodeDef) {
          throw new Error(`Unknown node type: ${type}`);
        }
        return {
          type: nodeDef.type,
          category: nodeDef.category,
          description: nodeDef.description || '',
          inputs: nodeDef.inputs,
          outputs: nodeDef.outputs
        };
      });

      mcpPeer.addHandler('getMessages', (limit = 100, clear = true) => {
        const messages = mcpMessageQueue.slice(0, limit);
        if (clear && messages.length > 0) {
          mcpMessageQueue.splice(0, messages.length);
          // Update mcp-output node statuses
          const remainingByNode = {};
          for (const msg of mcpMessageQueue) {
            remainingByNode[msg.nodeId] = (remainingByNode[msg.nodeId] || 0) + 1;
          }
          for (const node of nodes.values()) {
            if (node.type === 'mcp-output') {
              const count = remainingByNode[node.id] || 0;
              node.emit('queueUpdate', { count });
            }
          }
        }
        return messages;
      });

      mcpPeer.addHandler('sendMessage', (payload, topic = '') => {
        let count = 0;
        for (const node of nodes.values()) {
          if (node.type === 'mcp-input') {
            node.emit('mcpMessage', { payload, topic });
            count++;
          }
        }
        if (count === 0) {
          return { success: false, error: 'No mcp-input nodes found in flows' };
        }
        return { success: true, nodeCount: count };
      });

      // Register this device with the MCP bridge
      const nodeCatalog = runtimeRegistry.getAll().map(def => ({
        type: def.type,
        category: def.category,
        description: def.description || ''
      }));
      const nodeTypes = nodeCatalog.map(n => n.type);

      mcpPeer.methods.registerDevice({
        type: 'nodejs',
        name: mcpClientUrl ? new URL(mcpClientUrl).hostname : `PageNodes Server (${os.hostname()})`,
        description: 'PageNodes Node.js server instance',
        url: mcpClientUrl || null,
        nodes: nodeTypes,
        meta: {
          runtime: 'pagenodes',
          hostname: os.hostname()
        }
      }).catch(err => {
        PN.warn('registerDevice failed, trying legacy registerClient:', err.message);
        mcpPeer.methods.registerClient({ url: mcpClientUrl }).catch(err2 => {
          PN.warn('Failed to register with MCP server:', err2);
        });
      });

      notifyAllBrowsers('mcpStatus', { status: 'connected' });
      broadcastMcpStatus('connected');
    };

    socket.onclose = () => {
      if (mcpSocket !== socket) return;
      PN.log('MCP WebSocket closed');
      notifyAllBrowsers('mcpStatus', { status: 'error' });
      broadcastMcpStatus('error');
      mcpSocket = null;
      mcpPeer = null;
      if (mcpPort) {
        mcpReconnectTimer = setTimeout(() => connectMcp({ port: mcpPort, url: mcpClientUrl }), 3000);
      }
    };

    socket.onerror = (err) => {
      if (mcpSocket !== socket) return;
      PN.error('MCP WebSocket error:', err.message || err);
      notifyAllBrowsers('mcpStatus', { status: 'error' });
      broadcastMcpStatus('error');
    };

    return { success: true };
  } catch (err) {
    PN.error('MCP Failed to connect:', err);
    notifyAllBrowsers('mcpStatus', { status: 'error' });
    broadcastMcpStatus('error');
    return { success: false, error: err.message };
  }
}

/**
 * Disconnect from MCP server
 */
function disconnectMcp() {
  mcpPort = null;

  if (mcpReconnectTimer) {
    clearTimeout(mcpReconnectTimer);
    mcpReconnectTimer = null;
  }

  if (mcpSocket) {
    mcpSocket.close();
    mcpSocket = null;
  }

  mcpPeer = null;
  notifyAllBrowsers('mcpStatus', { status: 'disabled' });
  broadcastMcpStatus('disabled');
}

/**
 * Get list of available node types
 */
export function getNodeTypes() {
  return runtimeRegistry.getAll().map(def => ({
    type: def.type,
    category: def.category,
    runtime: def.runtime || 'isomorphic'
  }));
}

/**
 * Set storage reference and optionally auto-connect MCP based on saved settings
 */
export async function initMcp(storage) {
  storageRef = storage;
  try {
    const settings = await storage.getSettings();
    if (settings.mcpEnabled && settings.mcpPort) {
      PN.log(`Auto-connecting MCP on port ${settings.mcpPort}`);
      connectMcp({ port: settings.mcpPort });
    }
  } catch (err) {
    PN.warn('Failed to load MCP settings:', err);
  }
}

/**
 * Queue an MCP output message (called by mcp-output nodes)
 */
export function queueMcpMessage(msg) {
  mcpMessageQueue.push(msg);
  if (mcpMessageQueue.length > MAX_BUFFER_SIZE) mcpMessageQueue.shift();
}

/**
 * Load and cache the password hash from storage
 */
export async function loadPasswordHash(storage) {
  const settings = await storage.getSettings();
  cachedPasswordHash = settings.password || null;
  return { required: !!cachedPasswordHash };
}

/**
 * Check if auth is required
 */
export function isAuthRequired() {
  return !!cachedPasswordHash;
}

/**
 * Verify a password and return a session token if correct
 */
export async function verifyPassword(password) {
  if (!cachedPasswordHash) {
    return { success: true, sessionToken: createSessionToken() };
  }
  try {
    const match = await bcrypt.compare(password, cachedPasswordHash);
    if (match) {
      return { success: true, sessionToken: createSessionToken() };
    }
    return { success: false, error: 'Incorrect password' };
  } catch (err) {
    PN.warn(`Auth error: ${err.message}`);
    return { success: false, error: 'Authentication error' };
  }
}

/**
 * Validate a session token
 */
export { validateSessionToken };

PN.log('Server runtime initialized');
PN.log(`Available node types: ${runtimeRegistry.getAll().length}`);
