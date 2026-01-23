import { useCallback } from 'react';

/**
 * Audio stream port - RCA jack style with green color
 * Visual: Circle with center dot (◉) with metallic 3D effect
 */
export function AudioPort({ x, y, isOutput, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave }) {
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

  // Offset to center the port visually - symmetric distance from node body
  // Output: start at node edge (x), extend outward. Input: start at x-12, extend into node
  const offsetX = isOutput ? x : x - 12;
  const gradientId = `audio-port-grad-${isOutput ? 'out' : 'in'}-${x}-${y}`;

  return (
    <g transform={`translate(${offsetX}, ${y - 8})`}>
      <defs>
        {/* Metallic green gradient for outer ring */}
        <radialGradient id={gradientId} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7dda7d" />
          <stop offset="50%" stopColor="#3daa3d" />
          <stop offset="100%" stopColor="#1d7a1d" />
        </radialGradient>
      </defs>
      {/* Larger invisible touch target */}
      <rect
        x={-6}
        y={-6}
        width={28}
        height={28}
        fill="transparent"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {/* Port shadow */}
      <circle
        cx={8.5}
        cy={9}
        r={7}
        fill="rgba(0,0,0,0.25)"
        pointerEvents="none"
      />
      {/* Outer ring with metallic gradient */}
      <circle
        className="audio-port-outer"
        cx={8}
        cy={8}
        r={7}
        fill={`url(#${gradientId})`}
        stroke="#1a6a1a"
        strokeWidth={1}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: 'crosshair' }}
      />
      {/* Inner ring / hole */}
      <circle
        cx={8}
        cy={8}
        r={4}
        fill="#0a3a0a"
        pointerEvents="none"
      />
      {/* Center pin - metallic */}
      <circle
        className="audio-port-inner"
        cx={8}
        cy={8}
        r={2}
        fill="#c0c0c0"
        pointerEvents="none"
      />
      {/* Highlight */}
      <circle
        cx={5.5}
        cy={5.5}
        r={2}
        fill="rgba(255,255,255,0.4)"
        pointerEvents="none"
      />
    </g>
  );
}
