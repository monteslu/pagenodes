import { useCallback } from 'react';

/**
 * Audio stream port: a flat teal (signal-audio) circle with an edge border,
 * centered on the node edge. Nodes can still provide custom port rendering via
 * renderStreamPort; the local frame keeps the port center at (8, 8) so existing
 * custom renders position correctly.
 */
export function AudioPort({ x, y, isOutput, index, customRender, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave }) {
  const hasCustomRender = !!customRender;

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
    <g transform={`translate(${x - 8}, ${y - 8})`}>
      {/* Larger invisible hit target */}
      <rect
        x={-3}
        y={-3}
        width={22}
        height={22}
        fill="transparent"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {/* Port body */}
      <circle
        className="audio-port"
        cx={8}
        cy={8}
        r={7}
        fill="var(--sig-audio)"
        stroke="var(--edge)"
        strokeWidth={2}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: 'crosshair' }}
      />
      {/* Inner hole for the standard jack look */}
      {!hasCustomRender && (
        <circle cx={8} cy={8} r={2.5} fill="var(--board)" stroke="var(--edge)" strokeWidth={1} pointerEvents="none" />
      )}
      {/* Custom rendering from node definition (icons, labels, etc.) */}
      {customRender && customRender({ index, isOutput, x: 8, y: 8 })}
    </g>
  );
}
