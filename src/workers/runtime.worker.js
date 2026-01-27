/**
 * PageNodes 2 Runtime Worker
 *
 * Node structure:
 * {
 *   _node: { id, type, name, z, x, y, wires },  // reserved props
 *   ...config  // custom config at top level
 * }
 */

import rawr, { transports } from 'rawr';
import { generateId } from '../utils/id.js';
import mqtt from 'mqtt';
import { io } from 'socket.io-client';
import { runtimeRegistry } from '../nodes/runtime.js';
import { createWorkerLogger } from '../utils/logger.js';

// Make mqtt and io available globally for runtime implementations
self.mqtt = mqtt;
self.io = io;

// Set up rawr peer for RPC communication
let peer;

// Worker-side logger that syncs to main thread
let PN;

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

  // Notify UI/MCP about the error
  peer.notifiers.error({
    nodeId: sourceNode.id,
    nodeName: sourceNode.name || sourceNode.type,
    nodeType: sourceNode.type,
    message: errorText,
    stack: errorMessage.error.stack,
    _msgid,
    timestamp: Date.now()
  });

  // Find matching catch nodes
  // First try non-uncaught catch nodes, then uncaught
  let handled = false;

  // Sort: regular catch nodes first, then uncaught
  const sortedCatchNodes = [...catchNodes].sort((a, b) => {
    const aUncaught = a.config.scope === 'uncaught' ? 1 : 0;
    const bUncaught = b.config.scope === 'uncaught' ? 1 : 0;
    return aUncaught - bUncaught;
  });

  for (const catchNode of sortedCatchNodes) {
    const scope = catchNode.config.scope || 'all';

    // Skip uncaught-only nodes if already handled
    if (scope === 'uncaught' && handled) {
      continue;
    }

    // Route error to catch node
    try {
      catchNode.send(errorMessage);
      handled = true;

      // If this is a regular (non-uncaught) catch node, mark as handled
      if (scope !== 'uncaught') {
        break; // Only first regular catch node handles it
      }
    } catch (e) {
      PN.error('Error in catch node:', e);
    }
  }

  return handled;
}

/**
 * Compare two config nodes to see if connection-relevant properties changed.
 * Ignores cosmetic properties like name, position.
 * Returns true if configs are equivalent (no reconnection needed).
 */
function configsEqual(prevNode, newNode) {
  if (!prevNode || !newNode) return false;
  if (prevNode._node.type !== newNode._node.type) return false;

  // Get config properties (everything except _node)
  const prevConfig = { ...prevNode };
  const newConfig = { ...newNode };
  delete prevConfig._node;
  delete newConfig._node;

  // Compare serialized config (handles nested objects)
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
    // Reserved props from _node
    this.id = nodeDef._node.id;
    this.type = nodeDef._node.type;
    this.name = nodeDef._node.name || '';
    this.z = nodeDef._node.z;
    this.wires = nodeDef._node.wires || [];

    // Config props from top level
    this.config = { ...nodeDef };
    delete this.config._node;

    this._closeCallbacks = [];
    this._eventListeners = new Map();
    this._context = new Map(); // Node-local context storage

    // Pre-create context object for performance (avoid creating on every onInput)
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

    // Bind runtime methods from definition
    if (runtimeDef) {
      if (runtimeDef.onInit) this.onInit = runtimeDef.onInit.bind(this);
      if (runtimeDef.onInput) this.onInput = runtimeDef.onInput.bind(this);
      if (runtimeDef.onClose) this._onClose = runtimeDef.onClose.bind(this);

      // Bind any additional methods from runtime definition
      for (const key of Object.keys(runtimeDef)) {
        if (key !== 'type' && key !== 'onInit' && key !== 'onInput' && key !== 'onClose' && typeof runtimeDef[key] === 'function') {
          this[key] = runtimeDef[key].bind(this);
        }
      }
    }
  }

  send(msg) {
    if (!msg) return;

    // Don't send if this node has errors
    if (errorNodeIds.has(this.id)) return;

    // Normalize to array of arrays
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
          // Skip sending to error nodes
          if (errorNodeIds.has(targetId)) continue;

          const targetNode = nodes.get(targetId);
          if (targetNode) {
            // Pass message directly - no need to clone within same worker context
            setTimeout(() => targetNode.receive(m), 0);
          }
        }
      }
    }
  }

  receive(msg) {
    // Clear error status when node receives new input
    if (this._hasErrorStatus) {
      this._hasErrorStatus = false;
      this.status({});
    }
    try {
      if (this.onInput) {
        const result = this.onInput(msg);
        // Handle async onInput
        if (result instanceof Promise) {
          result.catch(err => this.error(err.message, msg));
        }
      }
    } catch (err) {
      this.error(err.message, msg);
    }
  }

  log(text) {
    peer.notifiers.log({ nodeId: this.id, level: 'info', text });
  }

  warn(text) {
    peer.notifiers.log({ nodeId: this.id, level: 'warn', text });
  }

  error(text, msg, errorObj) {
    peer.notifiers.log({ nodeId: this.id, level: 'error', text });
    // Set error status on the node
    this._hasErrorStatus = true;
    const errorText = typeof text === 'string' ? text : (text?.message || 'error');
    this.status({ fill: 'red', shape: 'dot', text: errorText });
    // Route error to catch nodes
    handleError(this, text, msg, errorObj || (text instanceof Error ? text : null));
  }

  debug(output, topic = '', _msgid) {
    peer.notifiers.debug({
      nodeId: this.id,
      nodeName: this.name || this.type,
      payload: output,
      topic,
      _msgid
    });
  }

  status(status) {
    peer.notifiers.status({ nodeId: this.id, status });
  }

  /**
   * Send a file to the debug panel for download
   * @param {object} opts - { filename, content, mimeType }
   */
  notifyDownload({ filename, content, mimeType }) {
    peer.notifiers.download({
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

  /**
   * Get a config node by ID
   * @param {string} id - Config node ID
   * @returns {object|undefined} - Config node data or undefined
   */
  getConfigNode(id) {
    return configNodes.get(id);
  }

  /**
   * Get an active node instance by ID
   * @param {string} id - Node ID
   * @returns {RuntimeNode|undefined} - Node instance or undefined
   */
  getNode(id) {
    return nodes.get(id);
  }

  /**
   * Request main thread to execute an action (fire-and-forget)
   * @param {string} action - Action name
   * @param {object} params - Parameters for the action
   */
  mainThread(action, params = {}) {
    peer.notifiers.mainThreadRequest({
      nodeId: this.id,
      nodeType: this.type,
      action,
      params
    });
  }

  /**
   * Request main thread to execute an action and return result
   * @param {string} action - Action name
   * @param {object} params - Parameters for the action
   * @returns {Promise<any>} Result from main thread
   */
  async mainThreadCall(action, params = {}) {
    return await peer.methods.mainThreadCall({
      nodeId: this.id,
      nodeType: this.type,
      action,
      params
    });
  }

  on(event, callback) {
    if (event === 'close') {
      this._closeCallbacks.push(callback);
    } else {
      // Generic event emitter support for config nodes
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
    // Call runtime-defined onClose if present
    if (this._onClose) {
      try {
        this._onClose();
      } catch (e) {
        PN.error('Error in onClose', e);
      }
    }

    // Call registered close callbacks
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

  return new RuntimeNode(nodeDef, runtimeDef);
}

/**
 * Deploy flows - called from main thread
 * Optimized to skip reinitializing config nodes that haven't changed.
 */
async function deployFlows(flowNodes, flowConfigNodes = [], skipNodeIds = []) {
  // Store error node IDs
  errorNodeIds = new Set(skipNodeIds);

  // Track which config nodes are unchanged (don't need reinit)
  const unchangedConfigIds = new Set();
  const incomingConfigIds = new Set(flowConfigNodes.map(c => c._node.id));

  // Determine which config nodes have changed
  for (const configNode of flowConfigNodes) {
    const prevState = previousConfigStates.get(configNode._node.id);
    if (prevState && configsEqual(prevState, configNode)) {
      // Config unchanged - keep existing instance
      unchangedConfigIds.add(configNode._node.id);
      PN.log(`[deploy] Config node ${configNode._node.id} (${configNode._node.type}) unchanged, keeping connection`);
    }
  }

  // Close regular nodes (they always get recreated)
  for (const [id, node] of nodes.entries()) {
    // Skip config node instances - handled separately
    if (configNodes.has(id)) continue;
    try {
      node.close();
    } catch (e) {
      PN.error('Error closing node', id, e);
    }
  }

  // Close config nodes that were removed or changed
  for (const [id, configData] of configNodes.entries()) {
    const wasRemoved = !incomingConfigIds.has(id);
    const wasChanged = !unchangedConfigIds.has(id);

    if (wasRemoved || wasChanged) {
      const instance = nodes.get(id);
      if (instance) {
        try {
          PN.log(`[deploy] Closing config node ${id} (${configData.type}) - ${wasRemoved ? 'removed' : 'changed'}`);
          instance.close();
        } catch (e) {
          PN.error('Error closing config node', id, e);
        }
        nodes.delete(id);
      }
      previousConfigStates.delete(id);
    }
  }

  // Clear non-config nodes from nodes map (keep unchanged config instances)
  for (const id of nodes.keys()) {
    if (!unchangedConfigIds.has(id)) {
      nodes.delete(id);
    }
  }

  // Update configNodes map with new data
  configNodes.clear();
  for (const configNode of flowConfigNodes) {
    configNodes.set(configNode._node.id, {
      id: configNode._node.id,
      type: configNode._node.type,
      name: configNode._node.name,
      ...configNode
    });
  }

  // Create and init NEW or CHANGED config node instances (skip unchanged and error nodes)
  for (const configNode of flowConfigNodes) {
    if (errorNodeIds.has(configNode._node.id)) continue;
    if (unchangedConfigIds.has(configNode._node.id)) {
      // Store state for unchanged nodes too (in case props like name changed)
      storeConfigState(configNode);
      continue;
    }

    const node = createNode(configNode);
    nodes.set(node.id, node);
    storeConfigState(configNode);
  }

  // Initialize NEW or CHANGED config nodes
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

  // Create regular node instances (skip error nodes)
  for (const nodeDef of flowNodes) {
    if (errorNodeIds.has(nodeDef._node.id)) continue;
    const node = createNode(nodeDef);
    nodes.set(node.id, node);
  }

  // Initialize all regular nodes (skip error nodes)
  // Collect async onInit promises to await them all
  const initPromises = [];
  for (const nodeDef of flowNodes) {
    if (errorNodeIds.has(nodeDef._node.id)) continue;
    const node = nodes.get(nodeDef._node.id);
    if (node && node.onInit) {
      try {
        const result = node.onInit();
        // If onInit returns a promise, track it
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

  // Wait for all async onInit to complete
  if (initPromises.length > 0) {
    await Promise.all(initPromises);
  }

  // Populate catch nodes array for error routing
  catchNodes = [];
  for (const node of nodes.values()) {
    if (node.type === 'catch') {
      catchNodes.push(node);
    }
  }
  PN.log(`Deploy complete: found ${catchNodes.length} catch node(s) for error routing`);

  // Broadcast current MCP status to any newly deployed MCP nodes
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
 * Returns { success, _msgid } for tracing
 */
function injectNode(nodeId, msg = {}) {
  // Skip error nodes
  if (errorNodeIds.has(nodeId)) {
    PN.warn('Cannot inject into error node:', nodeId);
    return { success: false, error: 'Node has errors' };
  }

  const node = nodes.get(nodeId);
  if (!node) {
    PN.warn('Node not found:', nodeId);
    return { success: false, error: 'Node not found' };
  }

  // Generate a message ID for tracing
  const _msgid = generateId();

  // For inject nodes, build message from node config or override with provided payload
  if (node.type === 'inject') {
    let payload;
    if (msg.payload !== undefined) {
      // Use provided payload
      payload = msg.payload;
    } else {
      // Use node's configured payload
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
    // For other nodes, receive the message
    node.receive({ _msgid, ...msg });
  }

  return { success: true, _msgid };
}

/**
 * Inject text to all inject nodes with allowDebugInput enabled
 */
function injectText(text) {
  for (const node of nodes.values()) {
    if (node.type === 'inject' && node.config.allowDebugInput) {
      node.send({
        topic: node.config.topic || '',
        payload: text
      });
    }
  }
}

/**
 * Trigger any node by sending a message to its input
 * Unlike injectNode, this works with ANY node type
 * Returns { success, _msgid } for tracing
 */
function triggerNode(nodeId, msg = {}) {
  // Skip error nodes
  if (errorNodeIds.has(nodeId)) {
    return { success: false, error: 'Node has errors' };
  }

  const node = nodes.get(nodeId);
  if (!node) {
    return { success: false, error: 'Node not found' };
  }

  // Generate a message ID for tracing
  const _msgid = msg._msgid || generateId();

  // Send the message to the node's input
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
}

/**
 * Handle result from main thread (for nodes that delegate to main thread)
 */
function handleMainThreadResult(nodeId, result) {
  const node = nodes.get(nodeId);
  if (node) {
    node.send(result);
  }
}

/**
 * Handle events from main thread for specific node types
 * Special handling for 'error' events - route to node.error() for catch node support
 */
function handleMainThreadEvent(nodeId, event, data) {
  const node = nodes.get(nodeId);
  if (node) {
    // Route 'error' events through node.error() so catch nodes can handle them
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
 * Used for buttons panel, etc.
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
 * Broadcast MCP connection status to all mcp-input and mcp-output nodes
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
 * Get current MCP connection status
 */
function getMcpStatus() {
  return mcpCurrentStatus;
}

// MCP WebSocket connection
let mcpSocket = null;
let mcpPeer = null;
let mcpReconnectTimer = null;
let mcpPort = null;
let mcpClientUrl = null;
let mcpCurrentStatus = 'disabled'; // Track current status for queries

/**
 * Connect to MCP server
 * @param {object} options - { port: number, url: string }
 */
function connectMcp(options) {
  // Support both old (port only) and new ({ port, url }) signatures
  const port = typeof options === 'object' ? options.port : options;
  const url = typeof options === 'object' ? options.url : null;

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

  peer.notifiers.mcpStatus({ status: 'connecting' });
  broadcastMcpStatus('connecting');

  try {
    const socket = new WebSocket(`ws://localhost:${port}`);
    mcpSocket = socket;

    socket.onopen = () => {
      // Check if this socket is still the active one (race condition protection)
      if (mcpSocket !== socket) {
        PN.log('MCP WebSocket connected but socket was replaced, ignoring');
        socket.close();
        return;
      }

      PN.log('mcp WebSocket connected');

      // Create rawr peer over the WebSocket
      mcpPeer = rawr({
        transport: transports.websocket(socket)
      });

      // Register handlers for MCP server to call
      mcpPeer.addHandler('getState', async () => {
        return await peer.methods.mcpGetState();
      });

      mcpPeer.addHandler('getFlows', async () => {
        return await peer.methods.mcpGetFlows();
      });

      mcpPeer.addHandler('createFlow', async (label) => {
        return await peer.methods.mcpCreateFlow(label);
      });

      mcpPeer.addHandler('addNode', async (args) => {
        return await peer.methods.mcpAddNode(args);
      });

      mcpPeer.addHandler('addNodes', async (flowId, nodes) => {
        return await peer.methods.mcpAddNodes(flowId, nodes);
      });

      mcpPeer.addHandler('updateNode', async (nodeId, updates) => {
        return await peer.methods.mcpUpdateNode(nodeId, updates);
      });

      mcpPeer.addHandler('deleteNode', async (nodeId) => {
        return await peer.methods.mcpDeleteNode(nodeId);
      });

      mcpPeer.addHandler('connectNodes', async (sourceId, targetId, sourcePort) => {
        return await peer.methods.mcpConnectNodes(sourceId, targetId, sourcePort);
      });

      mcpPeer.addHandler('disconnectNodes', async (sourceId, targetId, sourcePort) => {
        return await peer.methods.mcpDisconnectNodes(sourceId, targetId, sourcePort);
      });

      mcpPeer.addHandler('deploy', async () => {
        return await peer.methods.mcpDeploy();
      });

      mcpPeer.addHandler('getDebugOutput', async (limit) => {
        return await peer.methods.mcpGetDebugOutput(limit);
      });

      mcpPeer.addHandler('getErrors', async (limit) => {
        return await peer.methods.mcpGetErrors(limit);
      });

      mcpPeer.addHandler('getLogs', async (limit, context, level) => {
        return await peer.methods.mcpGetLogs(limit, context, level);
      });

      mcpPeer.addHandler('clearLogs', async () => {
        return await peer.methods.mcpClearLogs();
      });

      mcpPeer.addHandler('getInjectNodes', async () => {
        return await peer.methods.mcpGetInjectNodes();
      });

      mcpPeer.addHandler('inject', async (nodeId, payload) => {
        return await peer.methods.mcpInject(nodeId, payload);
      });

      mcpPeer.addHandler('trigger', async (nodeId, msg) => {
        return await peer.methods.mcpTrigger(nodeId, msg);
      });

      mcpPeer.addHandler('clearDebug', async () => {
        return await peer.methods.mcpClearDebug();
      });

      mcpPeer.addHandler('clearErrors', async () => {
        return await peer.methods.mcpClearErrors();
      });

      mcpPeer.addHandler('getNodeStatuses', async () => {
        return await peer.methods.mcpGetNodeStatuses();
      });

      mcpPeer.addHandler('getCanvasSvg', async () => {
        return await peer.methods.mcpGetCanvasSvg();
      });

      mcpPeer.addHandler('getNodeDetails', async (type) => {
        return await peer.methods.mcpGetNodeDetails(type);
      });

      mcpPeer.addHandler('getMessages', async (limit, clear) => {
        return await peer.methods.mcpGetMessages(limit, clear);
      });

      mcpPeer.addHandler('sendMessage', async (payload, topic) => {
        return await peer.methods.mcpSendMessage(payload, topic);
      });

      // Register this device with the MCP server (Ainura multi-device architecture)
      // Just send node names - Claude uses get_node_details for implementation specifics
      peer.methods.mcpGetState().then(state => {
        const nodeTypes = (state.nodeCatalog || []).map(n => n.type);

        // Detect environment and build meta info for user identification
        // Browser: userAgent helps identify Chrome vs Firefox, etc.
        // Node/Electron: hostname helps identify the machine
        // Note: In web workers, we detect Node.js/Electron via globalThis.process
        const nodeProcess = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
        const isBrowser = typeof navigator !== 'undefined';
        const isNode = nodeProcess?.versions?.node;
        const isElectron = nodeProcess?.versions?.electron;

        let deviceType = 'browser';
        const meta = { runtime: 'pagenodes' };

        if (isElectron) {
          deviceType = 'electron';
          // Electron has access to Node.js APIs - hostname via globalThis
          if (typeof globalThis !== 'undefined' && globalThis.require) {
            try {
              const os = globalThis.require('os');
              meta.hostname = os.hostname();
            } catch { /* ignore if os not available */ }
          }
          if (typeof navigator !== 'undefined') {
            meta.userAgent = navigator.userAgent;
          }
        } else if (isNode) {
          deviceType = 'nodejs';
          if (typeof globalThis !== 'undefined' && globalThis.require) {
            try {
              const os = globalThis.require('os');
              meta.hostname = os.hostname();
            } catch { /* ignore if os not available */ }
          }
        } else if (isBrowser) {
          meta.userAgent = navigator.userAgent;
        }

        mcpPeer.methods.registerDevice({
          type: deviceType,
          name: mcpClientUrl ? new URL(mcpClientUrl).hostname : `PageNodes ${deviceType}`,
          description: `PageNodes ${deviceType} instance`,
          url: mcpClientUrl || null,
          nodes: nodeTypes,  // Just the names - details come from get_node_details
          meta
        }).catch(err => {
          // Fall back to legacy registration for older MCP servers
          PN.warn('registerDevice failed, trying legacy registerClient:', err.message);
          mcpPeer.methods.registerClient({ url: mcpClientUrl }).catch(err2 => {
            PN.warn('Failed to register with MCP server:', err2);
          });
        });
      }).catch(err => {
        PN.warn('Failed to get state for device registration:', err);
        // Still try to register with basic info
        mcpPeer.methods.registerClient({ url: mcpClientUrl }).catch(() => {});
      });

      peer.notifiers.mcpStatus({ status: 'connected' });
      broadcastMcpStatus('connected');
    };

    socket.onclose = () => {
      // Only handle if this is still the active socket
      if (mcpSocket !== socket) return;

      PN.log('mcp WebSocket closed');
      peer.notifiers.mcpStatus({ status: 'error' });
      broadcastMcpStatus('error');
      mcpSocket = null;
      mcpPeer = null;
      // Try to reconnect after 3 seconds
      if (mcpPort) {
        mcpReconnectTimer = setTimeout(() => connectMcp({ port: mcpPort, url: mcpClientUrl }), 3000);
      }
    };

    socket.onerror = (err) => {
      // Only handle if this is still the active socket
      if (mcpSocket !== socket) return;

      PN.error('mcp WebSocket error:', err);
      peer.notifiers.mcpStatus({ status: 'error' });
      broadcastMcpStatus('error');
    };
  } catch (err) {
    PN.error('mcp Failed to connect:', err);
    peer.notifiers.mcpStatus({ status: 'error' });
    broadcastMcpStatus('error');
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
  peer.notifiers.mcpStatus({ status: 'disabled' });
  broadcastMcpStatus('disabled');
}

// Initialize rawr peer
peer = rawr({
  transport: transports.worker(self)
});

// Initialize worker logger that syncs to main thread
PN = createWorkerLogger('worker', (entries) => {
  peer.notifiers.logs(entries);
});

PN.mode = 'browser';

// Make PN available globally for node runtimes
self.PN = PN;

// Register method handlers using addHandler (not peer.methods which is for calling)
peer.addHandler('deploy', deployFlows);
peer.addHandler('inject', injectNode);
peer.addHandler('trigger', triggerNode);
peer.addHandler('injectText', injectText);
peer.addHandler('stop', stopRuntime);
peer.addHandler('sendResult', handleMainThreadResult);
peer.addHandler('emitEvent', handleMainThreadEvent);
peer.addHandler('broadcastToType', broadcastToType);
peer.addHandler('connectMcp', connectMcp);
peer.addHandler('disconnectMcp', disconnectMcp);
peer.addHandler('getMcpStatus', getMcpStatus);

// Notify main thread that worker is ready
peer.notifiers.ready();

PN.log('Runtime worker initialized');
