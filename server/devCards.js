import { updateLargestArmy } from './largestArmy.js';
import { addResource } from './bank.js';

export function playKnight(state, playerId) {
  const player = state.players.find(p => p.id === playerId);
  player.playedKnights++;
  updateLargestArmy(state);
  state.phase = 'robber';
  return state;
}

export function playRoadBuilding(state, playerId) {
  state.roadBuildingRemaining = 2;
  state.phase = 'roadBuilding';
  return state;
}

export function playYearOfPlenty(state, playerId, resource1, resource2) {
  const player = state.players.find(p => p.id === playerId);
  addResource(player, state.bank, resource1, 1);
  addResource(player, state.bank, resource2, 1);
  return state;
}

export function playMonopoly(state, playerId, resource) {
  const player = state.players.find(p => p.id === playerId);
  let total = 0;
  for (const other of state.players) {
    if (other.id === playerId) continue;
    total += other.resources[resource];
    other.resources[resource] = 0;
  }
  player.resources[resource] += total;
  return state;
}
