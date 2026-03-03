import { VP_TO_WIN } from '../shared/constants.js';

export function calculateVP(state, playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { visible: 0, total: 0 };

  let visible = 0;
  visible += player.settlements.length; // 1 VP each
  visible += player.cities.length * 2;   // 2 VP each

  if (state.longestRoad.playerId === playerId) visible += 2;
  if (state.largestArmy.playerId === playerId) visible += 2;

  const vpCards = player.devCards.filter(c => c === 'victoryPoint').length
    + player.newDevCards.filter(c => c === 'victoryPoint').length;

  return { visible, total: visible + vpCards };
}

export function checkWinner(state) {
  // Current player checked first (they win on their turn)
  const currentPlayer = state.players[state.currentPlayerIndex];
  const { total } = calculateVP(state, currentPlayer.id);
  if (total >= VP_TO_WIN) return currentPlayer.id;

  // Also check all players (in case VP dev card was revealed)
  for (const player of state.players) {
    const { total: t } = calculateVP(state, player.id);
    if (t >= VP_TO_WIN) return player.id;
  }
  return null;
}
