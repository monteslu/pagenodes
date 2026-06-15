import { useRef, useCallback } from 'react';
import { getSignalKind } from '../../utils/signalKind';

/**
 * Palette chip. Rendered as a full-width HTML chip (not the SVG node shape) so
 * the complete node label always fits, matching the design mockup. The grip and
 * icon take the node's signal color; the actual canvas node keeps its own
 * label-sized width when dropped.
 */
export function PaletteNode({ nodeDef, onTouchDrag }) {
  const touchRef = useRef(null);
  const ghostRef = useRef(null);

  const kind = getSignalKind(nodeDef);
  const label = nodeDef.paletteLabel || nodeDef.type;
  const iconClass = nodeDef.faBrand ? 'node-icon-brand' : 'node-icon';
  const tooltip = nodeDef.description || nodeDef.type;

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchRef.current = {
      nodeType: nodeDef.type,
      startX: touch.clientX,
      startY: touch.clientY
    };

    const ghost = document.createElement('div');
    ghost.className = 'palette-node-ghost';
    ghost.style.cssText = `
      position: fixed;
      left: ${touch.clientX - 60}px;
      top: ${touch.clientY - 16}px;
      width: 150px;
      height: 34px;
      background: var(--card);
      border: 2px solid var(--edge);
      border-radius: var(--r-node);
      opacity: 0.9;
      pointer-events: none;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ink);
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 600;
      box-shadow: var(--sh-sm);
    `;
    ghost.textContent = label;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  }, [nodeDef, label]);

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current || !ghostRef.current) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    ghostRef.current.style.left = `${touch.clientX - 60}px`;
    ghostRef.current.style.top = `${touch.clientY - 16}px`;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current) return;
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    const canvas = document.querySelector('.canvas-svg');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        if (onTouchDrag) {
          onTouchDrag(touchRef.current.nodeType, x, y);
        }
      }
    }
    touchRef.current = null;
  }, [onTouchDrag]);

  const handleDragStart = useCallback((e) => {
    // Grab near the top-left so the dropped node lands close to the cursor.
    e.dataTransfer.setData('nodeType', nodeDef.type);
    e.dataTransfer.setData('offsetX', '20');
    e.dataTransfer.setData('offsetY', '16');
    e.dataTransfer.effectAllowed = 'copy';
  }, [nodeDef.type]);

  return (
    <div
      className={`palette-node chip k-${kind}`}
      draggable
      onDragStart={handleDragStart}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      title={tooltip}
    >
      <span className="chip-grip" />
      {nodeDef.icon && nodeDef.faChar && (
        <span className={`chip-icon ${iconClass}`}>{nodeDef.faChar}</span>
      )}
      <span className="chip-label">{label}</span>
    </div>
  );
}
