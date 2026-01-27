import { useMemo } from 'react';
import { getPortPosition, getStreamPortPosition, getWireControlPoints, calcNodeHeight, calcNodeHeightWithAudio, calcNodeWidth } from '../../utils/geometry';
import { nodeRegistry } from '../../nodes';

// Helper to get node label for width calculation
function getNodeLabel(node, def) {
  if (node.name) return node.name;
  if (def?.label) {
    return typeof def.label === 'function' ? def.label(node) : def.label;
  }
  return node.type;
}

// Calculate node height considering audio ports and custom getNodeHeight
function getNodeHeightWithDef(node, def) {
  const outputs = def?.getOutputs ? def.getOutputs(node) : (def?.outputs || 0);
  const inputs = def?.inputs || 0;
  const streamOutputs = def?.getStreamOutputs ? def.getStreamOutputs(node) : (def?.streamOutputs || 0);
  const streamInputs = def?.getStreamInputs ? def.getStreamInputs(node) : (def?.streamInputs || 0);

  // Calculate port-based height
  let portBasedHeight;
  if (streamOutputs > 0 || streamInputs > 0) {
    portBasedHeight = calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs);
  } else {
    portBasedHeight = calcNodeHeight(outputs);
  }

  // Use custom height if node definition provides one (e.g., slider, button nodes)
  if (def?.getNodeHeight) {
    return def.getNodeHeight(node, portBasedHeight);
  }
  return portBasedHeight;
}

// Calculate node width considering custom getNodeWidth
function getNodeWidthWithDef(node, def) {
  if (def?.getNodeWidth) {
    return def.getNodeWidth(node);
  }
  const label = getNodeLabel(node, def);
  const hasIcon = def?.icon && def?.faChar;
  return calcNodeWidth(label, hasIcon);
}

export function Wire({ sourceNode, sourcePort, targetNode, targetPort = 0, targetPos, selected, onMouseDown, onMouseUp, isTemp, isConnecting, isPending, isStream = false }) {
  const pathData = useMemo(() => {
    const sourceDef = nodeRegistry.get(sourceNode.type);
    const sourceWidth = getNodeWidthWithDef(sourceNode, sourceDef);
    const sourceHeight = getNodeHeightWithDef(sourceNode, sourceDef);

    // Get source port position based on wire type
    const sourcePos = isStream
      ? getStreamPortPosition(sourceNode, sourcePort, true, sourceDef, sourceHeight, sourceWidth)
      : getPortPosition(sourceNode, sourcePort, true, sourceHeight, sourceWidth, sourceDef);

    let endPos;
    if (targetNode && !targetPos) {
      // Connected to a target node (saved wire)
      const targetDef = nodeRegistry.get(targetNode.type);
      const targetWidth = getNodeWidthWithDef(targetNode, targetDef);
      const targetHeight = getNodeHeightWithDef(targetNode, targetDef);
      endPos = isStream
        ? getStreamPortPosition(targetNode, targetPort, false, targetDef, targetHeight, targetWidth)
        : getPortPosition(targetNode, targetPort, false, targetHeight, targetWidth, targetDef);
    } else if (targetNode && targetPos) {
      // Temp wire hovering over a valid input - snap to port
      const targetDef = nodeRegistry.get(targetNode.type);
      const targetWidth = getNodeWidthWithDef(targetNode, targetDef);
      const targetHeight = getNodeHeightWithDef(targetNode, targetDef);
      endPos = isStream
        ? getStreamPortPosition(targetNode, targetPort, false, targetDef, targetHeight, targetWidth)
        : getPortPosition(targetNode, targetPort, false, targetHeight, targetWidth, targetDef);
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
