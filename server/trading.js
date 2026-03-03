import { v4 as uuidv4 } from 'uuid';
import { RESOURCES } from '../shared/constants.js';

export function createTradeOffer(state, fromId, offering, requesting) {
  const fromPlayer = state.players.find(p => p.id === fromId);

  // Validate the offering player has enough resources
  for (const [resource, amount] of Object.entries(offering)) {
    if ((fromPlayer.resources[resource] || 0) < amount) {
      throw new Error(`Not enough ${resource} to offer`);
    }
  }

  const responses = {};
  for (const p of state.players) {
    if (p.id !== fromId) responses[p.id] = 'pending';
  }

  state.pendingTrade = {
    id: uuidv4(),
    from: fromId,
    fromName: fromPlayer.name,
    offering,
    requesting,
    responses
  };
  return state;
}

export function acceptTrade(state, acceptingPlayerId) {
  const trade = state.pendingTrade;
  if (!trade) throw new Error('No pending trade');

  const from = state.players.find(p => p.id === trade.from);
  const acceptor = state.players.find(p => p.id === acceptingPlayerId);

  // Validate both sides can still afford it
  for (const [resource, amount] of Object.entries(trade.offering)) {
    if ((from.resources[resource] || 0) < amount) throw new Error('Offerer can no longer afford trade');
  }
  for (const [resource, amount] of Object.entries(trade.requesting)) {
    if ((acceptor.resources[resource] || 0) < amount) throw new Error('You cannot afford this trade');
  }

  // Execute trade
  for (const resource of RESOURCES) {
    const give = trade.offering[resource] || 0;
    const receive = trade.requesting[resource] || 0;
    from.resources[resource] -= give;
    from.resources[resource] += receive;
    acceptor.resources[resource] += give;
    acceptor.resources[resource] -= receive;
  }

  state.pendingTrade = null;
  return state;
}

export function rejectTrade(state, rejectingPlayerId) {
  const trade = state.pendingTrade;
  if (!trade) throw new Error('No pending trade');

  trade.responses[rejectingPlayerId] = 'rejected';

  // If all rejected, clear
  const allRejected = Object.values(trade.responses).every(r => r === 'rejected');
  if (allRejected) {
    state.pendingTrade = null;
  }
  return state;
}

export function cancelTrade(state) {
  state.pendingTrade = null;
  return state;
}

export function bankTrade(state, playerId, givingResource, givingAmount, receivingResource) {
  const player = state.players.find(p => p.id === playerId);

  // Determine trade ratio
  let ratio = 4; // default
  for (const port of state.board.ports) {
    const hasPort = port.vertexKeys.some(vKey => {
      const v = state.board.vertices[vKey];
      return v && v.ownerId === playerId;
    });
    if (hasPort) {
      if (port.type === '3:1') ratio = Math.min(ratio, 3);
      else if (port.type === givingResource) ratio = Math.min(ratio, 2);
    }
  }

  if (givingAmount !== ratio) throw new Error(`Must give exactly ${ratio} of that resource`);
  if (player.resources[givingResource] < ratio) throw new Error('Not enough resources');
  if (state.bank[receivingResource] < 1) throw new Error('Bank has no more of that resource');

  player.resources[givingResource] -= ratio;
  state.bank[givingResource] += ratio;
  player.resources[receivingResource] += 1;
  state.bank[receivingResource] -= 1;

  return state;
}
