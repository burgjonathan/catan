import { hexPositionsForRadius, vertexKey } from '../shared/hexGeometry.js';
import { TERRAIN_COUNTS, NUMBER_TOKENS, TERRAIN_COUNTS_EXPANSION, NUMBER_TOKENS_EXPANSION } from '../shared/constants.js';
import {
  PORT_TYPES, PORT_EDGE_DEFINITIONS, SPIRAL_HEX_ORDER,
  PORT_TYPES_EXPANSION, PORT_EDGE_DEFINITIONS_EXPANSION, SPIRAL_HEX_ORDER_EXPANSION
} from '../shared/boardLayout.js';
import { getAllVertices, getAllEdges } from '../shared/hexGeometry.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateBoard(expansion = false) {
  const terrainCounts = expansion ? TERRAIN_COUNTS_EXPANSION : TERRAIN_COUNTS;
  const numberTokens = expansion ? NUMBER_TOKENS_EXPANSION : NUMBER_TOKENS;
  const spiralOrder = expansion ? SPIRAL_HEX_ORDER_EXPANSION : SPIRAL_HEX_ORDER;
  const portTypes = expansion ? PORT_TYPES_EXPANSION : PORT_TYPES;
  const portEdgeDefs = expansion ? PORT_EDGE_DEFINITIONS_EXPANSION : PORT_EDGE_DEFINITIONS;
  const boardRadius = expansion ? 3 : 2;
  const hexPositions = hexPositionsForRadius(boardRadius);

  // Build terrain tile pool
  const terrainPool = [];
  for (const [terrain, count] of Object.entries(terrainCounts)) {
    for (let i = 0; i < count; i++) {
      terrainPool.push(terrain);
    }
  }
  const shuffledTerrains = shuffle(terrainPool);

  // Map shuffled terrains to spiral hex order
  const hexMap = {};
  for (let i = 0; i < spiralOrder.length; i++) {
    const { q, r } = spiralOrder[i];
    hexMap[`${q},${r}`] = { q, r, terrain: shuffledTerrains[i], number: null, hasRobber: false };
  }

  // Assign number tokens to non-desert hexes in spiral order
  let numberIndex = 0;
  for (const { q, r } of spiralOrder) {
    const hex = hexMap[`${q},${r}`];
    if (hex.terrain === 'desert') {
      hex.hasRobber = true;
    } else {
      hex.number = numberTokens[numberIndex++];
    }
  }

  // Build hexes array
  const hexes = hexPositions.map(({ q, r }) => hexMap[`${q},${r}`]);

  // Find desert hex for initial robber position (use first desert)
  const desertHex = hexes.find(h => h.terrain === 'desert');
  const robberHex = { q: desertHex.q, r: desertHex.r };
  // Only the first desert gets the robber initially
  for (const hex of hexes) {
    hex.hasRobber = (hex.q === robberHex.q && hex.r === robberHex.r);
  }

  // Shuffle and assign port types
  const shuffledPorts = shuffle([...portTypes]);
  const ports = portEdgeDefs.map((def, i) => {
    const v1 = vertexKey(def.hex.q, def.hex.r, def.corners[0], hexPositions);
    const v2 = vertexKey(def.hex.q, def.hex.r, def.corners[1], hexPositions);
    return {
      vertexKeys: [v1, v2],
      type: shuffledPorts[i],
      hex: def.hex,
      corners: def.corners
    };
  });

  // Initialize all vertices and edges
  const vertices = {};
  for (const vKey of getAllVertices(hexPositions)) {
    vertices[vKey] = { building: null, owner: null, ownerId: null };
  }

  const edges = {};
  for (const eKey of getAllEdges(hexPositions)) {
    edges[eKey] = { road: false, owner: null, ownerId: null };
  }

  return { hexes, ports, vertices, edges, robberHex, boardRadius };
}
