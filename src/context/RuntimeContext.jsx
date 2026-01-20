import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import rawr, { transports } from 'rawr';
import { useDebug } from './DebugContext';
import { useFlows } from './FlowContext';
import { nodeRegistry } from '../nodes';
import { storage } from '../utils/storage';
import { generateId } from '../utils/id';

const RuntimeContext = createContext(null);

export function RuntimeProvider({ children }) {
  const workerRef = useRef(null);
  const peerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [mcpStatus, setMcpStatus] = useState('disabled'); // disabled, connecting, connected, error
  const { addMessage, addDownload, addError, clear, clearErrors, messages, errors } = useDebug();
  const { state: flowState, dispatch: flowDispatch } = useFlows();

  // Refs to access current state in handlers
  const flowStateRef = useRef(flowState);
  const messagesRef = useRef(messages);
  const errorsRef = useRef(errors);
  const nodeStatusesRef = useRef(nodeStatuses);
  const deployRef = useRef(null);

  // Update refs in effect to avoid updating during render
  useEffect(() => {
    flowStateRef.current = flowState;
  }, [flowState]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);
  useEffect(() => {
    nodeStatusesRef.current = nodeStatuses;
  }, [nodeStatuses]);

  // Initialize worker and rawr peer
  useEffect(() => {
    // Create runtime worker
    workerRef.current = new Worker(
      new URL('../workers/runtime.worker.js', import.meta.url),
      { type: 'module' }
    );

    // Create rawr peer for RPC communication
    peerRef.current = rawr({
      transport: transports.worker(workerRef.current)
    });

    // Handle notifications from worker
    peerRef.current.notifications.onready(() => {
      setIsReady(true);
      console.log('Runtime worker ready');
    });

    peerRef.current.notifications.ondebug(({ nodeId, nodeName, payload, topic, _msgid }) => {
      addMessage(nodeId, nodeName, payload, topic, _msgid);
    });

    peerRef.current.notifications.onlog(({ nodeId, level, text }) => {
      if (level === 'error') {
        console.error(`[${nodeId}]`, text);
      } else if (level === 'warn') {
        console.warn(`[${nodeId}]`, text);
      } else {
        console.log(`[${nodeId}]`, text);
      }
    });

    peerRef.current.notifications.onstatus(({ nodeId, status }) => {
      setNodeStatuses(prev => ({ ...prev, [nodeId]: status }));
    });

    peerRef.current.notifications.onmcpStatus(({ status }) => {
      setMcpStatus(status);
    });

    // Handle download notifications from file write nodes
    peerRef.current.notifications.ondownload(({ nodeId, nodeName, filename, content, mimeType }) => {
      // Create blob and URL in main thread
      const blob = new Blob([content], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const size = blob.size;
      addDownload(nodeId, nodeName, filename, blobUrl, size);
    });

    // Handle error notifications from runtime
    peerRef.current.notifications.onerror(({ nodeId, nodeName, nodeType, message, stack, _msgid }) => {
      addError(nodeId, nodeName, nodeType, message, stack, _msgid);
    });

    // Generic mainThread request handler (fire-and-forget)
    // Routes requests from worker to the appropriate node type's mainThread action handlers
    peerRef.current.notifications.onmainThreadRequest(async ({ nodeId, nodeType, action, params }) => {
      const nodeDef = nodeRegistry.get(nodeType);
      if (!nodeDef?.mainThread?.[action]) {
        console.warn(`No mainThread handler for ${nodeType}.${action}`);
        return;
      }

      try {
        await nodeDef.mainThread[action](peerRef, nodeId, params);
      } catch (err) {
        console.error(`Error in mainThread handler ${nodeType}.${action}:`, err);
      }
    });

    // Generic mainThread method handler (returns result to worker)
    peerRef.current.addHandler('mainThreadCall', async ({ nodeId, nodeType, action, params }) => {
      const nodeDef = nodeRegistry.get(nodeType);
      if (!nodeDef?.mainThread?.[action]) {
        throw new Error(`No mainThread handler for ${nodeType}.${action}`);
      }

      return await nodeDef.mainThread[action](peerRef, nodeId, params);
    });

    // MCP handlers - called from worker when MCP server requests data
    peerRef.current.addHandler('mcpGetState', () => {
      const state = flowStateRef.current;
      // Build compact node catalog from registry
      const nodeCatalog = nodeRegistry.getAll().map(def => ({
        type: def.type,
        category: def.category,
        description: def.description || '',
        inputs: def.inputs,
        outputs: def.outputs,
        // Just property names and types, not full schema
        properties: def.defaults ? Object.entries(def.defaults).map(([name, schema]) => ({
          name,
          type: schema.type,
          required: schema.required || false
        })) : [],
        requiresGesture: def.requiresGesture || false
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
      const { type, flowId, x, y, name, config } = args;
      const nodeDef = nodeRegistry.get(type);
      if (!nodeDef) {
        throw new Error(`Unknown node type: ${type}`);
      }

      // Build defaults from node definition
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
          z: flowId,
          x: x || 100,
          y: y || 100,
          wires: []
        },
        ...defaults,
        ...config
      };

      flowDispatch({ type: 'ADD_NODE', node: newNode });
      return { success: true, node: newNode };
    });

    peerRef.current.addHandler('mcpAddNodes', (flowId, nodes) => {
      if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error('nodes must be a non-empty array');
      }

      // First pass: generate real IDs and build tempId → realId map
      const tempToReal = {};
      const nodesWithIds = nodes.map(node => {
        const realId = generateId();
        if (node.tempId) {
          tempToReal[node.tempId] = realId;
        }
        return { ...node, _realId: realId };
      });

      // Second pass: create nodes with wires mapped to real IDs
      const createdNodes = [];
      for (const node of nodesWithIds) {
        const { tempId, type, x, y, name, wires, _realId, ...config } = node;

        const nodeDef = nodeRegistry.get(type);
        if (!nodeDef) {
          throw new Error(`Unknown node type: ${type}`);
        }

        // Build defaults from node definition
        const defaults = {};
        if (nodeDef.defaults) {
          for (const [key, def] of Object.entries(nodeDef.defaults)) {
            defaults[key] = config[key] ?? def.default;
          }
        }

        // Map tempIds in wires to real IDs
        const mappedWires = (wires || []).map(outputWires =>
          (outputWires || []).map(targetTempId => tempToReal[targetTempId] || targetTempId)
        );

        const newNode = {
          _node: {
            id: _realId,
            type,
            name: name || '',
            z: flowId,
            x: x || 100,
            y: y || 100,
            wires: mappedWires
          },
          ...defaults,
          ...config
        };

        flowDispatch({ type: 'ADD_NODE', node: newNode });
        createdNodes.push({ tempId, id: _realId, node: newNode });
      }

      return { success: true, nodes: createdNodes };
    });

    peerRef.current.addHandler('mcpUpdateNode', (nodeId, updates) => {
      const state = flowStateRef.current;
      const node = state.nodes[nodeId];
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      // Separate _node updates from config updates
      const nodeUpdates = {};
      const configUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        if (['x', 'y', 'name', 'wires'].includes(key)) {
          nodeUpdates[key] = value;
        } else {
          configUpdates[key] = value;
        }
      }

      flowDispatch({
        type: 'UPDATE_NODE',
        id: nodeId,
        updates: {
          _node: { ...node._node, ...nodeUpdates },
          ...configUpdates
        }
      });
      return { success: true };
    });

    peerRef.current.addHandler('mcpDeleteNode', (nodeId) => {
      flowDispatch({ type: 'DELETE_NODES', ids: [nodeId] });
      return { success: true };
    });

    peerRef.current.addHandler('mcpConnectNodes', (sourceId, targetId, sourcePort = 0) => {
      const state = flowStateRef.current;
      const sourceNode = state.nodes[sourceId];
      if (!sourceNode) {
        throw new Error(`Source node not found: ${sourceId}. Available node IDs: ${Object.keys(state.nodes).join(', ')}`);
      }
      const targetNode = state.nodes[targetId];
      if (!targetNode) {
        throw new Error(`Target node not found: ${targetId}. Available node IDs: ${Object.keys(state.nodes).join(', ')}`);
      }

      // Update wires
      const wires = [...(sourceNode._node.wires || [])];
      while (wires.length <= sourcePort) {
        wires.push([]);
      }
      if (!wires[sourcePort].includes(targetId)) {
        wires[sourcePort] = [...wires[sourcePort], targetId];
      }

      flowDispatch({
        type: 'UPDATE_NODE',
        id: sourceId,
        updates: { _node: { ...sourceNode._node, wires } }
      });
      return {
        success: true,
        connection: {
          from: `${sourceNode._node.type}(${sourceId})`,
          to: `${targetNode._node.type}(${targetId})`,
          port: sourcePort
        },
        sourceWires: wires
      };
    });

    peerRef.current.addHandler('mcpDisconnectNodes', (sourceId, targetId, sourcePort = 0) => {
      const state = flowStateRef.current;
      const sourceNode = state.nodes[sourceId];
      if (!sourceNode) {
        throw new Error(`Source node not found: ${sourceId}`);
      }

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
      if (deployRef.current) {
        const state = flowStateRef.current;
        await deployRef.current(state.nodes, state.configNodes, []);
        return { success: true, message: 'Flows deployed to runtime' };
      }
      return { success: false, message: 'Deploy function not ready' };
    });

    peerRef.current.addHandler('mcpGetDebugOutput', (limit = 10) => {
      const msgs = messagesRef.current || [];
      // Messages are newest-first, so slice from start
      return msgs.slice(0, limit);
    });

    peerRef.current.addHandler('mcpGetErrors', (limit = 10) => {
      const errs = errorsRef.current || [];
      // Errors are newest-first, so slice from start
      return errs.slice(0, limit);
    });

    peerRef.current.addHandler('mcpInject', async (nodeId, payload) => {
      if (!peerRef.current) {
        return { success: false, error: 'Runtime not connected' };
      }
      // Build message object (check both undefined and null since RPC converts undefined to null)
      const msg = (payload !== undefined && payload !== null) ? { payload } : {};
      // inject returns { success, _msgid } for tracing
      const result = await peerRef.current.methods.inject(nodeId, msg);
      return result;
    });

    peerRef.current.addHandler('mcpTrigger', async (nodeId, msg) => {
      if (!peerRef.current) {
        return { success: false, error: 'Runtime not connected' };
      }
      // Build message object (handle null from RPC)
      const message = (msg !== undefined && msg !== null) ? msg : {};
      const result = await peerRef.current.methods.trigger(nodeId, message);
      return result;
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

    peerRef.current.addHandler('mcpGetCanvasSvg', () => {
      // Get the canvas SVG from the DOM
      const svgElement = document.querySelector('.canvas-svg');
      if (!svgElement) {
        return { error: 'Canvas SVG not found' };
      }
      return {
        svg: svgElement.outerHTML,
        width: svgElement.getAttribute('width'),
        height: svgElement.getAttribute('height')
      };
    });

    peerRef.current.addHandler('mcpGetInjectNodes', () => {
      const state = flowStateRef.current;
      if (!state?.nodes) return [];
      // Return all inject nodes with their IDs and names
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
      if (!nodeDef) {
        throw new Error(`Unknown node type: ${type}`);
      }

      // Render help to HTML string
      let helpHtml = null;
      if (nodeDef.renderHelp) {
        try {
          helpHtml = renderToStaticMarkup(nodeDef.renderHelp());
        } catch (e) {
          helpHtml = `Error rendering help: ${e.message}`;
        }
      }

      // Return serializable node definition
      const result = {
        type: nodeDef.type,
        category: nodeDef.category,
        description: nodeDef.description,
        inputs: nodeDef.inputs,
        outputs: nodeDef.outputs,
        defaults: nodeDef.defaults ? Object.fromEntries(
          Object.entries(nodeDef.defaults).map(([key, def]) => [
            key,
            {
              type: def.type,
              default: def.default,
              required: def.required,
              label: def.label,
              placeholder: def.placeholder
            }
          ])
        ) : {},
        help: helpHtml
      };

      // Include messageInterface if defined
      if (nodeDef.messageInterface) {
        result.messageInterface = nodeDef.messageInterface;
      }

      // Include relatedDocs if defined
      if (nodeDef.relatedDocs) {
        try {
          result.relatedDocs = typeof nodeDef.relatedDocs === 'function'
            ? nodeDef.relatedDocs()
            : nodeDef.relatedDocs;
        } catch {
          // Ignore errors in relatedDocs
        }
      }

      return result;
    });

    // Load settings and connect to MCP if enabled
    storage.getSettings().then(settings => {
      if (settings.mcpEnabled) {
        peerRef.current.methods.connectMcp(settings.mcpPort);
      }
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, [addMessage, addError, flowDispatch]);

  // Deploy flows to worker
  const deploy = useCallback(async (nodes, configNodes = {}, errorNodeIds = []) => {
    if (!peerRef.current || !isReady) {
      console.warn('Worker not ready');
      return;
    }

    // Convert nodes object to array and strip editor-only props
    const flowNodes = Object.values(nodes).map(node => {
      // Keep _node with runtime-relevant props, keep config at top level
      const { x: _x, y: _y, ...runtimeNodeProps } = node._node;
      return {
        _node: runtimeNodeProps,
        ...Object.fromEntries(
          Object.entries(node).filter(([key]) => key !== '_node')
        )
      };
    });

    // Convert config nodes object to array
    const flowConfigNodes = Object.values(configNodes).map(node => {
      // Config nodes don't have x, y, z, wires - just _node and config
      return {
        _node: { ...node._node },
        ...Object.fromEntries(
          Object.entries(node).filter(([key]) => key !== '_node' && key !== 'users')
        )
      };
    });

    // Get all node IDs that are being deployed (for cleanup after)
    const deployedNodeIds = new Set([
      ...Object.keys(nodes),
      ...Object.keys(configNodes)
    ]);

    try {
      const result = await peerRef.current.methods.deploy(flowNodes, flowConfigNodes, errorNodeIds);
      setIsRunning(true);

      // Only remove statuses for nodes that are no longer deployed.
      // Regular nodes set their status during onInit (which happens during deploy),
      // so we must NOT clear their statuses here - that would race with the status
      // notifications arriving from the worker.
      setNodeStatuses(prev => {
        const kept = {};
        for (const [id, status] of Object.entries(prev)) {
          if (deployedNodeIds.has(id)) {
            kept[id] = status;
          }
        }
        return kept;
      });

      console.log('Flows deployed:', result.nodeCount, 'nodes,', result.configCount || 0, 'config nodes');
      if (result.reusedConfigCount > 0) {
        console.log('Preserved', result.reusedConfigCount, 'unchanged config node connections');
      }
      if (errorNodeIds.length > 0) {
        console.warn('Skipped', errorNodeIds.length, 'nodes with errors');
      }
    } catch (err) {
      console.error('Deploy failed:', err);
    }
  }, [isReady]);

  // Keep deployRef updated for MCP handler
  useEffect(() => {
    deployRef.current = deploy;
  }, [deploy]);

  // Inject into a node (trigger inject nodes)
  const inject = useCallback((nodeId, msg = {}) => {
    if (!peerRef.current || !isRunning) {
      console.warn('Runtime not running');
      return;
    }

    peerRef.current.methods.inject(nodeId, msg);
  }, [isRunning]);

  // Inject text to all inject nodes with allowDebugInput enabled
  const injectText = useCallback((text) => {
    if (!peerRef.current || !isRunning) {
      console.warn('Runtime not running');
      return;
    }

    peerRef.current.methods.injectText(text);
  }, [isRunning]);

  // Call a mainThread method directly from UI (for button clicks like file read)
  const callMainThread = useCallback(async (nodeType, action, nodeId, params) => {
    const nodeDef = nodeRegistry.get(nodeType);
    if (!nodeDef?.mainThread?.[action]) {
      console.warn(`No mainThread handler for ${nodeType}.${action}`);
      return;
    }

    try {
      return await nodeDef.mainThread[action](peerRef, nodeId, params);
    } catch (err) {
      console.error(`Error in mainThread handler ${nodeType}.${action}:`, err);
    }
  }, []);

  // Stop the runtime
  const stop = useCallback(async () => {
    if (!peerRef.current) return;

    await peerRef.current.methods.stop();
    setIsRunning(false);
    console.log('Runtime stopped');
  }, []);

  // Connect to MCP server
  const connectMcp = useCallback((port) => {
    if (!peerRef.current) return;
    peerRef.current.methods.connectMcp(port);
  }, []);

  // Disconnect from MCP server
  const disconnectMcp = useCallback(() => {
    if (!peerRef.current) return;
    peerRef.current.methods.disconnectMcp();
  }, []);

  // Broadcast to all nodes of a specific type (for buttons panel, etc.)
  const broadcastToType = useCallback((nodeType, action, params) => {
    if (!peerRef.current || !isRunning) return;
    peerRef.current.methods.broadcastToType(nodeType, action, params);
  }, [isRunning]);

  const value = {
    isReady,
    isRunning,
    nodeStatuses,
    mcpStatus,
    deploy,
    inject,
    injectText,
    callMainThread,
    broadcastToType,
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

export function useRuntime() {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error('useRuntime must be used within RuntimeProvider');
  }
  return context;
}
