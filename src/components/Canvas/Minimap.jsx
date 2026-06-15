import { useMemo, useCallback } from 'react';
import { nodeRegistry } from '../../nodes';
import { calcNodeWidth, calcNodeHeight, calcNodeHeightWithAudio } from '../../utils/geometry';
import { nodeSignalColor } from '../../utils/signalKind';

const MM_W = 170;
const MM_H = 120;
const PAD = 40;

// Width and height of a node as actually rendered, mirroring Wire/Node logic.
export function getNodeBox(node) {
  const def = nodeRegistry.get(node.type);
  const label = node.name || (typeof def?.label === 'function' ? def.label(node) : def?.label) || node.type;
  const hasIcon = def?.icon && def?.faChar;
  const width = def?.getNodeWidth ? def.getNodeWidth(node) : calcNodeWidth(label, hasIcon);

  const outputs = def?.getOutputs ? def.getOutputs(node) : (def?.outputs || 0);
  const inputs = def?.inputs || 0;
  const streamOutputs = def?.getStreamOutputs ? def.getStreamOutputs(node) : (def?.streamOutputs || 0);
  const streamInputs = def?.getStreamInputs ? def.getStreamInputs(node) : (def?.streamInputs || 0);
  const base = (streamOutputs > 0 || streamInputs > 0)
    ? calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs)
    : calcNodeHeight(outputs);
  const height = def?.getNodeHeight ? def.getNodeHeight(node, base) : base;

  return { width, height, color: nodeSignalColor(def) };
}

// Bounds of a node set in canvas coordinates.
export function getFlowBounds(activeNodes) {
  if (!activeNodes || activeNodes.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of activeNodes) {
    const { width, height } = getNodeBox(node);
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + width);
    maxY = Math.max(maxY, node.y + height);
  }
  return { minX, minY, maxX, maxY };
}

export function Minimap({ activeNodes, viewport, zoom, onRecenter }) {
  const layout = useMemo(() => {
    const bounds = getFlowBounds(activeNodes);
    if (!bounds) return null;
    const contentW = (bounds.maxX - bounds.minX) + PAD * 2;
    const contentH = (bounds.maxY - bounds.minY) + PAD * 2;
    const scale = Math.min(MM_W / contentW, MM_H / contentH);
    const offsetX = bounds.minX - PAD;
    const offsetY = bounds.minY - PAD;
    return { scale, offsetX, offsetY };
  }, [activeNodes]);

  const handleClick = useCallback((e) => {
    if (!layout || !onRecenter) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / layout.scale + layout.offsetX;
    const cy = (e.clientY - rect.top) / layout.scale + layout.offsetY;
    onRecenter(cx, cy);
  }, [layout, onRecenter]);

  if (!layout || !activeNodes || activeNodes.length === 0) return null;

  const { scale, offsetX, offsetY } = layout;

  // Visible canvas region (in canvas coords) -> minimap coords
  let viewRect = null;
  if (viewport && zoom) {
    const vx = (viewport.sl / zoom - offsetX) * scale;
    const vy = (viewport.st / zoom - offsetY) * scale;
    const vw = (viewport.cw / zoom) * scale;
    const vh = (viewport.ch / zoom) * scale;
    viewRect = { vx, vy, vw, vh };
  }

  return (
    <svg
      className="canvas-minimap"
      width={MM_W}
      height={MM_H}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <rect x={0} y={0} width={MM_W} height={MM_H} fill="var(--board)" />
      {activeNodes.map((node) => {
        const { width, height, color } = getNodeBox(node);
        return (
          <rect
            key={node.id}
            x={(node.x - offsetX) * scale}
            y={(node.y - offsetY) * scale}
            width={Math.max(2, width * scale)}
            height={Math.max(2, height * scale)}
            rx={1}
            fill={color}
          />
        );
      })}
      {viewRect && (
        <rect
          x={viewRect.vx}
          y={viewRect.vy}
          width={viewRect.vw}
          height={viewRect.vh}
          fill="none"
          stroke="var(--volt)"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}
