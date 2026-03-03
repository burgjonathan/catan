import { HEX_POSITIONS, vertexKey } from '../shared/hexGeometry.js';
import { TERRAIN_COUNTS, NUMBER_TOKENS } from '../shared/constants.js';
import { PORT_TYPES, PORT_EDGE_DEFINITIONS, SPIRAL_HEX_ORDER } from '../shared/boardLayout.js';
import { getAllVertices, getAllEdges } from '../shared/hexGeometry.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateBoard() {
  // Build terrain tile pool
  const terrainPool = [];
  for (const [terrain, count] of Object.entries(TERRAIN_COUNTS)) {
    for (let i = 0; i < count; i++) {
      terrainPool.push(terrain);
    }
  }
  const shuffledTerrains = shuffle(terrainPool);

  // Map shuffled terrains to spiral hex order
  const hexMap = {};
  for (let i = 0; i < SPIRAL_HEX_ORDER.length; i++) {
    const { q, r } = SPIRAL_HEX_ORDER[i];
    hexMap[`${q},${r}`] = { q, r, terrain: shuffledTerrains[i], number: null, hasRobber: false };
  }

  // Assign number tokens to non-desert hexes in spiral order
  let numberIndex = 0;
  for (const { q, r } of SPIRAL_HEX_ORDER) {
    const hex = hexMap[`${q},${r}`];
    if (hex.terrain === 'desert') {
      hex.hasRobber = true;
    } else {
      hex.number = NUMBER_TOKENS[numberIndex++];
    }
  }

  // Build hexes array
  const hexes = HEX_POSITIONS.map(({ q, r }) => hexMap[`${q},${r}`]);

  // Find desert hex for initial robber position
  const desertHex = hexes.find(h => h.terrain === 'desert');
  const robberHex = { q: desertHex.q, r: desertHex.r };

  // Shuffle and assign port types
  const shuffledPorts = shuffle([...PORT_TYPES]);
  const ports = PORT_EDGE_DEFINITIONS.map((def, i) => {
    const v1 = vertexKey(def.hex.q, def.hex.r, def.corners[0]);
    const v2 = vertexKey(def.hex.q, def.hex.r, def.corners[1]);
    return {
      vertexKeys: [v1, v2],
      type: shuffledPorts[i],
      hex: def.hex,
      corners: def.corners
    };
  });

  // Initialize all vertices and edges
  const vertices = {};
  for (const vKey of getAllVertices()) {
    vertices[vKey] = { building: null, owner: null, ownerId: null };
  }

  const edges = {};
  for (const eKey of getAllEdges()) {
    edges[eKey] = { road: false, owner: null, ownerId: null };
  }

  return { hexes, ports, vertices, edges, robberHex };
}
