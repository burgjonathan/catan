import { HEX_POSITIONS, vertexKey, getAllVertices, getAllEdges, edgeKey, getAdjacentVertices } from 'shared/hexGeometry.js';
import { TERRAIN_COUNTS, NUMBER_TOKENS, PLAYER_COLORS } from 'shared/constants.js';
import { PORT_TYPES, PORT_EDGE_DEFINITIONS, SPIRAL_HEX_ORDER } from 'shared/boardLayout.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const TUTORIAL_PLAYER_ID = 'tutorial-player';

export function generateDemoGameState() {
  // Build terrain tile pool
  const terrainPool = [];
  for (const [terrain, count] of Object.entries(TERRAIN_COUNTS)) {
    for (let i = 0; i < count; i++) {
      terrainPool.push(terrain);
    }
  }
  const shuffledTerrains = shuffle(terrainPool);

  // Map terrains to hex positions
  const hexMap = {};
  for (let i = 0; i < SPIRAL_HEX_ORDER.length; i++) {
    const { q, r } = SPIRAL_HEX_ORDER[i];
    hexMap[`${q},${r}`] = { q, r, terrain: shuffledTerrains[i], number: null, hasRobber: false };
  }

  // Assign number tokens
  let numberIndex = 0;
  for (const { q, r } of SPIRAL_HEX_ORDER) {
    const hex = hexMap[`${q},${r}`];
    if (hex.terrain === 'desert') {
      hex.hasRobber = true;
    } else {
      hex.number = NUMBER_TOKENS[numberIndex++];
    }
  }

  const hexes = HEX_POSITIONS.map(({ q, r }) => hexMap[`${q},${r}`]);
  const desertHex = hexes.find(h => h.terrain === 'desert');
  const robberHex = { q: desertHex.q, r: desertHex.r };

  // Ports
  const shuffledPorts = shuffle([...PORT_TYPES]);
  const ports = PORT_EDGE_DEFINITIONS.map((def, i) => {
    const v1 = vertexKey(def.hex.q, def.hex.r, def.corners[0]);
    const v2 = vertexKey(def.hex.q, def.hex.r, def.corners[1]);
    return {
      vertexKeys: [v1, v2],
      type: shuffledPorts[i],
      hex: def.hex,
      corners: def.corners,
    };
  });

  // Initialize vertices and edges
  const vertices = {};
  for (const vKey of getAllVertices()) {
    vertices[vKey] = { building: null, owner: null, ownerId: null };
  }

  const edges = {};
  for (const eKey of getAllEdges()) {
    edges[eKey] = { road: false, owner: null, ownerId: null };
  }

  // Demo players
  const players = [
    {
      id: TUTORIAL_PLAYER_ID,
      name: 'You',
      color: PLAYER_COLORS[0],
      resources: { wood: 2, brick: 1, sheep: 2, wheat: 1, ore: 1 },
      devCards: ['knight'],
      newDevCards: [],
      settlements: [],
      cities: [],
      roads: [],
      knightsPlayed: 0,
      hasPlayedDevCardThisTurn: false,
      ports: [],
      resourceCount: 7,
    },
    {
      id: 'bot-1',
      name: 'Alice',
      color: PLAYER_COLORS[1],
      resources: { wood: 1, brick: 2, sheep: 0, wheat: 1, ore: 0 },
      devCards: [],
      newDevCards: [],
      settlements: [],
      cities: [],
      roads: [],
      knightsPlayed: 0,
      hasPlayedDevCardThisTurn: false,
      ports: [],
      resourceCount: 4,
    },
    {
      id: 'bot-2',
      name: 'Bob',
      color: PLAYER_COLORS[2],
      resources: { wood: 0, brick: 1, sheep: 1, wheat: 2, ore: 1 },
      devCards: [],
      newDevCards: [],
      settlements: [],
      cities: [],
      roads: [],
      knightsPlayed: 0,
      hasPlayedDevCardThisTurn: false,
      ports: [],
      resourceCount: 5,
    },
    {
      id: 'bot-3',
      name: 'Carol',
      color: PLAYER_COLORS[3],
      resources: { wood: 2, brick: 0, sheep: 1, wheat: 0, ore: 2 },
      devCards: [],
      newDevCards: [],
      settlements: [],
      cities: [],
      roads: [],
      knightsPlayed: 0,
      hasPlayedDevCardThisTurn: false,
      ports: [],
      resourceCount: 5,
    },
  ];

  // Place settlements and roads for each player
  const placements = [
    { idx: 0, spots: [{ q: 0, r: 0, c: 0 }, { q: -1, r: 0, c: 2 }] },
    { idx: 1, spots: [{ q: 1, r: -1, c: 3 }, { q: 0, r: 1, c: 5 }] },
    { idx: 2, spots: [{ q: -1, r: 2, c: 0 }, { q: 1, r: -2, c: 1 }] },
    { idx: 3, spots: [{ q: 2, r: 0, c: 3 }, { q: -2, r: 1, c: 0 }] },
  ];

  for (const { idx, spots } of placements) {
    const player = players[idx];
    for (const { q, r, c } of spots) {
      const vKey = vertexKey(q, r, c);
      vertices[vKey] = { building: 'settlement', owner: player.color, ownerId: player.id };
      player.settlements.push(vKey);

      // Add a road from this settlement to an adjacent vertex
      const adj = getAdjacentVertices(vKey);
      const target = adj.find(av => !vertices[av]?.building && !edges[edgeKey(vKey, av)]?.road);
      if (target) {
        const eKey = edgeKey(vKey, target);
        edges[eKey] = { road: true, owner: player.color, ownerId: player.id };
        player.roads.push(eKey);
      }
    }
  }

  return {
    board: { hexes, ports, vertices, edges, robberHex },
    players,
    currentPlayerIndex: 0,
    phase: 'main',
    turnNumber: 3,
    setupPlacedSettlement: false,
    longestRoad: { playerId: null, length: 0 },
    largestArmy: { playerId: null, count: 0 },
    pendingTrade: null,
    roadBuildingRemaining: 0,
  };
}
