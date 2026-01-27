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
import { generateId } from '../utils/id';
import { validateNode } from '../utils/validation';
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

  // Connect to server runtime via WebSocket
  useEffect(() => {
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

      // MCP handlers - called from server when MCP server requests data
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

      peerRef.current.addHandler('mcpCreateFlow', (label) => {
        const newFlow = {
          id: generateId(),
          type: 'tab',
          label: label || `Flow ${flowStateRef.current.flows.length + 1}`
        };
        flowDispatch({ type: 'ADD_FLOW', flow: newFlow });
        return { success: true, flow: newFlow };
      });

      peerRef.current.addHandler('mcpAddNode', (args) => {
        const errors = [];
        if (!args || typeof args !== 'object') {
          return { success: false, errors: ['args must be an object'] };
        }

        const { type, flowId, x, y, name, config } = args;
        if (!type || typeof type !== 'string') {
          errors.push('type is required and must be a string');
        }

        const nodeDef = type ? nodeRegistry.get(type) : null;
        if (type && !nodeDef) {
          errors.push(`Unknown node type: "${type}"`);
        }

        if (errors.length > 0) {
          return { success: false, errors };
        }

        const isConfigNode = nodeDef.category === 'config';
        if (!isConfigNode) {
          if (!flowId || typeof flowId !== 'string') {
            errors.push('flowId is required for non-config nodes');
          } else {
            const flowExists = flowStateRef.current.flows.some(f => f.id === flowId);
            if (!flowExists) {
              errors.push(`Flow not found: "${flowId}"`);
            }
          }
        }

        if (errors.length > 0) {
          return { success: false, errors };
        }

        const defaults = {};
        if (nodeDef.defaults) {
          for (const [key, def] of Object.entries(nodeDef.defaults)) {
            defaults[key] = config?.[key] ?? def.default;
          }
        }

        const newNode = {
          _node: {
            id: generateId(),
            type,
            name: name || '',
            ...(isConfigNode ? {} : { z: flowId, x: x || 100, y: y || 100 }),
            wires: []
          },
          ...defaults,
          ...config
        };

        const validationErrors = validateNode(newNode);
        if (validationErrors.length > 0) {
          return { success: false, errors: validationErrors.map(e => `${type}: ${e}`) };
        }

        flowDispatch({ type: 'ADD_NODE', node: newNode });
        return { success: true, node: newNode };
      });

      peerRef.current.addHandler('mcpAddNodes', (flowId, nodesArr) => {
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
          const flowExists = flowStateRef.current.flows.some(f => f.id === flowId);
          if (!flowExists) {
            errors.push(`Flow not found: "${flowId}"`);
          }
        }

        if (errors.length > 0) {
          return { success: false, errors };
        }

        // First pass: validate all nodes and collect tempIds
        const tempIds = new Set();
        const nodeValidations = [];

        for (let i = 0; i < nodesArr.length; i++) {
          const node = nodesArr[i];
          const nodeErrors = [];
          const nodeLabel = node.tempId || node.name || `node[${i}]`;

          if (!node || typeof node !== 'object') {
            errors.push(`${nodeLabel}: must be an object`);
            nodeValidations.push({ valid: false });
            continue;
          }

          if (!node.type || typeof node.type !== 'string') {
            nodeErrors.push('type is required and must be a string');
          }

          if (!node.tempId || typeof node.tempId !== 'string') {
            nodeErrors.push('tempId is required and must be a string');
          } else if (tempIds.has(node.tempId)) {
            nodeErrors.push(`duplicate tempId: "${node.tempId}"`);
          } else {
            tempIds.add(node.tempId);
          }

          const nodeDef = node.type ? nodeRegistry.get(node.type) : null;
          if (node.type && !nodeDef) {
            nodeErrors.push(`unknown node type: "${node.type}"`);
          }

          if (nodeDef && nodeDef.category !== 'config') {
            if (typeof node.x !== 'number' || typeof node.y !== 'number') {
              nodeErrors.push('x and y coordinates are required for non-config nodes');
            }
          }

          if (nodeErrors.length > 0) {
            errors.push(`${nodeLabel}: ${nodeErrors.join('; ')}`);
            nodeValidations.push({ valid: false });
          } else {
            nodeValidations.push({ valid: true, nodeDef });
          }
        }

        if (errors.length > 0) {
          return { success: false, errors };
        }

        // Second pass: validate wires reference valid tempIds or existing nodes
        const existingNodes = flowStateRef.current.nodes;
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
                } else if (!tempIds.has(targetId) && !existingNodes[targetId]) {
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
        const nodesWithIds = nodesArr.map((node, i) => {
          const realId = generateId();
          tempToReal[node.tempId] = realId;
          return { ...node, _realId: realId, _nodeDef: nodeValidations[i].nodeDef };
        });

        // Fourth pass: create nodes with mapped wires
        const createdNodes = [];
        const validationErrors = [];

        for (const node of nodesWithIds) {
          const { tempId, type, x, y, name, wires, streamWires, _realId, _nodeDef, ...config } = node;

          const defaults = {};
          if (_nodeDef.defaults) {
            for (const [key, def] of Object.entries(_nodeDef.defaults)) {
              defaults[key] = config[key] ?? def.default;
            }
          }

          const mappedWires = (wires || []).map(outputWires =>
            (outputWires || []).map(targetTempId => tempToReal[targetTempId] || targetTempId)
          );

          const mappedStreamWires = streamWires
            ? streamWires.map(outputWires =>
                (outputWires || []).map(targetTempId => tempToReal[targetTempId] || targetTempId)
              )
            : undefined;

          const isConfigNode = _nodeDef.category === 'config';

          const newNode = {
            _node: {
              id: _realId,
              type,
              name: name || '',
              ...(isConfigNode ? {} : { z: flowId, x: x || 100, y: y || 100 }),
              wires: mappedWires,
              ...(mappedStreamWires ? { streamWires: mappedStreamWires } : {})
            },
            ...defaults,
            ...config
          };

          const nodeValErrors = validateNode(newNode);
          if (nodeValErrors.length > 0) {
            validationErrors.push(`${tempId}: ${nodeValErrors.join('; ')}`);
          }

          createdNodes.push({ tempId, id: _realId, node: newNode, errors: nodeValErrors });
        }

        if (validationErrors.length > 0) {
          return { success: false, errors: validationErrors, warnings: warnings.length > 0 ? warnings : undefined };
        }

        for (const { node } of createdNodes) {
          flowDispatch({ type: 'ADD_NODE', node });
        }

        const result = {
          success: true,
          nodes: createdNodes.map(({ tempId, id, node }) => ({ tempId, id, node }))
        };
        if (warnings.length > 0) {
          result.warnings = warnings;
        }
        return result;
      });

      peerRef.current.addHandler('mcpUpdateNode', (nodeId, updates) => {
        if (!nodeId || typeof nodeId !== 'string') {
          return { success: false, errors: ['nodeId is required and must be a string'] };
        }
        if (!updates || typeof updates !== 'object') {
          return { success: false, errors: ['updates is required and must be an object'] };
        }

        const state = flowStateRef.current;
        const node = state.nodes[nodeId] || state.configNodes?.[nodeId];
        if (!node) {
          return { success: false, errors: [`Node not found: "${nodeId}"`] };
        }

        const nodeUpdates = {};
        const configUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
          if (['x', 'y', 'name', 'wires', 'streamWires'].includes(key)) {
            nodeUpdates[key] = value;
          } else {
            configUpdates[key] = value;
          }
        }

        flowDispatch({
          type: 'UPDATE_NODE',
          id: nodeId,
          changes: {
            _node: { ...node._node, ...nodeUpdates },
            ...configUpdates
          }
        });
        return { success: true };
      });

      peerRef.current.addHandler('mcpDeleteNode', (nodeId) => {
        if (!nodeId || typeof nodeId !== 'string') {
          return { success: false, errors: ['nodeId is required and must be a string'] };
        }

        const state = flowStateRef.current;
        const node = state.nodes[nodeId] || state.configNodes?.[nodeId];
        if (!node) {
          return { success: false, errors: [`Node not found: "${nodeId}"`] };
        }

        flowDispatch({ type: 'DELETE_NODES', ids: [nodeId] });
        return { success: true };
      });

      peerRef.current.addHandler('mcpConnectNodes', (sourceId, targetId, sourcePort = 0) => {
        const errors = [];
        if (!sourceId || typeof sourceId !== 'string') errors.push('sourceId is required');
        if (!targetId || typeof targetId !== 'string') errors.push('targetId is required');
        if (typeof sourcePort !== 'number' || sourcePort < 0) errors.push('sourcePort must be non-negative');

        if (errors.length > 0) return { success: false, errors };

        const state = flowStateRef.current;
        const sourceNode = state.nodes[sourceId];
        if (!sourceNode) return { success: false, errors: [`Source node not found: "${sourceId}"`] };
        const targetNode = state.nodes[targetId];
        if (!targetNode) return { success: false, errors: [`Target node not found: "${targetId}"`] };

        const wires = [...(sourceNode._node.wires || [])];
        while (wires.length <= sourcePort) wires.push([]);
        if (!wires[sourcePort].includes(targetId)) {
          wires[sourcePort] = [...wires[sourcePort], targetId];
        }

        flowDispatch({
          type: 'UPDATE_NODE',
          id: sourceId,
          updates: { _node: { ...sourceNode._node, wires } }
        });
        return { success: true };
      });

      peerRef.current.addHandler('mcpDisconnectNodes', (sourceId, targetId, sourcePort = 0) => {
        const state = flowStateRef.current;
        const sourceNode = state.nodes[sourceId];
        if (!sourceNode) return { success: false, errors: [`Source node not found`] };

        const wires = [...(sourceNode._node.wires || [])];
        if (wires[sourcePort]) {
          wires[sourcePort] = wires[sourcePort].filter(id => id !== targetId);
        }

        flowDispatch({
          type: 'UPDATE_NODE',
          id: sourceId,
          updates: { _node: { ...sourceNode._node, wires } }
        });
        return { success: true };
      });

      peerRef.current.addHandler('mcpDeploy', async () => {
        if (!deployRef.current) {
          return { success: false, errors: ['Deploy not ready'] };
        }
        try {
          const state = flowStateRef.current;
          const flowConfig = {
            flows: state.flows,
            nodes: Object.values(state.nodes).map(node => {
              const { _node, ...config } = node;
              const cleanConfig = Object.fromEntries(
                Object.entries(config).filter(([key]) => !key.startsWith('_'))
              );
              return { ..._node, ...cleanConfig };
            }),
            configNodes: Object.values(state.configNodes).map(node => {
              const { _node, users: _users, ...config } = node;
              const cleanConfig = Object.fromEntries(
                Object.entries(config).filter(([key]) => !key.startsWith('_'))
              );
              return { ..._node, ...cleanConfig };
            })
          };
          await serverStorage.saveFlows(flowConfig);
          deployRef.current(state.nodes, state.configNodes, []);
          return { success: true };
        } catch (err) {
          return { success: false, errors: [err.message] };
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
        if (node._node.type !== 'inject') {
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
        const mcpInputNodes = Object.values(state.nodes).filter(n => n._node.type === 'mcp-input');
        if (mcpInputNodes.length === 0) {
          return { success: false, error: 'No mcp-input nodes' };
        }
        for (const node of mcpInputNodes) {
          peerRef.current.methods.emitEvent(node._node.id, 'mcpMessage', { payload, topic });
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
          .filter(n => n._node.type === 'inject')
          .map(n => ({
            id: n._node.id,
            name: n._node.name || 'inject',
            flowId: n._node.z,
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

      // Query current MCP status from server (in case it connected on startup)
      peerRef.current.methods.getMcpStatus().then(status => {
        setMcpStatus(status);
      }).catch(() => {});

      // Load settings and connect to MCP if enabled
      serverStorage.getSettings().then(settings => {
        if (settings.mcpEnabled) {
          const url = window.location.href;
          peerRef.current.methods.connectMcp({ port: settings.mcpPort, url });
        }
      });
    };

    socket.onerror = (err) => {
      logger.error('Server runtime WebSocket error:', err);
    };

    socket.onclose = () => {
      logger.warn('Server runtime disconnected');
      setIsReady(false);
      setIsRunning(false);
    };

    return () => {
      socket.close();
    };
  }, [addMessage, addDownload, addError]);

  // Deploy flows to server
  const deploy = useCallback(async (nodes, configNodes = {}, errorNodeIds = []) => {
    if (!peerRef.current || !isReady) {
      logger.warn('Server runtime not ready');
      return;
    }

    const flowNodes = Object.values(nodes).map(node => {
      const { x: _x, y: _y, ...runtimeNodeProps } = node._node;
      return {
        _node: runtimeNodeProps,
        ...Object.fromEntries(
          Object.entries(node).filter(([key]) => key !== '_node')
        )
      };
    });

    const flowConfigNodes = Object.values(configNodes).map(node => {
      return {
        _node: { ...node._node },
        ...Object.fromEntries(
          Object.entries(node).filter(([key]) => key !== '_node' && key !== 'users')
        )
      };
    });

    const deployedNodeIds = new Set([
      ...Object.keys(nodes),
      ...Object.keys(configNodes)
    ]);

    const deployedTypes = new Set(flowNodes.map(n => n._node.type));
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

