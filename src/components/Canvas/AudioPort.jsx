import { useCallback } from 'react';

/**
 * Audio stream port - RCA jack style with green color
 * Visual: Circle with center dot (◉) with metallic 3D effect
 *
 * Nodes can provide custom port rendering via renderStreamPort function.
 * If customRender is provided, it receives { index, isOutput, x, y } and should return SVG elements.
 * The custom render is placed inside the port group, so coordinates are relative to port position.
 */
export function AudioPort({ x, y, isOutput, index, customRender, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave }) {
  const hasCustomRender = !!customRender;
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

  // Offset to center the port visually - overlap node body slightly for visual cohesion
  // Port is 16px wide, center at 8px. We want ~4px overlap with node edge on both sides.
  // Output (right side): x is node right edge, port center should be at x + 4
  // Input (left side): x is 0 (node left edge), port center should be at x - 4
  const offsetX = isOutput ? x - 4 : x - 12;
  const gradientId = `audio-port-grad-${isOutput ? 'out' : 'in'}-${x}-${y}-${hasCustomRender ? 'custom' : 'std'}`;

  return (
    <g transform={`translate(${offsetX}, ${y - 8})`}>
      <defs>
        {/* Metallic green gradient for outer ring - lighter when custom render for better contrast */}
        <radialGradient id={gradientId} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={hasCustomRender ? "#e8f8e8" : "#7dda7d"} />
          <stop offset="50%" stopColor={hasCustomRender ? "#b8e8b8" : "#3daa3d"} />
          <stop offset="100%" stopColor={hasCustomRender ? "#78c878" : "#1d7a1d"} />
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
        stroke={hasCustomRender ? "#4a9a4a" : "#1a6a1a"}
        strokeWidth={1}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: 'crosshair' }}
      />
      {/* Inner ring / hole - skip if custom render provides its own content */}
      {!hasCustomRender && (
        <circle
          cx={8}
          cy={8}
          r={4}
          fill="#0a3a0a"
          pointerEvents="none"
        />
      )}
      {/* Center pin - metallic - skip if custom render */}
      {!hasCustomRender && (
        <circle
          className="audio-port-inner"
          cx={8}
          cy={8}
          r={2}
          fill="#c0c0c0"
          pointerEvents="none"
        />
      )}
      {/* Highlight */}
      <circle
        cx={5.5}
        cy={5.5}
        r={2}
        fill="rgba(255,255,255,0.4)"
        pointerEvents="none"
      />
      {/* Custom rendering from node definition (icons, labels, etc.) */}
      {customRender && customRender({ index, isOutput, x: 8, y: 8 })}
    </g>
  );
}
