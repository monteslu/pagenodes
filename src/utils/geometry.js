// Node dimensions (matching pagenodes 1)
export const NODE_WIDTH = 100;
export const MIN_NODE_WIDTH = 100;
export const MAX_NODE_WIDTH = 200;
export const NODE_HEIGHT = 30;
export const MIN_NODE_HEIGHT = 30;
export const STEP_HEIGHT = 20;
export const PORT_SIZE = 10;
export const WIRE_CURVE_OFFSET = 60;
export const CHAR_WIDTH = 7; // Approximate width per character at font-size 12

// Audio port constants
export const AUDIO_PORT_OFFSET = 8; // Vertical offset between message and audio ports

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

// Calculate node height considering both message and audio ports
export function calcNodeHeightWithAudio(outputs, streamOutputs, inputs, streamInputs) {
  // Calculate max ports on each side
  const leftPorts = (inputs || 0) + (streamInputs || 0);
  const rightPorts = (outputs || 0) + (streamOutputs || 0);
  const maxPorts = Math.max(leftPorts, rightPorts, 1);

  if (maxPorts <= 1) return MIN_NODE_HEIGHT;
  return MIN_NODE_HEIGHT + (maxPorts - 1) * STEP_HEIGHT;
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

// Calculate Y positions for stacked ports (message ports on top, audio ports below)
export function calcStackedPortPositions(messagePorts, audioPorts, height) {
  const totalPorts = messagePorts + audioPorts;
  if (totalPorts === 0) return { message: [], audio: [] };

  if (totalPorts === 1) {
    if (messagePorts === 1) return { message: [height / 2], audio: [] };
    return { message: [], audio: [height / 2] };
  }

  const spread = (totalPorts - 1) * STEP_HEIGHT;
  const startY = (height - spread) / 2;

  const messagePositions = [];
  const audioPositions = [];

  // Message ports come first (top)
  for (let i = 0; i < messagePorts; i++) {
    messagePositions.push(startY + i * STEP_HEIGHT);
  }

  // Audio ports come after (bottom)
  for (let i = 0; i < audioPorts; i++) {
    audioPositions.push(startY + (messagePorts + i) * STEP_HEIGHT);
  }

  return { message: messagePositions, audio: audioPositions };
}

// Calculate port position on a node
export function getPortPosition(node, portIndex, isOutput, nodeHeight, nodeWidth, nodeDef) {
  const height = nodeHeight || calcNodeHeight(
    isOutput ? (node.wires?.length || 1) : 1
  );
  const width = nodeWidth || NODE_WIDTH;

  if (isOutput) {
    const outputs = node.wires?.length || 1;
    const positions = calcOutputYPositions(outputs, height);
    return {
      x: node.x + width,
      y: node.y + (positions[portIndex] || height / 2)
    };
  } else {
    // For input ports, check if node has both message and audio inputs
    const msgInputs = nodeDef?.inputs || 1;
    const streamInputs = nodeDef?.getStreamInputs ? nodeDef.getStreamInputs(node) : (nodeDef?.streamInputs || 0);

    if (streamInputs > 0 && msgInputs > 0) {
      // Use stacked positions when there are both message and audio inputs
      const positions = calcStackedPortPositions(msgInputs, streamInputs, height);
      return {
        x: node.x,
        y: node.y + (positions.message[portIndex] || height / 2)
      };
    }

    return {
      x: node.x,
      y: node.y + height / 2
    };
  }
}

// Calculate audio stream port position on a node
export function getStreamPortPosition(node, portIndex, isOutput, nodeDef, nodeHeight, nodeWidth) {
  const msgOutputs = nodeDef?.outputs || 0;
  const msgInputs = nodeDef?.inputs || 0;
  const streamOutputs = nodeDef?.getStreamOutputs ? nodeDef.getStreamOutputs(node) : (nodeDef?.streamOutputs || 0);
  const streamInputs = nodeDef?.getStreamInputs ? nodeDef.getStreamInputs(node) : (nodeDef?.streamInputs || 0);

  const height = nodeHeight || calcNodeHeightWithAudio(msgOutputs, streamOutputs, msgInputs, streamInputs);
  const width = nodeWidth || NODE_WIDTH;

  if (isOutput) {
    const positions = calcStackedPortPositions(msgOutputs, streamOutputs, height);
    return {
      x: node.x + width,
      y: node.y + (positions.audio[portIndex] || height / 2)
    };
  } else {
    const positions = calcStackedPortPositions(msgInputs, streamInputs, height);
    return {
      x: node.x,
      y: node.y + (positions.audio[portIndex] || height / 2)
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
// Wire extends straight out from port before curving
const WIRE_PORT_EXTEND = 8; // How far wire extends straight out from port

export function getWireControlPoints(sourcePos, targetPos) {
  const dx = targetPos.x - sourcePos.x;
  const controlOffset = Math.max(WIRE_CURVE_OFFSET, Math.abs(dx) * 0.4);

  return {
    x1: sourcePos.x + WIRE_PORT_EXTEND,  // Start slightly right of output port
    y1: sourcePos.y,
    x2: sourcePos.x + controlOffset,
    y2: sourcePos.y,
    x3: targetPos.x - controlOffset,
    y3: targetPos.y,
    x4: targetPos.x - WIRE_PORT_EXTEND,  // End slightly left of input port
    y4: targetPos.y
  };
}

// Check if a point is inside a node
export function isPointInNode(x, y, node, nodeWidth) {
  const height = calcNodeHeight(node.wires?.length || 1);
  const width = nodeWidth || NODE_WIDTH;
  return (
    x >= node.x &&
    x <= node.x + width &&
    y >= node.y &&
    y <= node.y + height
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
  const height = calcNodeHeight(node.wires?.length || 1);
  const width = nodeWidth || NODE_WIDTH;
  const nodeRect = {
    x: node.x,
    y: node.y,
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
    const height = calcNodeHeight(node.wires?.length || 1);
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.y + height);
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

/**
 * Check if adding a connection would create a cycle in the graph.
 * Uses depth-first search to check if targetId can reach sourceId.
 *
 * @param {Object} nodes - Map of nodeId -> node objects
 * @param {string} sourceId - Source node of the proposed connection
 * @param {string} targetId - Target node of the proposed connection
 * @param {boolean} isStream - Whether checking stream wires (true) or message wires (false)
 * @returns {boolean} True if connection would create a cycle
 */
export function wouldCreateCycle(nodes, sourceId, targetId, isStream = false) {
  // Can't create a cycle with self-connection (though we should prevent those anyway)
  if (sourceId === targetId) return true;

  // DFS from targetId to see if we can reach sourceId
  const visited = new Set();
  const wireKey = isStream ? 'streamWires' : 'wires';

  function canReach(currentId, goalId) {
    if (currentId === goalId) return true;
    if (visited.has(currentId)) return false;

    visited.add(currentId);

    const node = nodes[currentId];
    if (!node) return false;

    const wires = node[wireKey] || [];
    for (const portWires of wires) {
      if (!Array.isArray(portWires)) continue;
      for (const nextId of portWires) {
        if (canReach(nextId, goalId)) return true;
      }
    }

    return false;
  }

  // Check if target can already reach source (cycle would be created)
  return canReach(targetId, sourceId);
}
