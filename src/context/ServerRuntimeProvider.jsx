/**
 * Server Runtime Provider
 *
 * Connects to the Node.js server runtime via WebSocket instead of spawning a worker.
 * Used when the UI is served by the PageNodes server.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { RuntimeContext } from './runtime.js';
import { renderToStaticMarkup } from 'react-dom/server';
import rawr, { transports } from 'rawr';
import { useDebug } from './DebugContext';
import { useFlows } from './FlowContext';
import { nodeRegistry } from '../nodes';
import { audioManager } from '../audio/AudioManager';
import { logger, createMainThreadPN } from '../utils/logger';

// Server storage wrapper - calls server via rawr
// Exported so main-server.jsx can pass it to StorageProvider
export const serverStorage = {
  _peer: null,
  _peerReady: null,
  _resolvePeerReady: null,

  _waitForPeer() {
    if (this._peer) return Promise.resolve();
    if (!this._peerReady) {
      this._peerReady = new Promise(resolve => {
        this._resolvePeerReady = resolve;
      });
    }
    return this._peerReady;
  },

  setPeer(peer) {
    this._peer = peer;
    logger.log('serverStorage peer set');
    if (this._resolvePeerReady) {
      this._resolvePeerReady();
    }
  },

  async getFlows() {
    await this._waitForPeer();
    return this._peer.methods.getFlows();
  },

  async saveFlows(flowConfig) {
    await this._waitForPeer();
    return this._peer.methods.saveFlows(flowConfig);
  },

  async getCredentials() {
    await this._waitForPeer();
    return this._peer.methods.getCredentials();
  },

  async saveCredentials(creds) {
    await this._waitForPeer();
    return this._peer.methods.saveCredentials(creds);
  },

  async getSettings() {
    await this._waitForPeer();
    return this._peer.methods.getSettings();
  },

  async saveSettings(settings) {
    await this._waitForPeer();
    return this._peer.methods.saveSettings(settings);
  }
};

// Re-export useRuntime for imports
export { useRuntime } from './runtime.js';

export function RuntimeProvider({ children }) {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [mcpStatus, setMcpStatus] = useState('disabled');
  const mcpMessagesRef = useRef([]);
  const [hasCanvasNodes, setHasCanvasNodes] = useState(false);
  const [authRequired, setAuthRequired] = useState(null); // null = checking, true = need password, false = authenticated
  const [authError, setAuthError] = useState('');
  const [connectTrigger, setConnectTrigger] = useState(0); // increment to force reconnect
  const { addMessage, addDownload, addError, clear, clearErrors, messages, errors } = useDebug();
  const { state: flowState, dispatch: flowDispatch } = useFlows();

  const flowStateRef = useRef(flowState);
  const messagesRef = useRef(messages);
  const errorsRef = useRef(errors);
  const nodeStatusesRef = useRef(nodeStatuses);
  const deployRef = useRef(null);

  useEffect(() => { flowStateRef.current = flowState; }, [flowState]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { errorsRef.current = errors; }, [errors]);
  useEffect(() => { nodeStatusesRef.current = nodeStatuses; }, [nodeStatuses]);

  // Submit password for authentication
  const submitPassword = useCallback(async (password) => {
    setAuthError('');
    try {
      const res = await fetch('/_pn/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        // Cookie is set by the server response. Force reconnect the WebSocket.
        setAuthRequired(false);
        if (socketRef.current) {
          socketRef.current.close();
        }
        setConnectTrigger(prev => prev + 1);
        return true;
      }
      setAuthError(data.error || 'Incorrect password');
      return false;
    } catch {
      setAuthError('Connection error');
      return false;
    }
  }, []);

  // Logout: clear session cookie and force re-auth
  const logout = useCallback(async () => {
    try {
      await fetch('/_pn/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    setIsReady(false);
    setIsRunning(false);
    setAuthRequired(true);
  }, []);

  // Check auth and connect WebSocket
  useEffect(() => {
    let cancelled = false;

    async function connectWithAuth() {
      // Check if auth is required and whether session cookie is valid
      try {
        const res = await fetch('/_pn/auth/check');
        const { required, valid } = await res.json();
        if (cancelled) return;

        if (required && !valid) {
          // Need password — don't bother opening WebSocket
          setAuthRequired(true);
          return;
        }

        // Either no auth required, or session cookie is valid
        setAuthRequired(false);
        connectWebSocket();
      } catch {
        if (!cancelled) {
          setAuthRequired(null);
        }
      }
    }

    function connectWebSocket() {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/_pn/ws`;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

    socket.onopen = () => {
      logger.log('Connected to server runtime');

      peerRef.current = rawr({
        transport: transports.websocket(socket)
      });

      // Handle notifications from server
      peerRef.current.notifications.onready(() => {
        setIsReady(true);
        logger.log('Server runtime ready');
      });

      peerRef.current.notifications.ondebug(({ nodeId, nodeName, payload, topic, _msgid }) => {
        addMessage(nodeId, nodeName, payload, topic, _msgid);
      });

      peerRef.current.notifications.onlog(({ nodeId, level, text }) => {
        if (level === 'error') {
          logger.error(`[node:${nodeId}]`, text);
        } else if (level === 'warn') {
          logger.warn(`[node:${nodeId}]`, text);
        } else {
          logger.log(`[node:${nodeId}]`, text);
        }
      });

      peerRef.current.notifications.onstatus(({ nodeId, status }) => {
        setNodeStatuses(prev => ({ ...prev, [nodeId]: status }));
      });

      peerRef.current.notifications.onmcpStatus(({ status }) => {
        setMcpStatus(status);
      });

      peerRef.current.notifications.onlogs((entries) => {
        logger.merge(entries);
      });

      peerRef.current.notifications.ondownload(({ nodeId, nodeName, filename, content, mimeType }) => {
        const blob = new Blob([content], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const size = blob.size;
        addDownload(nodeId, nodeName, filename, blobUrl, size);
      });

      peerRef.current.notifications.onerror(({ nodeId, nodeName, nodeType, message, stack, _msgid }) => {
        addError(nodeId, nodeName, nodeType, message, stack, _msgid);
      });

      audioManager.setPeer(peerRef.current);
      serverStorage.setPeer(peerRef.current);

      // mainThreadRequest handler for server delegating browser operations back
      peerRef.current.notifications.onmainThreadRequest(async ({ nodeId, nodeType, action, params }) => {
        const audioActions = new Set([
          'createAudioNode', 'setAudioParam', 'rampAudioParam', 'setAudioOption',
          'startAudioNode', 'stopAudioNode', 'playAudioNode', 'setPeriodicWave',
          'setMuted', 'destroyAudioNode', 'connectAudio', 'disconnectAudio',
          'createMicNode', 'startMicNode', 'stopMicNode', 'destroyMicNode',
          'getAnalyserData', 'createDelayEffect', 'setDelayParam', 'rampDelayParam',
          'destroyDelayEffect', 'loadAudioBuffer', 'playAudioBuffer', 'stopAudioBuffer',
          'loadConvolverBuffer', 'createMediaStreamDestination', 'startRecording',
          'stopRecording', 'createAudioWorklet', 'setWorkletMessageHandler',
          'postToWorklet', 'createMediaElementSource', 'mediaElementControl',
          'createStemsNode', 'loadStems', 'controlStems', 'getAudioContextState',
          'hasActiveSources'
        ]);

        if (audioActions.has(action)) {
          try {
            const result = await audioManager.handleMainThreadCall(nodeId, action, params);
            // Send result back to server
            peerRef.current.methods.sendResult(nodeId, result);
          } catch (err) {
            logger.error(`[audio] Error in ${action}:`, err);
            peerRef.current.methods.emitEvent(nodeId, 'error', err.message);
          }
          return;
        }

        const nodeDef = nodeRegistry.get(nodeType);
        if (!nodeDef?.mainThread?.[action]) {
          logger.warn(`No mainThread handler for ${nodeType}.${action}`);
          return;
        }

        try {
          const PN = createMainThreadPN();
          const result = await nodeDef.mainThread[action](peerRef, nodeId, params, PN);
          if (result !== undefined) {
            peerRef.current.methods.sendResult(nodeId, result);
          }
        } catch (err) {
          logger.error(`Error in mainThread ${nodeType}.${action}:`, err);
          peerRef.current.methods.emitEvent(nodeId, 'error', err.message);
        }
      });

      // MCP read-only handlers - called from server when MCP server requests data
      peerRef.current.addHandler('mcpGetState', () => {
        const state = flowStateRef.current;
        const nodeCatalog = nodeRegistry.getAll().map(def => ({
          type: def.type,
          category: def.category,
          description: def.description || ''
        }));
        return {
          nodeCatalog,
          flows: state.flows,
          nodes: Object.values(state.nodes),
          configNodes: Object.values(state.configNodes)
        };
      });

      peerRef.current.addHandler('mcpGetFlows', () => {
        const state = flowStateRef.current;
        return {
          flows: state.flows,
          nodes: Object.values(state.nodes),
          configNodes: Object.values(state.configNodes)
        };
      });

      // Listen for flowsChanged notification from server (MCP edits)
      peerRef.current.notifications.onflowsChanged(async () => {
        logger.log('Flows changed on server, reloading...');
        try {
          const flowConfig = await serverStorage.getFlows();
          if (!flowConfig) return;

          // Storage format is already flat - just ensure defaults
          const flows = flowConfig.flows || [];
          const internalNodes = (flowConfig.nodes || []).map(node => ({
            ...node,
            name: node.name || '',
            x: node.x || 0,
            y: node.y || 0,
            wires: node.wires || []
          }));
          const internalConfigNodes = (flowConfig.configNodes || []).map(node => ({
            ...node,
            name: node.name || ''
          }));

          flowDispatch({
            type: 'SET_FLOWS',
            flows,
            nodes: [...internalNodes, ...internalConfigNodes],
            configNodes: []
          });
          logger.log('Flows reloaded from server');
        } catch (err) {
          logger.error('Failed to reload flows:', err);
        }
      });

      peerRef.current.addHandler('mcpGetDebugOutput', (limit = 10) => {
        return (messagesRef.current || []).slice(0, limit);
      });

      peerRef.current.addHandler('mcpGetErrors', (limit = 10) => {
        return (errorsRef.current || []).slice(0, limit);
      });

      peerRef.current.addHandler('mcpGetLogs', (limit = 100, context = null, level = null) => {
        return logger.getLogs(limit, context, level);
      });

      peerRef.current.addHandler('mcpClearLogs', () => {
        logger.clear();
        return { success: true };
      });

      peerRef.current.addHandler('mcpInject', async (nodeId, payload) => {
        if (!nodeId) return { success: false, errors: ['nodeId required'] };
        const state = flowStateRef.current;
        const node = state.nodes[nodeId];
        if (!node) return { success: false, errors: ['Node not found'] };
        if (node.type !== 'inject') {
          return { success: false, errors: ['Not an inject node'] };
        }
        const msg = (payload !== undefined && payload !== null) ? { payload } : {};
        try {
          return await peerRef.current.methods.inject(nodeId, msg);
        } catch (err) {
          return { success: false, errors: [err.message] };
        }
      });

      peerRef.current.addHandler('mcpTrigger', async (nodeId, msg) => {
        if (!nodeId) return { success: false, errors: ['nodeId required'] };
        const state = flowStateRef.current;
        if (!state.nodes[nodeId]) return { success: false, errors: ['Node not found'] };
        const message = (msg !== undefined && msg !== null) ? msg : {};
        try {
          return await peerRef.current.methods.trigger(nodeId, message);
        } catch (err) {
          return { success: false, errors: [err.message] };
        }
      });

      peerRef.current.addHandler('mcpClearDebug', () => {
        clear();
        return { success: true };
      });

      peerRef.current.addHandler('mcpClearErrors', () => {
        clearErrors();
        return { success: true };
      });

      peerRef.current.addHandler('mcpGetNodeStatuses', () => {
        return nodeStatusesRef.current;
      });

      peerRef.current.addHandler('mcpGetMessages', (limit = 100, shouldClear = true) => {
        const msgs = mcpMessagesRef.current.slice(0, limit);
        if (shouldClear && msgs.length > 0) {
          mcpMessagesRef.current = mcpMessagesRef.current.slice(msgs.length);
        }
        return msgs;
      });

      peerRef.current.addHandler('mcpSendMessage', (payload, topic = '') => {
        const state = flowStateRef.current;
        const mcpInputNodes = Object.values(state.nodes).filter(n => n.type === 'mcp-input');
        if (mcpInputNodes.length === 0) {
          return { success: false, error: 'No mcp-input nodes' };
        }
        for (const node of mcpInputNodes) {
          peerRef.current.methods.emitEvent(node.id, 'mcpMessage', { payload, topic });
        }
        return { success: true, nodeCount: mcpInputNodes.length };
      });

      peerRef.current.addHandler('mcpGetCanvasSvg', () => {
        const svgElement = document.querySelector('.canvas-svg');
        if (!svgElement) {
          return { success: false, errors: ['Canvas not found'] };
        }
        return {
          success: true,
          svg: svgElement.outerHTML,
          width: svgElement.getAttribute('width'),
          height: svgElement.getAttribute('height')
        };
      });

      peerRef.current.addHandler('mcpGetInjectNodes', () => {
        const state = flowStateRef.current;
        if (!state?.nodes) return [];
        return Object.values(state.nodes)
          .filter(n => n.type === 'inject')
          .map(n => ({
            id: n.id,
            name: n.name || 'inject',
            flowId: n.z,
            payload: n.payload,
            payloadType: n.payloadType,
            topic: n.topic
          }));
      });

      peerRef.current.addHandler('mcpGetNodeDetails', (type) => {
        const nodeDef = nodeRegistry.get(type);
        if (!nodeDef) throw new Error(`Unknown node type: ${type}`);

        let helpHtml = null;
        if (nodeDef.renderHelp) {
          try {
            helpHtml = renderToStaticMarkup(nodeDef.renderHelp());
          } catch (e) {
            helpHtml = `Error: ${e.message}`;
          }
        }

        return {
          type: nodeDef.type,
          category: nodeDef.category,
          description: nodeDef.description,
          inputs: nodeDef.inputs,
          outputs: nodeDef.outputs,
          defaults: nodeDef.defaults ? Object.fromEntries(
            Object.entries(nodeDef.defaults).map(([key, def]) => [
              key,
              { type: def.type, default: def.default, required: def.required, label: def.label }
            ])
          ) : {},
          help: helpHtml
        };
      });

      // Query current MCP status from server (MCP is managed server-side)
      peerRef.current.methods.getMcpStatus().then(status => {
        setMcpStatus(status);
      }).catch(() => {});
    };

    socket.onerror = (err) => {
      logger.error('Server runtime WebSocket error:', err);
    };

    socket.onclose = () => {
      logger.warn('Server runtime disconnected');
      setIsReady(false);
      setIsRunning(false);
    };
    } // end connectWebSocket

    connectWithAuth();

    return () => {
      cancelled = true;
      if (socketRef.current) socketRef.current.close();
    };
  }, [addMessage, addDownload, addError, connectTrigger]);

  // Deploy flows to server
  const deploy = useCallback(async (nodes, configNodes = {}, errorNodeIds = []) => {
    if (!peerRef.current || !isReady) {
      logger.warn('Server runtime not ready');
      return;
    }

    const flowNodes = Object.values(nodes).map(node => {
      const { x: _x, y: _y, ...rest } = node;
      return rest;
    });

    const flowConfigNodes = Object.values(configNodes).map(node => {
      const { users: _users, ...rest } = node;
      return rest;
    });

    const deployedNodeIds = new Set([
      ...Object.keys(nodes),
      ...Object.keys(configNodes)
    ]);

    const deployedTypes = new Set(flowNodes.map(n => n.type));
    setHasCanvasNodes(deployedTypes.has('canvas'));

    try {
      audioManager.destroyAll();

      const result = await peerRef.current.methods.deploy(flowNodes, flowConfigNodes, errorNodeIds);
      setIsRunning(true);

      setNodeStatuses(prev => {
        const kept = {};
        for (const [id, status] of Object.entries(prev)) {
          if (deployedNodeIds.has(id)) {
            kept[id] = status;
          }
        }
        return kept;
      });

      audioManager.buildGraph(nodes);

      logger.log(`Flows deployed: ${result.nodeCount} nodes, ${result.configCount || 0} config nodes`);
      if (result.reusedConfigCount > 0) {
        logger.log(`Preserved ${result.reusedConfigCount} unchanged config node connections`);
      }
    } catch (err) {
      logger.error('Deploy failed:', err);
    }
  }, [isReady]);

  useEffect(() => {
    deployRef.current = deploy;
  }, [deploy]);

  const inject = useCallback((nodeId, msg = {}) => {
    if (!peerRef.current || !isRunning) return;
    peerRef.current.methods.inject(nodeId, msg);
  }, [isRunning]);

  const injectText = useCallback((text) => {
    if (!peerRef.current || !isRunning) return;
    peerRef.current.methods.injectText(text);
  }, [isRunning]);

  const callMainThread = useCallback(async (nodeType, action, nodeId, params) => {
    const nodeDef = nodeRegistry.get(nodeType);
    if (!nodeDef?.mainThread?.[action]) {
      logger.warn(`No mainThread handler for ${nodeType}.${action}`);
      return;
    }

    try {
      const PN = createMainThreadPN();
      return await nodeDef.mainThread[action](peerRef, nodeId, params, PN);
    } catch (err) {
      logger.error(`Error in mainThread handler ${nodeType}.${action}:`, err);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!peerRef.current) return;
    audioManager.destroyAll();
    await peerRef.current.methods.stop();
    setIsRunning(false);
    logger.log('Runtime stopped');
  }, []);

  const connectMcp = useCallback((port) => {
    if (!peerRef.current) return;
    const url = window.location.href;
    peerRef.current.methods.connectMcp({ port, url });
  }, []);

  const disconnectMcp = useCallback(() => {
    if (!peerRef.current) return;
    peerRef.current.methods.disconnectMcp();
  }, []);

  const broadcastToType = useCallback((nodeType, action, params) => {
    if (!peerRef.current || !isRunning) return;
    peerRef.current.methods.broadcastToType(nodeType, action, params);
  }, [isRunning]);

  const emitNodeEvent = useCallback((nodeId, eventName, data) => {
    if (!peerRef.current || !isRunning) return;
    peerRef.current.methods.emitEvent(nodeId, eventName, data);
  }, [isRunning]);

  const value = {
    mode: 'server',
    isReady,
    isRunning,
    nodeStatuses,
    mcpStatus,
    hasCanvasNodes,
    authRequired,
    authError,
    submitPassword,
    logout,
    deploy,
    inject,
    injectText,
    callMainThread,
    broadcastToType,
    emitNodeEvent,
    stop,
    connectMcp,
    disconnectMcp
  };

  return (
    <RuntimeContext.Provider value={value}>
      {children}
    </RuntimeContext.Provider>
  );
}

