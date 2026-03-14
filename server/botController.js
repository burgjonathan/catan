import * as gameEngine from './gameEngine.js';
import * as strategy from './botStrategy.js';
import { BOT_ACTION_DELAYS } from '../shared/constants.js';
import { S2C } from '../shared/protocol.js';

function sanitizeStateForPlayer(state, playerId) {
  return {
    ...state,
    players: state.players.map(p => {
      if (p.id === playerId) return p;
      return {
        ...p,
        resources: undefined,
        resourceCount: Object.values(p.resources).reduce((a, b) => a + b, 0),
        devCards: undefined,
        newDevCards: undefined,
        devCardCount: p.devCards.length + p.newDevCards.length,
      };
    }),
    devCardDeck: undefined,
    devCardDeckCount: state.devCardDeck.length,
    bank: state.bank
  };
}

function broadcastGameState(io, room, state) {
  for (const player of room.players) {
    if (player.isBot) continue;
    const sanitized = sanitizeStateForPlayer(state, player.id);
    io.to(player.id).emit(S2C.GAME_STATE, sanitized);
  }
}

function broadcastGameOver(io, room, state, winnerId) {
  state.phase = 'finished';
  const winnerPlayer = state.players.find(p => p.id === winnerId);
  for (const player of room.players) {
    if (player.isBot) continue;
    io.to(player.id).emit(S2C.GAME_OVER, {
      winner: { id: winnerPlayer.id, name: winnerPlayer.name, color: winnerPlayer.color },
      finalState: sanitizeStateForPlayer(state, player.id)
    });
  }
}

function emitDiceResult(io, room, dice) {
  for (const player of room.players) {
    if (player.isBot) continue;
    io.to(player.id).emit(S2C.DICE_RESULT, dice);
  }
}

function executeAndBroadcast(io, room, actionFn) {
  const state = room.gameState;
  try {
    const result = actionFn(state);

    const winner = gameEngine.checkWinner(state);
    if (winner) {
      broadcastGameOver(io, room, state, winner);
      return { result, finished: true };
    }

    broadcastGameState(io, room, state);
    return { result, finished: false };
  } catch (err) {
    console.error('Bot action error:', err.message);
    return { result: null, finished: false, error: err };
  }
}

function getBotPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

function isBot(room, playerId) {
  const player = room.players.find(p => p.id === playerId);
  return player && player.isBot;
}

function getDifficulty(room, playerId) {
  const player = room.players.find(p => p.id === playerId);
  return player ? player.difficulty : 'medium';
}

function scheduleAction(io, room, delay, actionFn) {
  if (!room.gameState || room.gameState.phase === 'finished') return;
  room.botActionPending = true;

  setTimeout(() => {
    room.botActionPending = false;
    if (!room.gameState || room.gameState.phase === 'finished') return;
    actionFn();
  }, delay);
}

export function checkAndRunBot(io, roomCode, room) {
  if (!room || !room.gameState || room.gameState.phase === 'finished') return;
  if (room.botActionPending) return;

  const state = room.gameState;
  const phase = state.phase;

  // Handle discard phase: any bot in discardPending should discard
  if (phase === 'discard' && state.discardPending.length > 0) {
    const botToDiscard = state.discardPending.find(pid => isBot(room, pid));
    if (botToDiscard) {
      const diff = getDifficulty(room, botToDiscard);
      scheduleAction(io, room, BOT_ACTION_DELAYS.discard, () => {
        const resources = strategy.chooseDiscard(state, botToDiscard, diff);
        executeAndBroadcast(io, room, (s) => gameEngine.discardResources(s, botToDiscard, resources));
        checkAndRunBot(io, roomCode, room);
      });
      return;
    }
    // Only humans left to discard, wait for them
    return;
  }

  // All other phases: only act if current player is a bot
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || !isBot(room, currentPlayer.id)) return;

  const botId = currentPlayer.id;
  const diff = getDifficulty(room, botId);

  if (phase === 'setup1' || phase === 'setup2') {
    if (!state.setupPlacedSettlement) {
      // Place settlement
      scheduleAction(io, room, BOT_ACTION_DELAYS.setup, () => {
        const vKey = strategy.chooseSetupSettlement(state, botId, diff);
        if (vKey) {
          executeAndBroadcast(io, room, (s) => gameEngine.placeInitialSettlement(s, botId, vKey));
        }
        checkAndRunBot(io, roomCode, room);
      });
    } else {
      // Place road
      scheduleAction(io, room, BOT_ACTION_DELAYS.setup, () => {
        const eKey = strategy.chooseSetupRoad(state, botId, diff);
        if (eKey) {
          executeAndBroadcast(io, room, (s) => gameEngine.placeInitialRoad(s, botId, eKey));
        }
        checkAndRunBot(io, roomCode, room);
      });
    }
    return;
  }

  if (phase === 'roll') {
    scheduleAction(io, room, BOT_ACTION_DELAYS.roll, () => {
      const result = executeAndBroadcast(io, room, (s) => gameEngine.rollDice(s, botId));
      if (result.result && result.result.dice) {
        emitDiceResult(io, room, result.result.dice);
      }
      if (!result.finished) {
        checkAndRunBot(io, roomCode, room);
      }
    });
    return;
  }

  if (phase === 'main') {
    // Get the list of actions to perform, then execute them sequentially with delays
    const actionList = strategy.chooseMainPhaseActions(state, botId, diff);
    executeMainActions(io, room, roomCode, botId, actionList, 0);
    return;
  }

  if (phase === 'robber') {
    scheduleAction(io, room, BOT_ACTION_DELAYS.robber, () => {
      const hex = strategy.chooseRobberHex(state, botId, diff);
      executeAndBroadcast(io, room, (s) => gameEngine.moveRobber(s, botId, hex.q, hex.r));
      checkAndRunBot(io, roomCode, room);
    });
    return;
  }

  if (phase === 'steal') {
    scheduleAction(io, room, BOT_ACTION_DELAYS.steal, () => {
      const targetId = strategy.chooseStealTarget(state, botId, diff);
      if (targetId) {
        executeAndBroadcast(io, room, (s) => gameEngine.stealResource(s, botId, targetId));
      }
      checkAndRunBot(io, roomCode, room);
    });
    return;
  }

  if (phase === 'roadBuilding') {
    scheduleAction(io, room, BOT_ACTION_DELAYS.build, () => {
      const eKey = strategy.chooseRoadBuildingRoad(state, botId, diff);
      if (eKey) {
        executeAndBroadcast(io, room, (s) => gameEngine.buildRoad(s, botId, eKey));
      } else {
        // No valid road spots, end road building
        state.roadBuildingRemaining = 0;
        state.phase = 'main';
        broadcastGameState(io, room, state);
      }
      checkAndRunBot(io, roomCode, room);
    });
    return;
  }
}

function executeMainActions(io, room, roomCode, botId, actionList, index) {
  if (!room.gameState || room.gameState.phase === 'finished') return;
  if (index >= actionList.length) return;

  const { action, params } = actionList[index];
  const delay = action === 'endTurn' ? BOT_ACTION_DELAYS.endTurn : BOT_ACTION_DELAYS.build;

  scheduleAction(io, room, delay, () => {
    const state = room.gameState;
    if (!state || state.phase === 'finished') return;

    let result;
    try {
      switch (action) {
        case 'buildCity':
          result = executeAndBroadcast(io, room, (s) => gameEngine.buildCity(s, botId, params.vertexKey));
          break;
        case 'buildSettlement':
          result = executeAndBroadcast(io, room, (s) => gameEngine.buildSettlement(s, botId, params.vertexKey));
          break;
        case 'buildRoad':
          result = executeAndBroadcast(io, room, (s) => gameEngine.buildRoad(s, botId, params.edgeKey));
          break;
        case 'buyDevCard':
          result = executeAndBroadcast(io, room, (s) => gameEngine.buyDevCard(s, botId));
          break;
        case 'playDevCard':
          result = executeAndBroadcast(io, room, (s) => gameEngine.playDevCard(s, botId, params.cardType, params));
          // After playing knight or road building, phase changes — let checkAndRunBot handle it
          if (params.cardType === 'knight' || params.cardType === 'roadBuilding') {
            checkAndRunBot(io, roomCode, room);
            return;
          }
          break;
        case 'tradeWithBank':
          result = executeAndBroadcast(io, room, (s) => gameEngine.tradeWithBank(s, botId, params.givingResource, params.givingAmount, params.receivingResource));
          break;
        case 'endTurn':
          result = executeAndBroadcast(io, room, (s) => gameEngine.endTurn(s, botId));
          if (result && !result.finished) {
            checkAndRunBot(io, roomCode, room);
          }
          return;
        default:
          break;
      }
    } catch (err) {
      console.error(`Bot action ${action} failed:`, err.message);
    }

    if (result && result.finished) return;

    // Continue to next action
    executeMainActions(io, room, roomCode, botId, actionList, index + 1);
  });
}
