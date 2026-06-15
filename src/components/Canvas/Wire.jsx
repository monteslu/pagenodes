import { useMemo } from 'react';
import { getPortPosition, getStreamPortPosition, getWireControlPoints, calcNodeHeight, calcNodeHeightWithAudio, calcNodeWidth } from '../../utils/geometry';
import { nodeRegistry } from '../../nodes';
import { nodeSignalColor } from '../../utils/signalKind';

// Helper to get node label for width calculation
function getNodeLabel(node, def) {
  if (node.name) return node.name;
  if (def?.label) {
    return typeof def.label === 'function' ? def.label(node) : def.label;
  }
  return node.type;
}

function getNodeHeightWithDef(node, def) {
  const outputs = def?.getOutputs ? def.getOutputs(node) : (def?.outputs || 0);
  const inputs = def?.inputs || 0;
  const streamOutputs = def?.getStreamOutputs ? def.getStreamOutputs(node) : (def?.streamOutputs || 0);
  const streamInputs = def?.getStreamInputs ? def.getStreamInputs(node) : (def?.streamInputs || 0);

  let portBasedHeight;
  if (streamOutputs > 0 || streamInputs > 0) {
    portBasedHeight = calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs);
  } else {
    portBasedHeight = calcNodeHeight(outputs);
  }

  if (def?.getNodeHeight) {
    return def.getNodeHeight(node, portBasedHeight);
  }
  return portBasedHeight;
}

function getNodeWidthWithDef(node, def) {
  if (def?.getNodeWidth) {
    return def.getNodeWidth(node);
  }
  const label = getNodeLabel(node, def);
  const hasIcon = def?.icon && def?.faChar;
  return calcNodeWidth(label, hasIcon);
}

export function Wire({ sourceNode, sourcePort, targetNode, targetPort = 0, targetPos, selected, onMouseDown, onMouseUp, isTemp, isConnecting, isPending, isStream = false }) {
  const sourceDef = nodeRegistry.get(sourceNode.type);

  const pathData = useMemo(() => {
    const sourceWidth = getNodeWidthWithDef(sourceNode, sourceDef);
    const sourceHeight = getNodeHeightWithDef(sourceNode, sourceDef);

    const sourcePos = isStream
      ? getStreamPortPosition(sourceNode, sourcePort, true, sourceDef, sourceHeight, sourceWidth)
      : getPortPosition(sourceNode, sourcePort, true, sourceHeight, sourceWidth, sourceDef);

    let endPos;
    if (targetNode) {
      const targetDef = nodeRegistry.get(targetNode.type);
      const targetWidth = getNodeWidthWithDef(targetNode, targetDef);
      const targetHeight = getNodeHeightWithDef(targetNode, targetDef);
      endPos = isStream
        ? getStreamPortPosition(targetNode, targetPort, false, targetDef, targetHeight, targetWidth)
        : getPortPosition(targetNode, targetPort, false, targetHeight, targetWidth, targetDef);
    } else if (targetPos) {
      endPos = targetPos;
    } else {
      return null;
    }

    const cp = getWireControlPoints(sourcePos, endPos);
    return `M ${cp.x1} ${cp.y1} C ${cp.x2} ${cp.y2} ${cp.x3} ${cp.y3} ${cp.x4} ${cp.y4}`;
  }, [sourceNode, sourceDef, sourcePort, targetNode, targetPort, targetPos, isStream]);

  if (!pathData) return null;

  const signal = isStream ? 'var(--sig-audio)' : nodeSignalColor(sourceDef);
  let color = signal;
  let animate = true;
  let dash = '6 7';
  let opacity = 1;

  if (selected) {
    color = 'var(--volt)';
  }
  if (isTemp) {
    color = isConnecting ? signal : 'var(--smoke)';
    animate = false;
    dash = '5 5';
  } else if (isPending) {
    opacity = 0.85;
  }

  return (
    <g className="wire-group" style={{ opacity }} onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
      {/* Wide invisible hit path for selection */}
      <path className="pn-wire-hit" d={pathData} />
      {/* Soft glow */}
      {!isTemp && <path className="pn-wire-glow" d={pathData} stroke={color} />}
      {/* Main cable */}
      <path
        className={`pn-wire ${animate ? 'pn-wire-flow' : ''} ${selected ? 'is-selected' : ''}`}
        d={pathData}
        stroke={color}
        strokeDasharray={dash}
      />
    </g>
  );
}
