import { useCallback } from 'react';

export function Port({ x, y, isOutput, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave }) {
  // Irregular hexagon arrow shape, 14 wide x 14 tall
  // Input: arrow pointing right (into node)
  const inputPoints = "0,3.5 6,0 14,3.5 14,10.5 6,14 0,10.5";
  // Output: arrow pointing left (into node) - horizontally mirrored
  const outputPoints = "0,3.5 8,0 14,3.5 14,10.5 8,14 0,10.5";

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

  // Unique gradient ID
  const gradientId = `port-grad-${isOutput ? 'out' : 'in'}`;

  return (
    <g transform={`translate(${isOutput ? x - 2 : x - 12}, ${y - 7})`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#909090" />
          <stop offset="35%" stopColor="#d8d8d8" />
          <stop offset="50%" stopColor="#f0f0f0" />
          <stop offset="65%" stopColor="#d8d8d8" />
          <stop offset="100%" stopColor="#808080" />
        </linearGradient>
      </defs>
      {/* Larger invisible touch target */}
      <rect
        x={isOutput ? -10 : -7}
        y={-10}
        width={28}
        height={28}
        fill="transparent"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {/* Port shadow */}
      <polygon
        points={isOutput ? outputPoints : inputPoints}
        fill="rgba(0,0,0,0.3)"
        transform="translate(0.5, 1)"
        pointerEvents="none"
      />
      {/* Port body with gradient */}
      <polygon
        className={`port ${isOutput ? 'port-output' : 'port-input'}`}
        points={isOutput ? outputPoints : inputPoints}
        fill={`url(#${gradientId})`}
        stroke="#666"
        strokeWidth={0.5}
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
