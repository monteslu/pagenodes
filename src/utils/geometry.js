// Node dimensions (matching pagenodes 1)
export const NODE_WIDTH = 100;
export const MIN_NODE_WIDTH = 100;
export const MAX_NODE_WIDTH = 200;
export const NODE_HEIGHT = 30;
export const MIN_NODE_HEIGHT = 30;
export const STEP_HEIGHT = 15;
export const PORT_SIZE = 10;
export const WIRE_CURVE_OFFSET = 60;
export const CHAR_WIDTH = 6; // Approximate width per character at font-size 10

// Calculate node width based on label length
export function calcNodeWidth(label, hasIcon = false) {
  if (!label) return MIN_NODE_WIDTH;

  // Base padding for ports and margins
  const basePadding = 30;
  // Extra padding if there's an icon
  const iconPadding = hasIcon ? 26 : 0;

  const textWidth = label.length * CHAR_WIDTH;
  const neededWidth = textWidth + basePadding + iconPadding;

  return Math.min(MAX_NODE_WIDTH, Math.max(MIN_NODE_WIDTH, neededWidth));
}

// Calculate max label length that fits in max width, and truncate if needed
export function truncateLabel(label, hasIcon = false) {
  if (!label) return '';

  const basePadding = 30;
  const iconPadding = hasIcon ? 26 : 0;
  const availableWidth = MAX_NODE_WIDTH - basePadding - iconPadding;
  const maxChars = Math.floor(availableWidth / CHAR_WIDTH);

  if (label.length <= maxChars) return label;
  return label.slice(0, maxChars - 2) + '..';
}

// Calculate node height based on number of outputs
export function calcNodeHeight(outputs) {
  if (outputs <= 1) return MIN_NODE_HEIGHT;
  return MIN_NODE_HEIGHT + (outputs - 1) * STEP_HEIGHT;
}

// Calculate Y positions for output ports
export function calcOutputYPositions(outputs, height) {
  if (outputs === 0) return [];
  if (outputs === 1) return [height / 2];

  const positions = [];
  const spread = (outputs - 1) * STEP_HEIGHT;
  const startY = (height - spread) / 2;

  for (let i = 0; i < outputs; i++) {
    positions.push(startY + i * STEP_HEIGHT);
  }
  return positions;
}

// Calculate port position on a node
export function getPortPosition(node, portIndex, isOutput, nodeHeight, nodeWidth) {
  const height = nodeHeight || calcNodeHeight(
    isOutput ? (node._node.wires?.length || 1) : 1
  );
  const width = nodeWidth || NODE_WIDTH;

  if (isOutput) {
    const outputs = node._node.wires?.length || 1;
    const positions = calcOutputYPositions(outputs, height);
    return {
      x: node._node.x + width,
      y: node._node.y + (positions[portIndex] || height / 2)
    };
  } else {
    return {
      x: node._node.x,
      y: node._node.y + height / 2
    };
  }
}

// Calculate bezier curve path for a wire
export function getWirePath(sourcePos, targetPos) {
  const dx = targetPos.x - sourcePos.x;
  const controlOffset = Math.max(WIRE_CURVE_OFFSET, Math.abs(dx) * 0.4);

  return `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + controlOffset} ${sourcePos.y}, ${targetPos.x - controlOffset} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;
}

// Get wire control points for more control
export function getWireControlPoints(sourcePos, targetPos) {
  const dx = targetPos.x - sourcePos.x;
  const controlOffset = Math.max(WIRE_CURVE_OFFSET, Math.abs(dx) * 0.4);

  return {
    x1: sourcePos.x,
    y1: sourcePos.y,
    x2: sourcePos.x + controlOffset,
    y2: sourcePos.y,
    x3: targetPos.x - controlOffset,
    y3: targetPos.y,
    x4: targetPos.x,
    y4: targetPos.y
  };
}

// Check if a point is inside a node
export function isPointInNode(x, y, node, nodeWidth) {
  const height = calcNodeHeight(node._node.wires?.length || 1);
  const width = nodeWidth || NODE_WIDTH;
  return (
    x >= node._node.x &&
    x <= node._node.x + width &&
    y >= node._node.y &&
    y <= node._node.y + height
  );
}

// Check if two rectangles overlap (for selection box)
export function rectsOverlap(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

// Check if a node is within a selection rectangle
export function isNodeInSelection(node, selectionRect, nodeWidth) {
  const height = calcNodeHeight(node._node.wires?.length || 1);
  const width = nodeWidth || NODE_WIDTH;
  const nodeRect = {
    x: node._node.x,
    y: node._node.y,
    width: width,
    height: height
  };
  return rectsOverlap(nodeRect, selectionRect);
}

// Get bounding box of multiple nodes
export function getNodesBounds(nodes) {
  if (nodes.length === 0) return null;

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const node of nodes) {
    const height = calcNodeHeight(node._node.wires?.length || 1);
    minX = Math.min(minX, node._node.x);
    minY = Math.min(minY, node._node.y);
    maxX = Math.max(maxX, node._node.x + NODE_WIDTH);
    maxY = Math.max(maxY, node._node.y + height);
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Normalize a selection rectangle (handle negative width/height from drag direction)
export function normalizeRect(x1, y1, x2, y2) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1)
  };
}
