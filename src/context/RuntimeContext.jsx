import { createContext, useContext, useRef, useEffect, useCallback, useState } from 'react';
import rawr, { transports } from 'rawr';
import { useDebug } from './DebugContext';
import { nodeRegistry } from '../nodes';

const RuntimeContext = createContext(null);

export function RuntimeProvider({ children }) {
  const workerRef = useRef(null);
  const peerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const { addMessage } = useDebug();

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

    peerRef.current.notifications.ondebug(({ nodeId, nodeName, payload, topic }) => {
      addMessage(nodeId, nodeName, payload, topic);
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

    return () => {
      workerRef.current?.terminate();
    };
  }, [addMessage]);

  // Deploy flows to worker
  const deploy = useCallback(async (nodes, configNodes = {}, errorNodeIds = []) => {
    if (!peerRef.current || !isReady) {
      console.warn('Worker not ready');
      return;
    }

    // Convert nodes object to array and strip editor-only props
    const flowNodes = Object.values(nodes).map(node => {
      // Keep _node with runtime-relevant props, keep config at top level
      const { x, y, ...runtimeNodeProps } = node._node;
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

    // Clear previous statuses
    setNodeStatuses({});

    try {
      const result = await peerRef.current.methods.deploy(flowNodes, flowConfigNodes, errorNodeIds);
      setIsRunning(true);
      console.log('Flows deployed:', result.nodeCount, 'nodes,', result.configCount || 0, 'config nodes');
      if (errorNodeIds.length > 0) {
        console.warn('Skipped', errorNodeIds.length, 'nodes with errors');
      }
    } catch (err) {
      console.error('Deploy failed:', err);
    }
  }, [isReady]);

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

  // Stop the runtime
  const stop = useCallback(async () => {
    if (!peerRef.current) return;

    await peerRef.current.methods.stop();
    setIsRunning(false);
    console.log('Runtime stopped');
  }, []);

  const value = {
    isReady,
    isRunning,
    nodeStatuses,
    deploy,
    inject,
    injectText,
    stop
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
