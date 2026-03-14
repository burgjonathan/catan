import { getVerticesForHex, hexPositionsForRadius } from '../shared/hexGeometry.js';
import { totalResources } from './bank.js';

export function getPlayersToStealFrom(state, hexQ, hexR, currentPlayerId) {
  const hexPositions = hexPositionsForRadius(state.board.boardRadius || 2);
  const vertexKeys = getVerticesForHex(hexQ, hexR, hexPositions);
  const targets = new Set();

  for (const vKey of vertexKeys) {
    const vertex = state.board.vertices[vKey];
    if (vertex && vertex.ownerId && vertex.ownerId !== currentPlayerId) {
      const targetPlayer = state.players.find(p => p.id === vertex.ownerId);
      if (targetPlayer && totalResources(targetPlayer) > 0) {
        targets.add(vertex.ownerId);
      }
    }
  }
  return Array.from(targets);
}

export function stealRandomResource(fromPlayer) {
  const available = [];
  for (const [resource, count] of Object.entries(fromPlayer.resources)) {
    for (let i = 0; i < count; i++) {
      available.push(resource);
    }
  }
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getPlayersWhoMustDiscard(state) {
  return state.players
    .filter(p => totalResources(p) > 7)
    .map(p => p.id);
}
