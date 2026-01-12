import { useState, useCallback, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { useNodes } from './useNodes';

export function useDrag(screenToCanvas) {
  const { state: editor, dispatch: editorDispatch } = useEditor();
  const { moveNodes } = useNodes();

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const nodeStartPositions = useRef({});

  const startDrag = useCallback((e, nodeId, nodes) => {
    // If node isn't selected, select it (unless shift held)
    if (!editor.selectedNodes.includes(nodeId)) {
      if (e.shiftKey) {
        editorDispatch({ type: 'SELECT_NODE', id: nodeId, additive: true });
      } else {
        editorDispatch({ type: 'SELECT_NODE', id: nodeId });
      }
    }

    const pos = screenToCanvas(e.clientX, e.clientY);
    dragStart.current = pos;

    // Store start positions of all selected nodes
    const selected = editor.selectedNodes.includes(nodeId)
      ? editor.selectedNodes
      : [nodeId];

    nodeStartPositions.current = {};
    selected.forEach(id => {
      const node = nodes[id];
      if (node) {
        nodeStartPositions.current[id] = { x: node._node.x, y: node._node.y };
      }
    });

    setIsDragging(true);
  }, [editor.selectedNodes, editorDispatch, screenToCanvas]);

  const onDrag = useCallback((e) => {
    if (!isDragging) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    const dx = pos.x - dragStart.current.x;
    const dy = pos.y - dragStart.current.y;

    // Move all selected nodes
    const ids = Object.keys(nodeStartPositions.current);
    if (ids.length > 0) {
      moveNodes(ids, dx, dy);
      // Reset drag start to current position for incremental moves
      dragStart.current = pos;
    }
  }, [isDragging, screenToCanvas, moveNodes]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    nodeStartPositions.current = {};
  }, []);

  return {
    isDragging,
    startDrag,
    onDrag,
    endDrag
  };
}
