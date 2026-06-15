import { useMemo } from 'react';
import { getNodeBox, getFlowBounds } from '../Canvas/Minimap';

const W = 26;
const H = 18;
const PAD = 2.5;

/**
 * Tiny flow map drawn inside a flow tab's thumbnail. The whole flow is scaled to
 * fit the fixed 26x18 thumbnail and centered, so the thumbnail never grows.
 */
export function FlowThumb({ nodes, flowId }) {
  const flowNodes = useMemo(
    () => Object.values(nodes).filter((n) => n.z === flowId),
    [nodes, flowId]
  );

  const layout = useMemo(() => {
    const bounds = getFlowBounds(flowNodes);
    if (!bounds) return null;
    const contentW = Math.max(1, bounds.maxX - bounds.minX);
    const contentH = Math.max(1, bounds.maxY - bounds.minY);
    const scale = Math.min((W - PAD * 2) / contentW, (H - PAD * 2) / contentH);
    const offX = PAD + ((W - PAD * 2) - contentW * scale) / 2;
    const offY = PAD + ((H - PAD * 2) - contentH * scale) / 2;
    return { bounds, scale, offX, offY };
  }, [flowNodes]);

  return (
    <svg className="flow-tab-thumb" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <rect x={0} y={0} width={W} height={H} rx={2} fill="#11141A" />
      {layout && flowNodes.map((node) => {
        const { width, height, color } = getNodeBox(node);
        return (
          <rect
            key={node.id}
            x={layout.offX + (node.x - layout.bounds.minX) * layout.scale}
            y={layout.offY + (node.y - layout.bounds.minY) * layout.scale}
            width={Math.max(1, width * layout.scale)}
            height={Math.max(1, height * layout.scale)}
            fill={color}
          />
        );
      })}
    </svg>
  );
}
