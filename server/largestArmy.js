export function updateLargestArmy(state) {
  let largestPlayerId = null;
  let largestCount = 2; // Minimum 3 knights to earn

  for (const player of state.players) {
    if (player.playedKnights > largestCount) {
      largestCount = player.playedKnights;
      largestPlayerId = player.id;
    }
  }

  if (largestPlayerId && largestCount > (state.largestArmy.count || 2)) {
    state.largestArmy = { playerId: largestPlayerId, count: largestCount };
  }
}
