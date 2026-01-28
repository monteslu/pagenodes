import { describe, it, expect } from 'vitest';
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  MIN_NODE_HEIGHT,
  STEP_HEIGHT,
  calcNodeHeight,
  calcOutputYPositions,
  getPortPosition,
  getWirePath,
  getWireControlPoints,
  isPointInNode,
  rectsOverlap,
  isNodeInSelection,
  getNodesBounds,
  normalizeRect
} from '../src/utils/geometry.js';

describe('geometry constants', () => {
  it('should have expected default values', () => {
    expect(NODE_WIDTH).toBe(100);
    expect(NODE_HEIGHT).toBe(30);
    expect(MIN_NODE_HEIGHT).toBe(30);
    expect(STEP_HEIGHT).toBe(20);
  });
});

describe('calcNodeHeight', () => {
  it('returns MIN_NODE_HEIGHT for 0 outputs', () => {
    expect(calcNodeHeight(0)).toBe(MIN_NODE_HEIGHT);
  });

  it('returns MIN_NODE_HEIGHT for 1 output', () => {
    expect(calcNodeHeight(1)).toBe(MIN_NODE_HEIGHT);
  });

  it('increases height for multiple outputs', () => {
    expect(calcNodeHeight(2)).toBe(MIN_NODE_HEIGHT + STEP_HEIGHT);
    expect(calcNodeHeight(3)).toBe(MIN_NODE_HEIGHT + 2 * STEP_HEIGHT);
    expect(calcNodeHeight(5)).toBe(MIN_NODE_HEIGHT + 4 * STEP_HEIGHT);
  });
});

describe('calcOutputYPositions', () => {
  it('returns empty array for 0 outputs', () => {
    expect(calcOutputYPositions(0, 30)).toEqual([]);
  });

  it('returns center position for 1 output', () => {
    expect(calcOutputYPositions(1, 30)).toEqual([15]);
    expect(calcOutputYPositions(1, 60)).toEqual([30]);
  });

  it('spreads positions evenly for multiple outputs', () => {
    const positions = calcOutputYPositions(2, 45);
    expect(positions).toHaveLength(2);
    expect(positions[1] - positions[0]).toBe(STEP_HEIGHT);
  });

  it('centers outputs vertically', () => {
    const height = 60;
    const positions = calcOutputYPositions(3, height);
    // Should be symmetric around center
    const center = height / 2;
    expect(positions[1]).toBe(center);
  });
});

describe('getPortPosition', () => {
  const mockNode = { x: 100, y: 50, wires: [['a'], ['b']] };

  it('returns input port at left edge, vertically centered', () => {
    const pos = getPortPosition(mockNode, 0, false, 30);
    expect(pos.x).toBe(100); // Left edge
    expect(pos.y).toBe(65); // y + height/2
  });

  it('returns output port at right edge', () => {
    const pos = getPortPosition(mockNode, 0, true, 45);
    expect(pos.x).toBe(200); // x + NODE_WIDTH
  });

  it('calculates height from wires if not provided', () => {
    const pos = getPortPosition(mockNode, 0, true);
    expect(pos.x).toBe(200);
  });
});

describe('getWirePath', () => {
  it('returns valid SVG path', () => {
    const path = getWirePath({ x: 0, y: 0 }, { x: 100, y: 50 });
    expect(path).toMatch(/^M \d+ \d+ C/);
    expect(path).toContain('0 0'); // Start point
    expect(path).toContain('100 50'); // End point
  });

  it('handles negative coordinates', () => {
    const path = getWirePath({ x: -50, y: -25 }, { x: 50, y: 25 });
    expect(path).toContain('-50 -25');
    expect(path).toContain('50 25');
  });
});

describe('getWireControlPoints', () => {
  it('returns all 4 control points with port extension offset', () => {
    const points = getWireControlPoints({ x: 0, y: 0 }, { x: 100, y: 50 });
    // x1 is offset by WIRE_PORT_EXTEND (8) from source
    expect(points).toHaveProperty('x1', 8);
    expect(points).toHaveProperty('y1', 0);
    // x4 is offset by -WIRE_PORT_EXTEND from target
    expect(points).toHaveProperty('x4', 92);
    expect(points).toHaveProperty('y4', 50);
  });

  it('control points extend horizontally from endpoints', () => {
    const points = getWireControlPoints({ x: 0, y: 0 }, { x: 200, y: 0 });
    // x2 should be greater than x1 (extending right)
    expect(points.x2).toBeGreaterThan(points.x1);
    // x3 should be less than x4 (extending left from target)
    expect(points.x3).toBeLessThan(points.x4);
  });
});

describe('isPointInNode', () => {
  const mockNode = { x: 100, y: 100, wires: [[]] };

  it('returns true for point inside node', () => {
    expect(isPointInNode(150, 115, mockNode)).toBe(true);
  });

  it('returns true for point on edge', () => {
    expect(isPointInNode(100, 100, mockNode)).toBe(true);
    expect(isPointInNode(200, 130, mockNode)).toBe(true);
  });

  it('returns false for point outside node', () => {
    expect(isPointInNode(99, 100, mockNode)).toBe(false);
    expect(isPointInNode(201, 100, mockNode)).toBe(false);
    expect(isPointInNode(150, 99, mockNode)).toBe(false);
    expect(isPointInNode(150, 131, mockNode)).toBe(false);
  });
});

describe('rectsOverlap', () => {
  it('returns true for overlapping rects', () => {
    const rect1 = { x: 0, y: 0, width: 100, height: 100 };
    const rect2 = { x: 50, y: 50, width: 100, height: 100 };
    expect(rectsOverlap(rect1, rect2)).toBe(true);
  });

  it('returns true for contained rect', () => {
    const outer = { x: 0, y: 0, width: 200, height: 200 };
    const inner = { x: 50, y: 50, width: 50, height: 50 };
    expect(rectsOverlap(outer, inner)).toBe(true);
    expect(rectsOverlap(inner, outer)).toBe(true);
  });

  it('returns false for non-overlapping rects', () => {
    const rect1 = { x: 0, y: 0, width: 50, height: 50 };
    const rect2 = { x: 100, y: 100, width: 50, height: 50 };
    expect(rectsOverlap(rect1, rect2)).toBe(false);
  });

  it('returns true for adjacent rects (touching counts as overlap)', () => {
    // Touching rects are considered overlapping for selection purposes
    const rect1 = { x: 0, y: 0, width: 50, height: 50 };
    const rect2 = { x: 50, y: 0, width: 50, height: 50 };
    expect(rectsOverlap(rect1, rect2)).toBe(true);
  });
});

describe('isNodeInSelection', () => {
  const mockNode = { x: 100, y: 100, wires: [[]] };

  it('returns true when node is inside selection', () => {
    const selection = { x: 50, y: 50, width: 200, height: 200 };
    expect(isNodeInSelection(mockNode, selection)).toBe(true);
  });

  it('returns true when node partially overlaps selection', () => {
    const selection = { x: 150, y: 100, width: 100, height: 100 };
    expect(isNodeInSelection(mockNode, selection)).toBe(true);
  });

  it('returns false when node is outside selection', () => {
    const selection = { x: 0, y: 0, width: 50, height: 50 };
    expect(isNodeInSelection(mockNode, selection)).toBe(false);
  });
});

describe('getNodesBounds', () => {
  it('returns null for empty array', () => {
    expect(getNodesBounds([])).toBe(null);
  });

  it('returns bounds for single node', () => {
    const nodes = [{ x: 100, y: 50, wires: [[]] }];
    const bounds = getNodesBounds(nodes);
    expect(bounds.x).toBe(100);
    expect(bounds.y).toBe(50);
    expect(bounds.width).toBe(NODE_WIDTH);
    expect(bounds.height).toBe(MIN_NODE_HEIGHT);
  });

  it('returns bounding box for multiple nodes', () => {
    const nodes = [
      { x: 0, y: 0, wires: [[]] },
      { x: 200, y: 100, wires: [[]] }
    ];
    const bounds = getNodesBounds(nodes);
    expect(bounds.x).toBe(0);
    expect(bounds.y).toBe(0);
    expect(bounds.width).toBe(300); // 200 + NODE_WIDTH
    expect(bounds.height).toBe(130); // 100 + MIN_NODE_HEIGHT
  });
});

describe('normalizeRect', () => {
  it('handles positive direction drag', () => {
    const rect = normalizeRect(0, 0, 100, 50);
    expect(rect).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('handles negative direction drag (right to left)', () => {
    const rect = normalizeRect(100, 50, 0, 0);
    expect(rect).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('handles mixed direction drag', () => {
    const rect = normalizeRect(100, 0, 0, 50);
    expect(rect).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('handles zero-size rect', () => {
    const rect = normalizeRect(50, 50, 50, 50);
    expect(rect).toEqual({ x: 50, y: 50, width: 0, height: 0 });
  });
});
