import { useMemo } from 'react';
import { getPortPosition, getWireControlPoints, calcNodeHeight } from '../../utils/geometry';
import { nodeRegistry } from '../../nodes';

export function Wire({ sourceNode, sourcePort, targetNode, targetPos, selected, onMouseDown, onMouseUp, isTemp, isConnecting, isPending }) {
  const pathData = useMemo(() => {
    // Get source node output count for proper positioning
    const sourceDef = nodeRegistry.get(sourceNode._node.type);
    const sourceOutputs = sourceDef?.outputs || 1;
    const sourceHeight = calcNodeHeight(sourceOutputs);
    const sourcePos = getPortPosition(sourceNode, sourcePort, true, sourceHeight);

    let endPos;
    if (targetNode && !targetPos) {
      // Connected to a target node (saved wire)
      const targetDef = nodeRegistry.get(targetNode._node.type);
      const targetOutputs = targetDef?.outputs || 1;
      const targetHeight = calcNodeHeight(targetOutputs);
      endPos = getPortPosition(targetNode, 0, false, targetHeight);
    } else if (targetNode && targetPos) {
      // Temp wire hovering over a valid input - snap to port
      const targetDef = nodeRegistry.get(targetNode._node.type);
      const targetOutputs = targetDef?.outputs || 1;
      const targetHeight = calcNodeHeight(targetOutputs);
      endPos = getPortPosition(targetNode, 0, false, targetHeight);
    } else if (targetPos) {
      // Temp wire following mouse
      endPos = targetPos;
    } else {
      return null;
    }

    const cp = getWireControlPoints(sourcePos, endPos);
    return `M ${cp.x1} ${cp.y1} C ${cp.x2} ${cp.y2} ${cp.x3} ${cp.y3} ${cp.x4} ${cp.y4}`;
  }, [sourceNode, sourcePort, targetNode, targetPos]);

  if (!pathData) return null;

  // Determine wire class based on state
  let wireClass = 'wire-group';
  let innerClass = 'wire-inner';
  let outerClass = 'wire-outer';
  let dashArray = undefined;

  if (selected) {
    innerClass = 'wire-inner-selected';
  } else if (isTemp) {
    wireClass = isConnecting ? 'wire-group wire-temp wire-connecting' : 'wire-group wire-temp';
    innerClass = isConnecting ? 'wire-inner wire-inner-connecting' : 'wire-inner wire-inner-temp';
    outerClass = 'wire-outer wire-outer-temp';
    dashArray = '4 3';
  } else if (isPending) {
    // Connected but not deployed - colored but dotted
    wireClass = 'wire-group wire-pending';
    innerClass = 'wire-inner wire-inner-pending';
    outerClass = 'wire-outer wire-outer-pending';
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
