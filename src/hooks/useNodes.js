import { useCallback, useMemo } from 'react';
import { useFlows } from '../context/FlowContext';
import { useEditor } from '../context/EditorContext';
import { nodeRegistry } from '../nodes';
import { generateId } from '../utils/id';

export function useNodes() {
  const { state: flowState, dispatch: flowDispatch } = useFlows();
  const { state: editorState, dispatch: editorDispatch } = useEditor();

  // Nodes for current flow (filter by _node.z)
  const activeNodes = useMemo(() =>
    Object.values(flowState.nodes).filter(n => n._node.z === editorState.activeFlow),
    [flowState.nodes, editorState.activeFlow]
  );

  // Config nodes (no z property)
  const configNodes = useMemo(() =>
    Object.values(flowState.nodes).filter(n => !n._node.z),
    [flowState.nodes]
  );

  // Add a new node
  const addNode = useCallback((type, x, y) => {
    const def = nodeRegistry.get(type);
    if (!def) return null;

    const node = {
      // Reserved properties in _node
      _node: {
        id: generateId(),
        type,
        name: '',
        z: editorState.activeFlow,
        x,
        y,
        wires: Array(def.outputs || 0).fill().map(() => [])
      },
      // Custom config from defaults
      ...Object.fromEntries(
        Object.entries(def.defaults || {}).map(([key, prop]) => [key, prop.default])
      )
    };

    flowDispatch({ type: 'ADD_NODE', node });
    editorDispatch({ type: 'ADD_PENDING_NODE', nodeId: node._node.id });
    editorDispatch({ type: 'MARK_DIRTY' });
    return node;
  }, [flowDispatch, editorDispatch, editorState.activeFlow]);

  // Update node custom properties
  const updateNode = useCallback((id, changes) => {
    flowDispatch({ type: 'UPDATE_NODE', id, changes });
    editorDispatch({ type: 'MARK_DIRTY' });
  }, [flowDispatch, editorDispatch]);

  // Update node _node properties (position, name, etc.)
  const updateNodeProps = useCallback((id, nodeProps) => {
    flowDispatch({ type: 'UPDATE_NODE_PROPS', id, nodeProps });
    editorDispatch({ type: 'MARK_DIRTY' });
  }, [flowDispatch, editorDispatch]);

  // Move nodes by delta
  const moveNodes = useCallback((ids, dx, dy) => {
    flowDispatch({ type: 'MOVE_NODES', ids, dx, dy });
    editorDispatch({ type: 'MARK_DIRTY' });
  }, [flowDispatch, editorDispatch]);

  // Connect two nodes
  const connect = useCallback((sourceId, sourcePort, targetId) => {
    flowDispatch({ type: 'CONNECT', sourceId, sourcePort, targetId });
    editorDispatch({ type: 'MARK_DIRTY' });
  }, [flowDispatch, editorDispatch]);

  // Disconnect nodes
  const disconnect = useCallback((sourceId, sourcePort, targetId) => {
    flowDispatch({ type: 'DISCONNECT', sourceId, sourcePort, targetId });
    editorDispatch({ type: 'MARK_DIRTY' });
  }, [flowDispatch, editorDispatch]);

  // Delete selected
  const deleteSelected = useCallback(() => {
    if (editorState.selectedNodes.length === 0) return;
    flowDispatch({ type: 'DELETE_NODES', ids: editorState.selectedNodes });
    editorDispatch({ type: 'DESELECT_ALL' });
    editorDispatch({ type: 'MARK_DIRTY' });
  }, [flowDispatch, editorDispatch, editorState.selectedNodes]);

  // Get a node by ID
  const getNode = useCallback((id) => flowState.nodes[id], [flowState.nodes]);

  return {
    nodes: flowState.nodes,
    activeNodes,
    configNodes,
    addNode,
    updateNode,
    updateNodeProps,
    moveNodes,
    connect,
    disconnect,
    deleteSelected,
    getNode
  };
}
