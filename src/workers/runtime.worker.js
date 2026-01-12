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

// Make mqtt and io available globally for runtime implementations
self.mqtt = mqtt;
self.io = io;

// Set up rawr peer for RPC communication
let peer;

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
            // Clone message for each recipient
            const clonedMsg = JSON.parse(JSON.stringify(m));
            setTimeout(() => targetNode.receive(clonedMsg), 0);
          }
        }
      }
    }
  }

  receive(msg) {
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

  error(text, msg) {
    peer.notifiers.log({ nodeId: this.id, level: 'error', text });
  }

  debug(output, topic = '') {
    peer.notifiers.debug({
      nodeId: this.id,
      nodeName: this.name || this.type,
      payload: output,
      topic
    });
  }

  status(status) {
    peer.notifiers.status({ nodeId: this.id, status });
  }

  context() {
    const nodeContext = this._context;
    return {
      // Node-local context
      get: (key) => nodeContext.get(key),
      set: (key, value) => nodeContext.set(key, value),
      keys: () => [...nodeContext.keys()],
      // Flow-level context
      flow: {
        get: (key) => context.flow.get(key),
        set: (key, value) => context.flow.set(key, value),
        keys: () => [...context.flow.keys()]
      },
      // Global context
      global: {
        get: (key) => context.global.get(key),
        set: (key, value) => context.global.set(key, value),
        keys: () => [...context.global.keys()]
      }
    };
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
          console.error('Error in event listener', event, e);
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
        console.error('Error in onClose', e);
      }
    }

    // Call registered close callbacks
    for (const cb of this._closeCallbacks) {
      try {
        cb();
      } catch (e) {
        console.error('Error in close callback', e);
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
    console.warn(`Unknown node type: ${nodeDef._node.type}`);
    return new RuntimeNode(nodeDef, null);
  }

  return new RuntimeNode(nodeDef, runtimeDef);
}

/**
 * Deploy flows - called from main thread
 */
function deployFlows(flowNodes, flowConfigNodes = [], skipNodeIds = []) {
  // Store error node IDs
  errorNodeIds = new Set(skipNodeIds);

  // Stop existing nodes
  for (const node of nodes.values()) {
    try {
      node.close();
    } catch (e) {
      console.error('Error closing node', node.id, e);
    }
  }
  nodes.clear();

  // Clear config nodes
  for (const node of configNodes.values()) {
    // If config node has a close method on its instance
    const instance = nodes.get(node.id);
    if (instance) {
      try {
        instance.close();
      } catch (e) {
        console.error('Error closing config node', node.id, e);
      }
    }
  }
  configNodes.clear();

  // Store config node data for lookups
  for (const configNode of flowConfigNodes) {
    configNodes.set(configNode._node.id, {
      id: configNode._node.id,
      type: configNode._node.type,
      name: configNode._node.name,
      ...configNode
    });
  }

  // Create config node instances first (skip error nodes)
  for (const configNode of flowConfigNodes) {
    if (errorNodeIds.has(configNode._node.id)) continue;
    const node = createNode(configNode);
    nodes.set(node.id, node);
  }

  // Initialize config nodes (skip error nodes)
  for (const configNode of flowConfigNodes) {
    if (errorNodeIds.has(configNode._node.id)) continue;
    const node = nodes.get(configNode._node.id);
    if (node && node.onInit) {
      try {
        node.onInit();
      } catch (e) {
        console.error('Error initializing config node', node.id, e);
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
  for (const nodeDef of flowNodes) {
    if (errorNodeIds.has(nodeDef._node.id)) continue;
    const node = nodes.get(nodeDef._node.id);
    if (node && node.onInit) {
      try {
        node.onInit();
      } catch (e) {
        console.error('Error initializing node', node.id, e);
      }
    }
  }

  const skippedCount = skipNodeIds.length;
  return {
    nodeCount: flowNodes.length - skippedCount,
    configCount: flowConfigNodes.length,
    skippedCount
  };
}

/**
 * Inject a message into a node
 */
function injectNode(nodeId, msg = {}) {
  // Skip error nodes
  if (errorNodeIds.has(nodeId)) {
    console.warn('Cannot inject into error node:', nodeId);
    return;
  }

  const node = nodes.get(nodeId);
  if (!node) {
    console.warn('Node not found:', nodeId);
    return;
  }

  // For inject nodes, call trigger method if available
  if (node.trigger) {
    node.trigger();
  } else {
    // Otherwise just receive the message
    node.receive(msg);
  }
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
 * Stop the runtime
 */
function stopRuntime() {
  for (const node of nodes.values()) {
    try {
      node.close();
    } catch (e) {
      console.error('Error closing node', e);
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
 */
function handleMainThreadEvent(nodeId, event, data) {
  const node = nodes.get(nodeId);
  if (node) {
    node.emit(event, data);
  }
}

// Initialize rawr peer
peer = rawr({
  transport: transports.worker(self)
});

// Register method handlers using addHandler (not peer.methods which is for calling)
peer.addHandler('deploy', deployFlows);
peer.addHandler('inject', injectNode);
peer.addHandler('injectText', injectText);
peer.addHandler('stop', stopRuntime);
peer.addHandler('sendResult', handleMainThreadResult);
peer.addHandler('emitEvent', handleMainThreadEvent);

// Notify main thread that worker is ready
peer.notifiers.ready();

console.log('Runtime worker initialized');
