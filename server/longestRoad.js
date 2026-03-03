import { edgeVertices, getEdgesForVertex } from '../shared/hexGeometry.js';

// Calculate the longest road for a player using DFS
export function calculateLongestRoad(board, playerId) {
  // Get all road edge keys owned by this player
  const playerEdges = [];
  for (const [eKey, edge] of Object.entries(board.edges)) {
    if (edge.ownerId === playerId) {
      playerEdges.push(eKey);
    }
  }
  if (playerEdges.length === 0) return 0;

  // Build adjacency: for each vertex, which player edges connect to it
  const vertexToEdges = {};
  for (const eKey of playerEdges) {
    const [v1, v2] = edgeVertices(eKey);
    if (!vertexToEdges[v1]) vertexToEdges[v1] = [];
    if (!vertexToEdges[v2]) vertexToEdges[v2] = [];
    vertexToEdges[v1].push(eKey);
    vertexToEdges[v2].push(eKey);
  }

  let maxLength = 0;

  function dfs(vertex, visited) {
    const edges = vertexToEdges[vertex] || [];
    let extended = false;
    for (const eKey of edges) {
      if (visited.has(eKey)) continue;
      const [v1, v2] = edgeVertices(eKey);
      const nextVertex = v1 === vertex ? v2 : v1;

      // Check if road is broken by opponent's building
      const building = board.vertices[nextVertex];
      if (building && building.ownerId && building.ownerId !== playerId) continue;

      visited.add(eKey);
      extended = true;
      dfs(nextVertex, visited);
      visited.delete(eKey);
    }
    if (!extended || visited.size > maxLength) {
      maxLength = Math.max(maxLength, visited.size);
    }
  }

  // Try starting DFS from every vertex that has player's roads
  for (const vertex of Object.keys(vertexToEdges)) {
    dfs(vertex, new Set());
  }

  return maxLength;
}

export function updateLongestRoad(state) {
  let longestPlayerId = null;
  let longestLength = 4; // Minimum 5 to earn the bonus

  for (const player of state.players) {
    const length = calculateLongestRoad(state.board, player.id);
    player.longestRoadLength = length;
    if (length > longestLength) {
      longestLength = length;
      longestPlayerId = player.id;
    }
  }

  // Handle ties: current holder keeps it
  if (longestPlayerId && longestLength > (state.longestRoad.length || 4)) {
    state.longestRoad = { playerId: longestPlayerId, length: longestLength };
  } else if (state.longestRoad.playerId) {
    // Check if current holder still qualifies
    const holder = state.players.find(p => p.id === state.longestRoad.playerId);
    if (holder) {
      const holderLength = calculateLongestRoad(state.board, holder.id);
      if (holderLength < 5) {
        // Lost the longest road - find new holder
        state.longestRoad = { playerId: longestPlayerId, length: longestLength > 4 ? longestLength : 0 };
      }
    }
  }
}
