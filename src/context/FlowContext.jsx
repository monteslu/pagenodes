import { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { nodeRegistry } from '../nodes';

const MAX_HISTORY = 50;

const initialState = {
  flows: [],
  nodes: {},
  configNodes: {},  // Config nodes stored separately by ID
  _history: [],
  _historyPosition: -1
};

// Actions that should trigger history snapshots
const HISTORY_ACTIONS = [
  'ADD_NODE', 'UPDATE_NODE', 'UPDATE_NODE_PROPS', 'DELETE_NODES',
  'MOVE_NODES', 'CONNECT', 'DISCONNECT', 'CONNECT_STREAM', 'DISCONNECT_STREAM',
  'ADD_CONFIG_NODE', 'UPDATE_CONFIG_NODE', 'DELETE_CONFIG_NODE',
  'IMPORT_FLOWS', 'DELETE_FLOW'
];

function getSnapshot(state) {
  return {
    flows: state.flows,
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    configNodes: JSON.parse(JSON.stringify(state.configNodes))
  };
}

function flowReducer(state, action) {
  switch (action.type) {
    case 'SET_FLOWS': {
      const nodes = {};
      const configNodes = {};
      action.nodes.forEach(n => {
        // Check if this is a config node using the node registry
        const nodeDef = nodeRegistry.get(n._node.type);
        const isConfigNode = nodeDef?.category === 'config';
        if (isConfigNode) {
          configNodes[n._node.id] = n;
        } else {
          nodes[n._node.id] = n;
        }
      });
      // Also handle explicitly passed config nodes
      if (action.configNodes) {
        action.configNodes.forEach(n => {
          configNodes[n._node.id] = n;
        });
      }
      return {
        ...state,
        flows: action.flows,
        nodes,
        configNodes,
        _history: [],
        _historyPosition: -1
      };
    }

    case 'IMPORT_FLOWS': {
      // Merge imported flows with existing (add new flows)
      const existingFlowIds = new Set(state.flows.map(f => f.id));
      const newFlows = (action.flows || []).filter(f => !existingFlowIds.has(f.id));
      const mergedFlows = [...state.flows, ...newFlows];

      // Merge nodes (add new nodes, imported nodes go to targetFlow if specified)
      const mergedNodes = { ...state.nodes };
      for (const node of action.nodes) {
        // If targetFlow specified, override the node's z property (but not for config nodes)
        const nodeDef = nodeRegistry.get(node._node.type);
        const isConfigNode = nodeDef?.category === 'config';
        if (action.targetFlow && !isConfigNode) {
          node._node.z = action.targetFlow;
        }
        mergedNodes[node._node.id] = node;
      }

      // Merge config nodes
      const mergedConfigNodes = { ...state.configNodes };
      for (const node of action.configNodes || []) {
        mergedConfigNodes[node._node.id] = {
          ...node,
          users: []
        };
      }

      return {
        ...state,
        flows: mergedFlows,
        nodes: mergedNodes,
        configNodes: mergedConfigNodes
      };
    }

    case 'ADD_FLOW':
      return {
        ...state,
        flows: [...state.flows, action.flow]
      };

    case 'DELETE_FLOW': {
      // Don't delete the last flow
      if (state.flows.length <= 1) return state;

      // Remove the flow
      const flows = state.flows.filter(f => f.id !== action.id);

      // Remove all nodes in that flow
      const nodes = {};
      Object.entries(state.nodes).forEach(([id, node]) => {
        if (node._node.z !== action.id) {
          nodes[id] = node;
        }
      });

      // Clean up wires and streamWires pointing to deleted nodes
      const deletedNodeIds = Object.keys(state.nodes).filter(id => state.nodes[id]._node.z === action.id);
      Object.values(nodes).forEach(node => {
        if (node._node.wires) {
          node._node.wires = node._node.wires.map(outputs =>
            outputs.filter(targetId => !deletedNodeIds.includes(targetId))
          );
        }
        if (node._node.streamWires) {
          node._node.streamWires = node._node.streamWires.map(outputs =>
            outputs.filter(targetId => !deletedNodeIds.includes(targetId))
          );
        }
      });

      return { ...state, flows, nodes };
    }

    case 'ADD_NODE': {
      // Check if this is a config node using the node registry
      const nodeDef = nodeRegistry.get(action.node._node.type);
      const isConfigNode = nodeDef?.category === 'config';
      if (isConfigNode) {
        return {
          ...state,
          configNodes: { ...state.configNodes, [action.node._node.id]: action.node }
        };
      }
      return {
        ...state,
        nodes: { ...state.nodes, [action.node._node.id]: action.node }
      };
    }

    case 'UPDATE_NODE': {
      // Check if node is in nodes or configNodes
      if (state.nodes[action.id]) {
        return {
          ...state,
          nodes: {
            ...state.nodes,
            [action.id]: { ...state.nodes[action.id], ...action.changes }
          }
        };
      } else if (state.configNodes[action.id]) {
        return {
          ...state,
          configNodes: {
            ...state.configNodes,
            [action.id]: { ...state.configNodes[action.id], ...action.changes }
          }
        };
      }
      return state;
    }

    case 'UPDATE_NODE_PROPS': {
      // Check if node is in nodes or configNodes
      if (state.nodes[action.id]) {
        return {
          ...state,
          nodes: {
            ...state.nodes,
            [action.id]: {
              ...state.nodes[action.id],
              _node: { ...state.nodes[action.id]._node, ...action.nodeProps }
            }
          }
        };
      } else if (state.configNodes[action.id]) {
        return {
          ...state,
          configNodes: {
            ...state.configNodes,
            [action.id]: {
              ...state.configNodes[action.id],
              _node: { ...state.configNodes[action.id]._node, ...action.nodeProps }
            }
          }
        };
      }
      return state;
    }

    case 'DELETE_NODES': {
      const nodes = { ...state.nodes };
      const configNodes = { ...state.configNodes };
      action.ids.forEach(id => {
        delete nodes[id];
        delete configNodes[id];
      });
      // Clean up wires and streamWires referencing deleted nodes
      Object.values(nodes).forEach(node => {
        if (node._node.wires) {
          node._node.wires = node._node.wires.map(outputs =>
            outputs.filter(targetId => !action.ids.includes(targetId))
          );
        }
        if (node._node.streamWires) {
          node._node.streamWires = node._node.streamWires.map(outputs =>
            outputs.filter(targetId => !action.ids.includes(targetId))
          );
        }
      });
      return { ...state, nodes, configNodes };
    }

    case 'MOVE_NODES':
      return {
        ...state,
        nodes: Object.fromEntries(
          Object.entries(state.nodes).map(([id, node]) => {
            if (action.ids.includes(id)) {
              return [id, {
                ...node,
                _node: {
                  ...node._node,
                  x: node._node.x + action.dx,
                  y: node._node.y + action.dy
                }
              }];
            }
            return [id, node];
          })
        )
      };

    case 'CONNECT': {
      const node = state.nodes[action.sourceId];
      if (!node) return state;

      const wires = [...(node._node.wires || [])];
      while (wires.length <= action.sourcePort) wires.push([]);
      if (!wires[action.sourcePort].includes(action.targetId)) {
        wires[action.sourcePort] = [...wires[action.sourcePort], action.targetId];
      }

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.sourceId]: { ...node, _node: { ...node._node, wires } }
        }
      };
    }

    case 'DISCONNECT': {
      const node = state.nodes[action.sourceId];
      if (!node || !node._node.wires) return state;

      const wires = node._node.wires.map((outputs, portIndex) =>
        portIndex === action.sourcePort
          ? outputs.filter(id => id !== action.targetId)
          : outputs
      );

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.sourceId]: { ...node, _node: { ...node._node, wires } }
        }
      };
    }

    // Audio stream wire connections
    case 'CONNECT_STREAM': {
      const node = state.nodes[action.sourceId];
      if (!node) return state;

      const streamWires = [...(node._node.streamWires || [])];
      while (streamWires.length <= action.sourcePort) streamWires.push([]);
      if (!streamWires[action.sourcePort].includes(action.targetId)) {
        streamWires[action.sourcePort] = [...streamWires[action.sourcePort], action.targetId];
      }

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.sourceId]: { ...node, _node: { ...node._node, streamWires } }
        }
      };
    }

    case 'DISCONNECT_STREAM': {
      const node = state.nodes[action.sourceId];
      if (!node || !node._node.streamWires) return state;

      const streamWires = node._node.streamWires.map((outputs, portIndex) =>
        portIndex === action.sourcePort
          ? outputs.filter(id => id !== action.targetId)
          : outputs
      );

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.sourceId]: { ...node, _node: { ...node._node, streamWires } }
        }
      };
    }

    // Config node actions
    case 'ADD_CONFIG_NODE':
      return {
        ...state,
        configNodes: {
          ...state.configNodes,
          [action.node._node.id]: {
            ...action.node,
            users: []  // Track nodes that use this config
          }
        }
      };

    case 'UPDATE_CONFIG_NODE':
      return {
        ...state,
        configNodes: {
          ...state.configNodes,
          [action.id]: {
            ...state.configNodes[action.id],
            ...action.changes
          }
        }
      };

    case 'DELETE_CONFIG_NODE': {
      const configNodes = { ...state.configNodes };
      delete configNodes[action.id];
      return { ...state, configNodes };
    }

    case 'ADD_CONFIG_USER': {
      const configNode = state.configNodes[action.configId];
      if (!configNode) return state;
      const users = configNode.users || [];
      if (!users.includes(action.nodeId)) {
        return {
          ...state,
          configNodes: {
            ...state.configNodes,
            [action.configId]: {
              ...configNode,
              users: [...users, action.nodeId]
            }
          }
        };
      }
      return state;
    }

    case 'REMOVE_CONFIG_USER': {
      const configNode = state.configNodes[action.configId];
      if (!configNode) return state;
      return {
        ...state,
        configNodes: {
          ...state.configNodes,
          [action.configId]: {
            ...configNode,
            users: (configNode.users || []).filter(id => id !== action.nodeId)
          }
        }
      };
    }

    case 'PUSH_HISTORY': {
      const snapshot = action.snapshot;
      let history = state._history.slice(0, state._historyPosition + 1);
      history.push(snapshot);

      if (history.length > MAX_HISTORY) {
        history = history.slice(-MAX_HISTORY);
      }

      return {
        ...state,
        _history: history,
        _historyPosition: history.length - 1
      };
    }

    case 'UNDO': {
      if (state._historyPosition < 0) return state;

      const snapshot = state._history[state._historyPosition];
      return {
        ...state,
        flows: snapshot.flows,
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        configNodes: JSON.parse(JSON.stringify(snapshot.configNodes || {})),
        _historyPosition: state._historyPosition - 1
      };
    }

    case 'REDO': {
      if (state._historyPosition >= state._history.length - 1) return state;

      const newPosition = state._historyPosition + 2;
      if (newPosition >= state._history.length) {
        return state;
      }

      const snapshot = state._history[newPosition];
      return {
        ...state,
        flows: snapshot.flows,
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        configNodes: JSON.parse(JSON.stringify(snapshot.configNodes || {})),
        _historyPosition: newPosition - 1
      };
    }

    default:
      return state;
  }
}

const FlowContext = createContext(null);

export function FlowProvider({ children }) {
  const [state, baseDispatch] = useReducer(flowReducer, initialState);

  // Use ref to access current state without causing dispatch to change
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Wrap dispatch to automatically push history for certain actions
  const dispatch = useCallback((action) => {
    if (HISTORY_ACTIONS.includes(action.type)) {
      baseDispatch({ type: 'PUSH_HISTORY', snapshot: getSnapshot(stateRef.current) });
    }
    baseDispatch(action);
  }, []);

  const undo = useCallback(() => {
    baseDispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    baseDispatch({ type: 'REDO' });
  }, []);

  const value = useMemo(() => ({
    state,
    dispatch,
    undo,
    redo,
    canUndo: state._historyPosition >= 0,
    canRedo: state._historyPosition < state._history.length - 1
  }), [state, dispatch, undo, redo]);

  return (
    <FlowContext.Provider value={value}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlows() {
  const context = useContext(FlowContext);
  if (!context) throw new Error('useFlows must be used within FlowProvider');
  return context;
}
