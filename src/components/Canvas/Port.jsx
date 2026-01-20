import { useCallback } from 'react';

export function Port({ x, y, isOutput, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave }) {
  // Arrow-like polygon points for ports (slightly smaller)
  const inputPoints = "0,0 4,-2.5 10,0 10,5 4,7.5 0,5";
  const outputPoints = "0,-2.5 6,0 6,5 0,7.5 -4,5 -4,0";

  // Touch handlers that simulate mouse events
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
    <g transform={`translate(${isOutput ? x - 1 : x - 5}, ${y - 2.5})`}>
      {/* Larger invisible touch target */}
      <rect
        x={isOutput ? -8 : -5}
        y={-8}
        width={22}
        height={22}
        fill="transparent"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      <polygon
        className={`port ${isOutput ? 'port-output' : 'port-input'}`}
        points={isOutput ? outputPoints : inputPoints}
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
