import { useCallback } from 'react';

const PORT_R = 5.5;

/**
 * Message port: a small circle centered on the node edge, card fill with a
 * 2px edge border, matching the PATCHBAY node anatomy.
 */
export function Port({ x, y, isOutput, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave }) {
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, stopPropagation: () => {} };
    onMouseDown?.(fakeEvent);
  }, [onMouseDown]);

  const handleTouchEnd = useCallback((e) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, stopPropagation: () => {} };
    onMouseUp?.(fakeEvent);
  }, [onMouseUp]);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Larger invisible hit target */}
      <circle
        r={11}
        fill="transparent"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      <circle
        className={`port ${isOutput ? 'port-output' : 'port-input'}`}
        r={PORT_R}
        fill="var(--card)"
        stroke="var(--edge)"
        strokeWidth={2}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
    </g>
  );
}
