export const PORT_TYPES = [
  '3:1', '3:1', '3:1', '3:1',
  'wood', 'brick', 'sheep', 'wheat', 'ore'
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
