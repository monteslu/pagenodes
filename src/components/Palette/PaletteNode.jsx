import { useRef, useCallback } from 'react';
import { NodeShape, NODE_WIDTH, calcNodeHeight, calcNodeHeightWithAudio } from '../Canvas/NodeShape';

const PALETTE_NODE_WIDTH = 120;

export function PaletteNode({ nodeDef, onTouchDrag }) {
  const touchRef = useRef(null);
  const ghostRef = useRef(null);

  const outputs = nodeDef.outputs || 0;
  const inputs = nodeDef.inputs || 0;
  const streamOutputs = nodeDef.streamOutputs || 0;
  const streamInputs = nodeDef.streamInputs || 0;
  const hasAudioPorts = streamInputs > 0 || streamOutputs > 0;

  const height = hasAudioPorts
    ? calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs)
    : calcNodeHeight(outputs);

  // Add padding for ports (extra space for larger ports extending beyond node body)
  const svgWidth = PALETTE_NODE_WIDTH + 30;
  const svgHeight = height + 4;

  // Build tooltip text
  const tooltip = nodeDef.description || nodeDef.type;

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchRef.current = {
      nodeType: nodeDef.type,
      startX: touch.clientX,
      startY: touch.clientY
    };

    // Create ghost element
    const ghost = document.createElement('div');
    ghost.className = 'palette-node-ghost';
    ghost.style.cssText = `
      position: fixed;
      left: ${touch.clientX - 60}px;
      top: ${touch.clientY - 15}px;
      width: ${svgWidth}px;
      height: ${svgHeight}px;
      background: ${nodeDef.color || '#999'};
      border-radius: 5px;
      opacity: 0.8;
      pointer-events: none;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      font-size: 11px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    ghost.textContent = nodeDef.paletteLabel || nodeDef.type;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  }, [nodeDef, svgWidth, svgHeight]);

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current || !ghostRef.current) return;
    if (e.touches.length !== 1) return;

    e.preventDefault(); // Prevent scrolling while dragging

    const touch = e.touches[0];
    ghostRef.current.style.left = `${touch.clientX - 60}px`;
    ghostRef.current.style.top = `${touch.clientY - 15}px`;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current) return;

    // Remove ghost
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }

    // Get the end position
    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    // Find the canvas element
    const canvas = document.querySelector('.canvas-svg');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        // Dropped on canvas - notify via callback
        if (onTouchDrag) {
          onTouchDrag(touchRef.current.nodeType, x, y);
        }
      }
    }

    touchRef.current = null;
  }, [onTouchDrag]);

  const handleDragStart = useCallback((e) => {
    // Store the offset within the node shape where drag started
    // Account for SVG viewBox offset (-15, -2) - the node shape starts 15px from left, 2px from top
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - 15;
    const offsetY = e.clientY - rect.top - 2;

    e.dataTransfer.setData('nodeType', nodeDef.type);
    e.dataTransfer.setData('offsetX', String(offsetX));
    e.dataTransfer.setData('offsetY', String(offsetY));
    e.dataTransfer.effectAllowed = 'copy';
  }, [nodeDef.type]);

  return (
    <div
      className="palette-node"
      draggable
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      title={tooltip}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`-15 -2 ${svgWidth} ${svgHeight}`}
      >
        <NodeShape
          def={nodeDef}
          type={nodeDef.type}
          width={PALETTE_NODE_WIDTH}
          selected={false}
          showButton={false}
        />
      </svg>
    </div>
  );
}
