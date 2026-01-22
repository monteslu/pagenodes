import { useCallback } from 'react';

/**
 * Audio stream port - RCA jack style with green color
 * Visual: Circle with center dot (◉)
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

  // Offset to center the port visually
  const offsetX = isOutput ? x - 6 : x - 6;

  return (
    <g transform={`translate(${offsetX}, ${y - 6})`}>
      {/* Larger invisible touch target */}
      <rect
        x={-4}
        y={-4}
        width={20}
        height={20}
        fill="transparent"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {/* Outer ring - green tint background */}
      <circle
        className="audio-port-outer"
        cx={6}
        cy={6}
        r={5}
        fill="#e6f5e6"
        stroke="#2d9a2d"
        strokeWidth={1.5}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: 'crosshair' }}
      />
      {/* Center dot - solid green */}
      <circle
        className="audio-port-inner"
        cx={6}
        cy={6}
        r={2}
        fill="#2d9a2d"
        pointerEvents="none"
      />
    </g>
  );
}
