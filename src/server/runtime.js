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
import os from 'os';
import { generateId } from '../utils/id.js';
import { runtimeRegistry } from './runtime-registry.js';
import { createLogger } from '../utils/logger.js';

// Make mqtt and io available globally for runtime implementations
globalThis.mqtt = mqtt;
globalThis.io = io;

// Server-side logger
const PN = createLogger('server');
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
    const msg = {
      nodeId: this.id,
      nodeName: this.name || this.type,
      payload: output,
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
  for (const { peer } of browserPeers.values()) {
    try {
      peer.notifiers[notification](data);
    } catch {
      // Browser may have disconnected
    }
  }
}


/**
 * Deploy flows from storage format (used on server startup)
 */
export async function deployFlowsFromStorage(flowConfig) {
  if (!flowConfig || !Array.isArray(flowConfig)) {
    return { nodeCount: 0, configCount: 0, skippedCount: 0 };
  }

  // Separate flows, config nodes, and regular nodes
  const flowNodes = [];
  const flowConfigNodes = [];

  for (const item of flowConfig) {
    if (item.type === 'tab') {
      // Flow tabs are not deployed as nodes
      continue;
    }

    // Convert to runtime format with _node wrapper
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

    // Check if this is a config node (no z property means it's a config node)
    if (!item.z) {
      flowConfigNodes.push(nodeDef);
    } else {
      flowNodes.push(nodeDef);
    }
  }

  return deployFlows(flowNodes, flowConfigNodes, []);
}

/**
 * Handle a new browser WebSocket connection
 */
export function handleBrowserConnection(socket, storage, log = console.log) {
  storageRef = storage;
  const peerId = generateId();
  log(`Browser connected: ${peerId}`);

  const transport = transports.websocket(socket);
  const peer = rawr({ transport });

  browserPeers.set(peerId, { peer, socket, transport });

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
    return { success: true };
  });
  peer.addHandler('getCredentials', () => storage.getCredentials());
  peer.addHandler('saveCredentials', async (creds) => {
    await storage.saveCredentials(creds);
    return { success: true };
  });
  peer.addHandler('getSettings', () => storage.getSettings());
  peer.addHandler('saveSettings', async (settings) => {
    await storage.saveSettings(settings);
    return { success: true };
  });

  // Handlers for browser delegation back to server
  peer.addHandler('sendResult', (nodeId, msg) => handleMainThreadResult(nodeId, msg));
  peer.addHandler('emitEvent', (nodeId, event, data) => handleMainThreadEvent(nodeId, event, data));
  peer.addHandler('broadcastToType', (type, event, data) => broadcastToType(type, event, data));

  // Notify browser that runtime is ready
  peer.notifiers.ready();

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
        // Try browser peer first (has full editor state)
        const bp = getActiveBrowserPeer();
        if (bp) {
          try { return await bp.methods.mcpGetState(); } catch { /* fall through */ }
        }
        // Fallback: build state from server knowledge
        const nodeCatalog = runtimeRegistry.getAll().map(def => ({
          type: def.type,
          category: def.category,
          description: def.description || ''
        }));
        const savedFlows = storageRef ? await storageRef.getFlows() : null;
        return {
          nodeCatalog,
          flows: savedFlows?.flows || [],
          nodes: savedFlows?.nodes || [],
          configNodes: savedFlows?.configNodes || []
        };
      });

      mcpPeer.addHandler('getFlows', async () => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          try { return await bp.methods.mcpGetFlows(); } catch { /* fall through */ }
        }
        const savedFlows = storageRef ? await storageRef.getFlows() : null;
        return {
          flows: savedFlows?.flows || [],
          nodes: savedFlows?.nodes || [],
          configNodes: savedFlows?.configNodes || []
        };
      });

      mcpPeer.addHandler('createFlow', async (label) => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          return await bp.methods.mcpCreateFlow(label);
        }
        return { success: false, errors: ['No browser connected - flow editing requires the editor UI'] };
      });

      mcpPeer.addHandler('addNode', async (args) => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          return await bp.methods.mcpAddNode(args);
        }
        return { success: false, errors: ['No browser connected - flow editing requires the editor UI'] };
      });

      mcpPeer.addHandler('addNodes', async (flowId, nodesArr) => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          return await bp.methods.mcpAddNodes(flowId, nodesArr);
        }
        return { success: false, errors: ['No browser connected - flow editing requires the editor UI'] };
      });

      mcpPeer.addHandler('updateNode', async (nodeId, updates) => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          return await bp.methods.mcpUpdateNode(nodeId, updates);
        }
        return { success: false, errors: ['No browser connected - flow editing requires the editor UI'] };
      });

      mcpPeer.addHandler('deleteNode', async (nodeId) => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          return await bp.methods.mcpDeleteNode(nodeId);
        }
        return { success: false, errors: ['No browser connected - flow editing requires the editor UI'] };
      });

      mcpPeer.addHandler('connectNodes', async (sourceId, targetId, sourcePort) => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          return await bp.methods.mcpConnectNodes(sourceId, targetId, sourcePort);
        }
        return { success: false, errors: ['No browser connected - flow editing requires the editor UI'] };
      });

      mcpPeer.addHandler('disconnectNodes', async (sourceId, targetId, sourcePort) => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          return await bp.methods.mcpDisconnectNodes(sourceId, targetId, sourcePort);
        }
        return { success: false, errors: ['No browser connected - flow editing requires the editor UI'] };
      });

      mcpPeer.addHandler('deploy', async () => {
        const bp = getActiveBrowserPeer();
        if (bp) {
          return await bp.methods.mcpDeploy();
        }
        return { success: false, errors: ['No browser connected - deploy requires the editor UI'] };
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

PN.log('Server runtime initialized');
PN.log(`Available node types: ${runtimeRegistry.getAll().length}`);
