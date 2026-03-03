const SQRT3 = Math.sqrt(3);

// All 19 hex positions in axial coordinates (q, r)
// Constraint: max(|q|, |r|, |q+r|) <= 2
export const HEX_POSITIONS = [];
for (let q = -2; q <= 2; q++) {
  for (let r = -2; r <= 2; r++) {
    if (Math.abs(q + r) <= 2) {
      HEX_POSITIONS.push({ q, r });
    }
  }
}

export function isValidHex(q, r) {
  return Math.abs(q) <= 2 && Math.abs(r) <= 2 && Math.abs(q + r) <= 2;
}

// Convert axial (q, r) to pixel position for flat-top hex
export function axialToPixel(q, r, size) {
  const x = size * (3 / 2) * q;
  const y = size * (SQRT3 / 2 * q + SQRT3 * r);
  return { x, y };
}

// 6 corner offsets for flat-top hex, clockwise from right (0°)
export function hexCornerOffsets(size) {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: size * Math.cos(angleRad),
      y: size * Math.sin(angleRad)
    });
  }
  return corners;
}

// Pixel positions of the 6 corners of hex at (q, r)
export function hexCorners(q, r, size) {
  const center = axialToPixel(q, r, size);
  return hexCornerOffsets(size).map(offset => ({
    x: center.x + offset.x,
    y: center.y + offset.y
  }));
}

// For flat-top hex at (q,r), corner i (0=right, clockwise):
// Each corner is shared by up to 3 hexes.
// These arrays map corner i of (q,r) to its equivalent corners on neighbor hexes.
const CORNER_EQUIVALENCES = [
  // corner 0 (right): also corner 2 of (q+1, r-1) and corner 4 of (q+1, r)
  [{ dq: 0, dr: 0, c: 0 }, { dq: 1, dr: -1, c: 2 }, { dq: 1, dr: 0, c: 4 }],
  // corner 1 (lower-right): also corner 3 of (q+1, r) and corner 5 of (q, r+1)
  [{ dq: 0, dr: 0, c: 1 }, { dq: 1, dr: 0, c: 3 }, { dq: 0, dr: 1, c: 5 }],
  // corner 2 (lower-left): also corner 4 of (q, r+1) and corner 0 of (q-1, r+1)
  [{ dq: 0, dr: 0, c: 2 }, { dq: 0, dr: 1, c: 4 }, { dq: -1, dr: 1, c: 0 }],
  // corner 3 (left): also corner 5 of (q-1, r+1) and corner 1 of (q-1, r)
  [{ dq: 0, dr: 0, c: 3 }, { dq: -1, dr: 1, c: 5 }, { dq: -1, dr: 0, c: 1 }],
  // corner 4 (upper-left): also corner 0 of (q-1, r) and corner 2 of (q, r-1)
  [{ dq: 0, dr: 0, c: 4 }, { dq: -1, dr: 0, c: 0 }, { dq: 0, dr: -1, c: 2 }],
  // corner 5 (upper-right): also corner 1 of (q, r-1) and corner 3 of (q+1, r-1)
  [{ dq: 0, dr: 0, c: 5 }, { dq: 0, dr: -1, c: 1 }, { dq: 1, dr: -1, c: 3 }],
];

// Generate canonical vertex key from hex (q,r) and corner index (0-5)
export function vertexKey(q, r, cornerIndex) {
  const equivs = CORNER_EQUIVALENCES[cornerIndex];
  const candidates = equivs
    .map(e => ({ q: q + e.dq, r: r + e.dr, c: e.c }))
    .filter(v => isValidHex(v.q, v.r));

  candidates.sort((a, b) => a.q - b.q || a.r - b.r || a.c - b.c);
  const v = candidates[0];
  return `${v.q},${v.r},${v.c}`;
}

// Get all 54 unique vertex keys
export function getAllVertices() {
  const vertexSet = new Set();
  for (const { q, r } of HEX_POSITIONS) {
    for (let c = 0; c < 6; c++) {
      vertexSet.add(vertexKey(q, r, c));
    }
  }
  return Array.from(vertexSet);
}

// Edge key from two vertex keys (sorted for uniqueness)
export function edgeKey(vKey1, vKey2) {
  return vKey1 < vKey2 ? `${vKey1}|${vKey2}` : `${vKey2}|${vKey1}`;
}

// Get all 72 unique edge keys
export function getAllEdges() {
  const edgeSet = new Set();
  for (const { q, r } of HEX_POSITIONS) {
    for (let c = 0; c < 6; c++) {
      const v1 = vertexKey(q, r, c);
      const v2 = vertexKey(q, r, (c + 1) % 6);
      edgeSet.add(edgeKey(v1, v2));
    }
  }
  return Array.from(edgeSet);
}

// Get the 6 vertex keys for a hex
export function getVerticesForHex(q, r) {
  return [0, 1, 2, 3, 4, 5].map(c => vertexKey(q, r, c));
}

// Get hexes that touch a given vertex
export function getHexesForVertex(vKey) {
  const hexes = [];
  for (const { q, r } of HEX_POSITIONS) {
    for (let c = 0; c < 6; c++) {
      if (vertexKey(q, r, c) === vKey) {
        hexes.push({ q, r });
        break;
      }
    }
  }
  return hexes;
}

// Get adjacent vertices (connected by one edge)
export function getAdjacentVertices(vKey) {
  const adjacent = new Set();
  for (const { q, r } of HEX_POSITIONS) {
    for (let c = 0; c < 6; c++) {
      if (vertexKey(q, r, c) === vKey) {
        adjacent.add(vertexKey(q, r, (c + 5) % 6));
        adjacent.add(vertexKey(q, r, (c + 1) % 6));
      }
    }
  }
  adjacent.delete(vKey);
  return Array.from(adjacent);
}

// Get edges connected to a vertex
export function getEdgesForVertex(vKey) {
  const adj = getAdjacentVertices(vKey);
  return adj.map(av => edgeKey(vKey, av));
}

// Get pixel position of a vertex
export function vertexPixelPosition(vKey, size) {
  const parts = vKey.split(',');
  const q = parseInt(parts[0]);
  const r = parseInt(parts[1]);
  const c = parseInt(parts[2]);
  const corners = hexCorners(q, r, size);
  return corners[c];
}

// Get the two vertex keys from an edge key
export function edgeVertices(eKey) {
  return eKey.split('|');
}

// Compute SVG viewBox for the board
export function computeViewBox(hexSize, padding = 50) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const { q, r } of HEX_POSITIONS) {
    const { x, y } = axialToPixel(q, r, hexSize);
    minX = Math.min(minX, x - hexSize * 1.2);
    maxX = Math.max(maxX, x + hexSize * 1.2);
    minY = Math.min(minY, y - hexSize * 1.2);
    maxY = Math.max(maxY, y + hexSize * 1.2);
  }
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding
  };
}
