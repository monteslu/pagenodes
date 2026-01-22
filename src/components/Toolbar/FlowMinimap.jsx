import { useMemo, useCallback } from 'react';
import { nodeRegistry } from '../../nodes';
import { calcNodeHeight, calcNodeHeightWithAudio, calcNodeWidth } from '../../utils/geometry';

// Helper to get node label
function getNodeLabel(node, def) {
  if (node._node.name) return node._node.name;
  if (def?.label) {
    return typeof def.label === 'function' ? def.label(node) : def.label;
  }
  return node._node.type;
}

// Helper to calculate node height including audio ports
function getNodeHeight(node, def) {
  const outputs = def?.getOutputs ? def.getOutputs(node) : (def?.outputs || 0);
  const inputs = def?.inputs || 0;
  const streamOutputs = def?.getStreamOutputs ? def.getStreamOutputs(node) : (def?.streamOutputs || 0);
  const streamInputs = def?.getStreamInputs ? def.getStreamInputs(node) : (def?.streamInputs || 0);
  const hasAudioPorts = streamInputs > 0 || streamOutputs > 0;
  return hasAudioPorts
    ? calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs)
    : calcNodeHeight(outputs);
}

const MIN_VIEW_SIZE = 500; // Minimum viewBox size
const PADDING = 50; // Padding around nodes

export function FlowMinimap({ flowId, nodes, size = 50, onClick }) {
  // Filter nodes for this flow
  const flowNodes = useMemo(() => {
    return Object.values(nodes).filter(n => n._node.z === flowId);
  }, [nodes, flowId]);

  // Calculate bounds from nodes
  const bounds = useMemo(() => {
    if (flowNodes.length === 0) {
      return { x: 0, y: 0, size: MIN_VIEW_SIZE };
    }

    let maxX = 0;
    let maxY = 0;

    for (const node of flowNodes) {
      const def = nodeRegistry.get(node._node.type);
      const nodeHeight = getNodeHeight(node, def);
      const label = getNodeLabel(node, def);
      const hasIcon = def?.icon && def?.faChar;
      const nodeWidth = calcNodeWidth(label, hasIcon);
      maxX = Math.max(maxX, node._node.x + nodeWidth);
      maxY = Math.max(maxY, node._node.y + nodeHeight);
    }

    // Make it square using the larger dimension, add padding
    const viewSize = Math.max(maxX + PADDING, maxY + PADDING, MIN_VIEW_SIZE);

    return { x: 0, y: 0, size: viewSize };
  }, [flowNodes]);

  // Calculate scale for click handling
  const scale = size / bounds.size;

  // Handle click - convert minimap coords to canvas coords
  const handleClick = useCallback((e) => {
    if (!onClick) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    onClick(x, y);
  }, [onClick, scale]);

  return (
    <svg
      className="flow-minimap"
      width={size}
      height={size}
      viewBox={`0 0 ${bounds.size} ${bounds.size}`}
      preserveAspectRatio="xMinYMin meet"
      onClick={handleClick}
    >
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={bounds.size}
        height={bounds.size}
        fill="var(--bg-color)"
      />

      {/* Nodes as simple colored rectangles */}
      {flowNodes.map(node => {
        const def = nodeRegistry.get(node._node.type);
        const color = def?.color || '#ddd';
        const nodeHeight = getNodeHeight(node, def);
        const label = getNodeLabel(node, def);
        const hasIcon = def?.icon && def?.faChar;
        const nodeWidth = calcNodeWidth(label, hasIcon);

        return (
          <rect
            key={node._node.id}
            x={node._node.x}
            y={node._node.y}
            width={nodeWidth}
            height={nodeHeight}
            fill={color}
            rx={5}
            ry={5}
          />
        );
      })}
    </svg>
  );
}
