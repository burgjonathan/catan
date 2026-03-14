export const PORT_TYPES = [
  '3:1', '3:1', '3:1', '3:1',
  'wood', 'brick', 'sheep', 'wheat', 'ore'
];

export const PORT_TYPES_EXPANSION = [
  '3:1', '3:1', '3:1', '3:1', '3:1',
  'wood', 'brick', 'sheep', 'wheat', 'ore', '3:1'
];

// Port edge definitions: each port sits on an outer edge of the board
// Defined as { hex: {q, r}, corners: [c1, c2] } -- the two corner indices forming the coastal edge
export const PORT_EDGE_DEFINITIONS = [
  { hex: { q: 0, r: -2 }, corners: [4, 5] },
  { hex: { q: 1, r: -2 }, corners: [5, 0] },
  { hex: { q: 2, r: -2 }, corners: [0, 1] },
  { hex: { q: 2, r: -1 }, corners: [0, 1] },
  { hex: { q: 2, r: 0 }, corners: [1, 2] },
  { hex: { q: 1, r: 1 }, corners: [1, 2] },
  { hex: { q: 0, r: 2 }, corners: [2, 3] },
  { hex: { q: -1, r: 2 }, corners: [2, 3] },
  { hex: { q: -2, r: 2 }, corners: [3, 4] },
];

// Spiral order for number token placement (clockwise from outer ring)
export const SPIRAL_HEX_ORDER = [
  { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
  { q: 2, r: -1 }, { q: 2, r: 0 },
  { q: 1, r: 1 }, { q: 0, r: 2 },
  { q: -1, r: 2 }, { q: -2, r: 2 },
  { q: -2, r: 1 }, { q: -2, r: 0 },
  { q: -1, r: -1 },
  // Inner ring
  { q: 0, r: -1 }, { q: 1, r: -1 },
  { q: 1, r: 0 },
  { q: 0, r: 1 }, { q: -1, r: 1 },
  { q: -1, r: 0 },
  // Center
  { q: 0, r: 0 }
];

// Expansion board (30 hexes) spiral order for number token placement
export const SPIRAL_HEX_ORDER_EXPANSION = [
  // Outer ring (18 hexes, clockwise from top)
  { q: 0, r: -3 }, { q: 1, r: -3 }, { q: 2, r: -3 }, { q: 3, r: -3 },
  { q: 3, r: -2 }, { q: 3, r: -1 }, { q: 3, r: 0 },
  { q: 2, r: 1 }, { q: 1, r: 2 }, { q: 0, r: 3 },
  { q: -1, r: 3 }, { q: -2, r: 3 }, { q: -3, r: 3 },
  { q: -3, r: 2 }, { q: -3, r: 1 }, { q: -3, r: 0 },
  { q: -2, r: -1 }, { q: -1, r: -2 },
  // Middle ring (12 hexes)
  { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
  { q: 2, r: -1 }, { q: 2, r: 0 },
  { q: 1, r: 1 }, { q: 0, r: 2 },
  { q: -1, r: 2 }, { q: -2, r: 2 },
  { q: -2, r: 1 }, { q: -2, r: 0 },
  { q: -1, r: -1 },
  // Inner ring (6 hexes)
  { q: 0, r: -1 }, { q: 1, r: -1 },
  { q: 1, r: 0 },
  { q: 0, r: 1 }, { q: -1, r: 1 },
  { q: -1, r: 0 },
  // Center
  { q: 0, r: 0 }
];

// Port edge definitions for expansion board (11 ports on outer edges)
export const PORT_EDGE_DEFINITIONS_EXPANSION = [
  { hex: { q: 0, r: -3 }, corners: [4, 5] },
  { hex: { q: 2, r: -3 }, corners: [5, 0] },
  { hex: { q: 3, r: -2 }, corners: [0, 1] },
  { hex: { q: 3, r: 0 }, corners: [1, 2] },
  { hex: { q: 1, r: 2 }, corners: [1, 2] },
  { hex: { q: -1, r: 3 }, corners: [2, 3] },
  { hex: { q: -3, r: 3 }, corners: [3, 4] },
  { hex: { q: -3, r: 1 }, corners: [3, 4] },
  { hex: { q: -3, r: 0 }, corners: [4, 5] },
  { hex: { q: -1, r: -2 }, corners: [4, 5] },
  { hex: { q: 1, r: -3 }, corners: [5, 0] },
];
