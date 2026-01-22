import { useMemo } from 'react';
import { getPortPosition, getStreamPortPosition, getWireControlPoints, calcNodeHeight, calcNodeHeightWithAudio, calcNodeWidth } from '../../utils/geometry';
import { nodeRegistry } from '../../nodes';

// Helper to get node label for width calculation
function getNodeLabel(node, def) {
  if (node._node.name) return node._node.name;
  if (def?.label) {
    return typeof def.label === 'function' ? def.label(node) : def.label;
  }
  return node._node.type;
}

// Calculate node height considering audio ports
function getNodeHeightWithDef(node, def) {
  const outputs = def?.getOutputs ? def.getOutputs(node) : (def?.outputs || 0);
  const inputs = def?.inputs || 0;
  const streamOutputs = def?.getStreamOutputs ? def.getStreamOutputs(node) : (def?.streamOutputs || 0);
  const streamInputs = def?.getStreamInputs ? def.getStreamInputs(node) : (def?.streamInputs || 0);

  if (streamOutputs > 0 || streamInputs > 0) {
    return calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs);
  }
  return calcNodeHeight(outputs);
}

export function Wire({ sourceNode, sourcePort, targetNode, targetPort = 0, targetPos, selected, onMouseDown, onMouseUp, isTemp, isConnecting, isPending, isStream = false }) {
  const pathData = useMemo(() => {
    const sourceDef = nodeRegistry.get(sourceNode._node.type);
    const sourceLabel = getNodeLabel(sourceNode, sourceDef);
    const sourceHasIcon = sourceDef?.icon && sourceDef?.faChar;
    const sourceWidth = calcNodeWidth(sourceLabel, sourceHasIcon);
    const sourceHeight = getNodeHeightWithDef(sourceNode, sourceDef);

    // Get source port position based on wire type
    const sourcePos = isStream
      ? getStreamPortPosition(sourceNode, sourcePort, true, sourceDef, sourceHeight, sourceWidth)
      : getPortPosition(sourceNode, sourcePort, true, sourceHeight, sourceWidth);

    let endPos;
    if (targetNode && !targetPos) {
      // Connected to a target node (saved wire)
      const targetDef = nodeRegistry.get(targetNode._node.type);
      const targetHeight = getNodeHeightWithDef(targetNode, targetDef);
      endPos = isStream
        ? getStreamPortPosition(targetNode, targetPort, false, targetDef, targetHeight)
        : getPortPosition(targetNode, targetPort, false, targetHeight, undefined, targetDef);
    } else if (targetNode && targetPos) {
      // Temp wire hovering over a valid input - snap to port
      const targetDef = nodeRegistry.get(targetNode._node.type);
      const targetHeight = getNodeHeightWithDef(targetNode, targetDef);
      endPos = isStream
        ? getStreamPortPosition(targetNode, targetPort, false, targetDef, targetHeight)
        : getPortPosition(targetNode, targetPort, false, targetHeight, undefined, targetDef);
    } else if (targetPos) {
      // Temp wire following mouse
      endPos = targetPos;
    } else {
      return null;
    }

    const cp = getWireControlPoints(sourcePos, endPos);
    return `M ${cp.x1} ${cp.y1} C ${cp.x2} ${cp.y2} ${cp.x3} ${cp.y3} ${cp.x4} ${cp.y4}`;
  }, [sourceNode, sourcePort, targetNode, targetPort, targetPos, isStream]);

  if (!pathData) return null;

  // Determine wire class based on state and type
  const streamSuffix = isStream ? '-stream' : '';
  let wireClass = `wire-group${streamSuffix}`;
  let innerClass = `wire-inner${streamSuffix}`;
  let outerClass = `wire-outer${streamSuffix}`;
  let dashArray = undefined;

  if (selected) {
    innerClass = `wire-inner-selected${streamSuffix}`;
  } else if (isTemp) {
    wireClass = isConnecting ? `wire-group${streamSuffix} wire-temp wire-connecting` : `wire-group${streamSuffix} wire-temp`;
    innerClass = isConnecting ? `wire-inner${streamSuffix} wire-inner-connecting${streamSuffix}` : `wire-inner${streamSuffix} wire-inner-temp${streamSuffix}`;
    outerClass = `wire-outer${streamSuffix} wire-outer-temp`;
    dashArray = '4 3';
  } else if (isPending) {
    // Connected but not deployed - colored but dotted
    wireClass = `wire-group${streamSuffix} wire-pending`;
    innerClass = `wire-inner${streamSuffix} wire-inner-pending${streamSuffix}`;
    outerClass = `wire-outer${streamSuffix} wire-outer-pending`;
    dashArray = '5 3';
  }

  return (
    <g className={wireClass} onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
      {/* Outer stroke (dark border) */}
      <path
        className={outerClass}
        d={pathData}
        strokeDasharray={dashArray}
      />
      {/* Inner stroke (gradient) */}
      <path
        className={innerClass}
        d={pathData}
        strokeDasharray={dashArray}
      />
    </g>
  );
}
