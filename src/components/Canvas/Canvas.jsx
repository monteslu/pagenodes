import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useRuntime } from '../../context/RuntimeContext';
import { useNodes } from '../../hooks/useNodes';
import { useCanvas } from '../../hooks/useCanvas';
import { useDrag } from '../../hooks/useDrag';
import { Node } from './Node';
import { Wire } from './Wire';
import { SVGDefs } from './SVGDefs';
import { getPortPosition, calcNodeHeight, normalizeRect, isNodeInSelection } from '../../utils/geometry';
import { nodeRegistry } from '../../nodes';
import './Canvas.css';

export function Canvas({ onEditNode, onInject, onFileDrop }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const { state: editor, dispatch } = useEditor();
  const { nodeStatuses } = useRuntime();
  const { activeNodes, nodes, connect, disconnect } = useNodes();
  const { screenToCanvas, handlers: canvasHandlers } = useCanvas(svgRef);
  const { startDrag, onDrag, endDrag } = useDrag(screenToCanvas);

  // For drawing new connections
  const [tempWire, setTempWire] = useState(null);
  const [hoverPort, setHoverPort] = useState(null); // { nodeId, portIndex } when hovering input

  // For selection box
  const [selecting, setSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  // For wire selection
  const [selectedWire, setSelectedWire] = useState(null);

  // Track if we just finished a selection drag (to prevent click from clearing it)
  const justSelectedRef = useRef(false);

  // Build wire list from node._node.wires
  const wires = useMemo(() => {
    const result = [];
    activeNodes.forEach(node => {
      (node._node.wires || []).forEach((targets, portIndex) => {
        targets.forEach(targetId => {
          if (nodes[targetId]) {
            result.push({
              id: `${node._node.id}-${portIndex}-${targetId}`,
              sourceId: node._node.id,
              sourcePort: portIndex,
              targetId
            });
          }
        });
      });
    });
    return result;
  }, [activeNodes, nodes]);

  const handleCanvasClick = useCallback((e) => {
    // Don't deselect if we just finished a selection drag
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (e.target === svgRef.current || e.target.classList.contains('canvas-bg')) {
      dispatch({ type: 'DESELECT_ALL' });
      setSelectedWire(null);
    }
  }, [dispatch]);

  const handleCanvasMouseDown = useCallback((e) => {
    canvasHandlers.onMouseDown(e);

    // Start selection box if clicking on empty canvas with left button
    if (e.button === 0 && (e.target === svgRef.current || e.target.classList.contains('canvas-bg'))) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setSelecting(true);
      setSelectionStart(pos);
      setSelectionEnd(pos);
    }
  }, [canvasHandlers, screenToCanvas]);

  // Touch support for canvas
  const handleCanvasTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    // Simulate mousedown for canvas handlers
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, button: 0 };
    canvasHandlers.onMouseDown(fakeEvent);

    // Start selection if touching empty canvas
    if (e.target === svgRef.current || e.target.classList.contains('canvas-bg')) {
      const pos = screenToCanvas(touch.clientX, touch.clientY);
      setSelecting(true);
      setSelectionStart(pos);
      setSelectionEnd(pos);
    }
  }, [canvasHandlers, screenToCanvas]);

  const handleCanvasTouchMove = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    // Simulate mousemove
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
    canvasHandlers.onMouseMove(fakeEvent);
    onDrag(fakeEvent);

    // Update selection box
    if (selecting) {
      const pos = screenToCanvas(touch.clientX, touch.clientY);
      setSelectionEnd(pos);
    }

    // Update temp wire if connecting
    if (editor.connecting) {
      const pos = screenToCanvas(touch.clientX, touch.clientY);
      setTempWire({ x: pos.x, y: pos.y });
    }
  }, [canvasHandlers, onDrag, selecting, editor.connecting, screenToCanvas]);

  const handleCanvasTouchEnd = useCallback((e) => {
    // Simulate mouseup
    canvasHandlers.onMouseUp({});
    endDrag();

    // Finish selection box
    if (selecting && selectionStart && selectionEnd) {
      const rect = normalizeRect(selectionStart.x, selectionStart.y, selectionEnd.x, selectionEnd.y);
      if (rect.width > 5 || rect.height > 5) {
        const selectedIds = activeNodes
          .filter(node => isNodeInSelection(node, rect))
          .map(node => node._node.id);
        dispatch({ type: 'SELECT_NODES', ids: selectedIds });
        justSelectedRef.current = true;
      }
      setSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }

    // Finish connection
    if (editor.connecting) {
      dispatch({ type: 'STOP_CONNECTING' });
      setTempWire(null);
      setHoverPort(null);
    }
  }, [canvasHandlers, endDrag, selecting, selectionStart, selectionEnd, activeNodes, editor.connecting, dispatch]);

  const handleCanvasMouseMove = useCallback((e) => {
    canvasHandlers.onMouseMove(e);
    onDrag(e);

    // Update selection box
    if (selecting) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setSelectionEnd(pos);
    }

    // Update temp wire if connecting
    if (editor.connecting) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setTempWire({ x: pos.x, y: pos.y });
    }
  }, [canvasHandlers, onDrag, selecting, editor.connecting, screenToCanvas]);

  const handleCanvasMouseUp = useCallback((e) => {
    canvasHandlers.onMouseUp(e);
    endDrag();

    // Finish selection box
    if (selecting && selectionStart && selectionEnd) {
      const rect = normalizeRect(selectionStart.x, selectionStart.y, selectionEnd.x, selectionEnd.y);
      if (rect.width > 5 || rect.height > 5) {
        // Select nodes within the box
        const selectedIds = activeNodes
          .filter(node => isNodeInSelection(node, rect))
          .map(node => node._node.id);
        dispatch({ type: 'SELECT_NODES', ids: selectedIds });
        // Prevent the click event from clearing the selection
        justSelectedRef.current = true;
      }
      setSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }

    // Finish connection if we're over a port
    if (editor.connecting) {
      dispatch({ type: 'STOP_CONNECTING' });
      setTempWire(null);
      setHoverPort(null);
    }
  }, [canvasHandlers, endDrag, selecting, selectionStart, selectionEnd, activeNodes, editor.connecting, dispatch]);

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation();
    setSelectedWire(null);
    startDrag(e, nodeId, nodes);
  }, [startDrag, nodes]);

  const handleNodeDoubleClick = useCallback((e, nodeId) => {
    e.stopPropagation();
    if (onEditNode) {
      onEditNode(nodes[nodeId]);
    }
  }, [onEditNode, nodes]);

  const handlePortMouseDown = useCallback((e, nodeId, portIndex, isOutput) => {
    e.stopPropagation();
    if (isOutput) {
      dispatch({ type: 'START_CONNECTING', sourceId: nodeId, sourcePort: portIndex });
      const node = nodes[nodeId];
      const def = nodeRegistry.get(node._node.type);
      const height = calcNodeHeight(def?.outputs || 1);
      const pos = getPortPosition(node, portIndex, true, height);
      setTempWire({ x: pos.x, y: pos.y });
    }
  }, [dispatch, nodes]);

  const handlePortMouseUp = useCallback((e, nodeId, portIndex, isOutput) => {
    e.stopPropagation();
    if (!isOutput && editor.connecting) {
      // Complete the connection
      const { sourceId, sourcePort } = editor.connecting;
      connect(sourceId, sourcePort, nodeId);
      // Mark wire as pending (not yet deployed)
      const wireId = `${sourceId}-${sourcePort}-${nodeId}`;
      dispatch({ type: 'ADD_PENDING_WIRE', wireId });
      dispatch({ type: 'STOP_CONNECTING' });
      setTempWire(null);
      setHoverPort(null);
    }
  }, [editor.connecting, connect, dispatch]);

  const handlePortMouseEnter = useCallback((e, nodeId, portIndex, isOutput) => {
    if (!isOutput && editor.connecting) {
      setHoverPort({ nodeId, portIndex });
    }
  }, [editor.connecting]);

  const handlePortMouseLeave = useCallback((e, nodeId, portIndex, isOutput) => {
    if (!isOutput) {
      setHoverPort(null);
    }
  }, []);

  const handleWireMouseDown = useCallback((e, wireId) => {
    e.stopPropagation();
    dispatch({ type: 'DESELECT_ALL' });
    setSelectedWire(wireId);
  }, [dispatch]);

  const handleWireMouseUp = useCallback((e) => {
    e.stopPropagation();
    // Wire selection confirmed
  }, []);

  // Delete selected wire with keyboard
  const handleKeyDown = useCallback((e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWire) {
      // Parse wire ID to get source and target
      const [sourceId, sourcePort, targetId] = selectedWire.split('-');
      disconnect(sourceId, parseInt(sourcePort), targetId);
      setSelectedWire(null);
    }
  }, [selectedWire, disconnect]);

  // Add keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle scroll-to from minimap
  useEffect(() => {
    if (editor.scrollTarget && containerRef.current) {
      const container = containerRef.current;
      const { x, y } = editor.scrollTarget;

      // Calculate scroll position to center the target point
      const scrollX = (x * editor.zoom) - (container.clientWidth / 2);
      const scrollY = (y * editor.zoom) - (container.clientHeight / 2);

      container.scrollTo({
        left: Math.max(0, scrollX),
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });

      // Clear the scroll target
      dispatch({ type: 'CLEAR_SCROLL_TARGET' });
    }
  }, [editor.scrollTarget, editor.zoom, dispatch]);

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={canvasHandlers.onMouseLeave}
      onTouchStart={handleCanvasTouchStart}
      onTouchMove={handleCanvasTouchMove}
      onTouchEnd={handleCanvasTouchEnd}
    >
      <svg
        ref={svgRef}
        className="canvas-svg"
        viewBox="0 0 5000 5000"
        style={{
          width: 5000 * editor.zoom,
          height: 5000 * editor.zoom
        }}
        onClick={handleCanvasClick}
      >
        <SVGDefs />

        <g>
          {/* Grid background - finite canvas */}
          <rect
            className="canvas-bg"
            x="0"
            y="0"
            width="5000"
            height="5000"
            fill="url(#gridLarge)"
          />

          {/* Wires */}
          <g className="wires">
            {wires.map(wire => (
              <Wire
                key={wire.id}
                sourceNode={nodes[wire.sourceId]}
                sourcePort={wire.sourcePort}
                targetNode={nodes[wire.targetId]}
                selected={selectedWire === wire.id}
                isPending={editor.pendingWires.has(wire.id)}
                onMouseDown={(e) => handleWireMouseDown(e, wire.id)}
                onMouseUp={(e) => handleWireMouseUp(e, wire.id)}
              />
            ))}

            {/* Temporary wire while connecting */}
            {editor.connecting && tempWire && (
              <Wire
                sourceNode={nodes[editor.connecting.sourceId]}
                sourcePort={editor.connecting.sourcePort}
                targetPos={tempWire}
                targetNode={hoverPort ? nodes[hoverPort.nodeId] : null}
                isTemp={true}
                isConnecting={!!hoverPort}
              />
            )}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {activeNodes.map(node => (
              <Node
                key={node._node.id}
                node={node}
                status={nodeStatuses[node._node.id]}
                selected={editor.selectedNodes.includes(node._node.id)}
                isPending={editor.pendingNodes.has(node._node.id)}
                hasErrors={editor.nodeErrors.has(node._node.id)}
                onMouseDown={handleNodeMouseDown}
                onDoubleClick={handleNodeDoubleClick}
                onPortMouseDown={handlePortMouseDown}
                onPortMouseUp={handlePortMouseUp}
                onPortMouseEnter={handlePortMouseEnter}
                onPortMouseLeave={handlePortMouseLeave}
                onInject={onInject}
                onFileDrop={onFileDrop}
              />
            ))}
          </g>

          {/* Selection box */}
          {selecting && selectionStart && selectionEnd && (
            <rect
              className="selection-box"
              x={Math.min(selectionStart.x, selectionEnd.x)}
              y={Math.min(selectionStart.y, selectionEnd.y)}
              width={Math.abs(selectionEnd.x - selectionStart.x)}
              height={Math.abs(selectionEnd.y - selectionStart.y)}
            />
          )}
        </g>
      </svg>
    </div>
  );
}
