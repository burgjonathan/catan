import { C2S, S2C } from '../shared/protocol.js';
import * as roomManager from './roomManager.js';
import * as gameEngine from './gameEngine.js';
import * as friendsManager from './friendsManager.js';
import * as achievements from './achievements.js';
import { trackConnect, trackDisconnect, trackGameStart } from './analytics.js';
import { checkAndRunBot } from './botController.js';

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

function sanitizeStateForSpectator(state) {
  return {
    ...state,
    players: state.players.map(p => ({
      ...p,
      resources: undefined,
      resourceCount: Object.values(p.resources).reduce((a, b) => a + b, 0),
      devCards: undefined,
      newDevCards: undefined,
      devCardCount: p.devCards.length + p.newDevCards.length,
    })),
    devCardDeck: undefined,
    devCardDeckCount: state.devCardDeck.length,
    bank: state.bank
  };
}

function broadcastGameState(io, roomCode, state) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  for (const player of room.players) {
    const sanitized = sanitizeStateForPlayer(state, player.id);
    io.to(player.id).emit(S2C.GAME_STATE, sanitized);
  }
  // Broadcast to spectators
  if (room.spectators && room.spectators.length > 0) {
    const spectatorState = sanitizeStateForSpectator(state);
    for (const spectator of room.spectators) {
      io.to(spectator.id).emit(S2C.GAME_STATE, spectatorState);
    }
  }
}

// Trade timeout timers per room (auto-reject after 30s)
const tradeTimers = new Map();

function clearTradeTimer(roomCode) {
  if (tradeTimers.has(roomCode)) {
    clearTimeout(tradeTimers.get(roomCode));
    tradeTimers.delete(roomCode);
  }
}

// Store the previous state snapshot per room for undo
const undoSnapshots = new Map(); // roomCode -> { snapshot, actionPlayerId, actionPlayerName, actionDesc }
// Store pending undo votes per room
const pendingUndos = new Map(); // roomCode -> { requesterId, requesterName, votes: { playerId: 'pending'|'accepted'|'rejected' } }

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function describeAction(actionName) {
  const names = {
    rollDice: 'roll dice',
    buildSettlement: 'build a settlement',
    buildCity: 'build a city',
    buildRoad: 'build a road',
    buyDevCard: 'buy a development card',
    playDevCard: 'play a development card',
    endTurn: 'end turn',
    moveRobber: 'move the robber',
    stealResource: 'steal a resource',
    discardResources: 'discard resources',
    tradeOffer: 'offer a trade',
    tradeAccept: 'accept a trade',
    tradeReject: 'reject a trade',
    tradeCancel: 'cancel a trade',
    tradeWithBank: 'trade with bank',
    placeInitialSettlement: 'place a settlement',
    placeInitialRoad: 'place a road',
  };
  return names[actionName] || actionName;
}

function handleGameAction(io, socket, roomCode, actionFn, actionName) {
  try {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.gameState) throw new Error('No active game');

    // Snapshot state before action for undo
    const snapshot = deepClone(room.gameState);

    const result = actionFn(room.gameState);
    const state = result && result.state ? result.state : room.gameState;
    roomManager.updateGameState(roomCode, state);

    // Save snapshot (only for non-finished games)
    if (state.phase !== 'finished') {
      const player = state.players.find(p => p.id === socket.id);
      undoSnapshots.set(roomCode, {
        snapshot,
        actionPlayerId: socket.id,
        actionPlayerName: player?.name || 'Unknown',
        actionDesc: describeAction(actionName),
      });
      // Clear any pending undo vote when a new action happens
      pendingUndos.delete(roomCode);
    }

    // Check for winner
    const winner = gameEngine.checkWinner(state);
    if (winner) {
      state.phase = 'finished';
      const winnerPlayer = state.players.find(p => p.id === winner);
      for (const player of room.players) {
        io.to(player.id).emit(S2C.GAME_OVER, {
          winner: { id: winnerPlayer.id, name: winnerPlayer.name, color: winnerPlayer.color },
          finalState: sanitizeStateForPlayer(state, player.id)
        });
      }
      // Check achievements for each human player
      for (const player of room.players) {
        if (!player.isBot && player.sessionId) {
          const newAchievements = achievements.checkAchievements(state, player.sessionId, player.id);
          if (newAchievements.length > 0) {
            io.to(player.id).emit(S2C.ACHIEVEMENTS_UNLOCKED, { achievements: newAchievements });
          }
        }
      }
      // Notify spectators
      if (room.spectators && room.spectators.length > 0) {
        const spectatorState = sanitizeStateForSpectator(state);
        for (const spectator of room.spectators) {
          io.to(spectator.id).emit(S2C.GAME_OVER, {
            winner: { id: winnerPlayer.id, name: winnerPlayer.name, color: winnerPlayer.color },
            finalState: spectatorState
          });
        }
      }
      return result;
    }

    broadcastGameState(io, roomCode, state);

    // Trigger bot actions if needed
    checkAndRunBot(io, roomCode, room);

    return result;
  } catch (err) {
    socket.emit(S2C.GAME_ERROR, { message: err.message });
    return null;
  }
}

function notifyLobbyBrowsers(io) {
  const rooms = roomManager.getPublicRooms();
  io.to('lobby:browser').emit(S2C.PUBLIC_ROOM_LIST, { rooms });
}

function autoStartIfFull(io, code) {
  const room = roomManager.getRoom(code);
  if (!room || !room.isPublic || room.status !== 'waiting' || room.players.length < 4) return;
  const expansion = room.players.length > 4;
  const gameState = gameEngine.createGame(room.players, expansion);
  roomManager.setGameState(code, gameState);
  for (const p of room.players) {
    if (p.sessionId) trackGameStart(p.sessionId);
  }
  broadcastGameState(io, code, gameState);
  notifyLobbyBrowsers(io);
  checkAndRunBot(io, code, room);
}

function notifyFriendsStatus(io, sessionId, online) {
  const onlineFriends = friendsManager.getOnlineFriendSessionIds(sessionId);
  const name = friendsManager.getFriendCode(sessionId); // just for the event
  for (const friendSessionId of onlineFriends) {
    const friendSocketId = friendsManager.getOnlineSocketId(friendSessionId);
    if (friendSocketId) {
      const event = online ? S2C.FRIEND_ONLINE : S2C.FRIEND_OFFLINE;
      io.to(friendSocketId).emit(event, { sessionId });
    }
  }
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Track analytics
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const userAgent = socket.handshake.headers['user-agent'] || '';
    const sessionIdFromQuery = socket.handshake.auth?.sessionId || 'unknown';
    trackConnect(socket.id, sessionIdFromQuery, ip, userAgent);

    // Track online presence for friends
    if (sessionIdFromQuery && sessionIdFromQuery !== 'unknown') {
      friendsManager.setOnline(sessionIdFromQuery, socket.id);
      notifyFriendsStatus(io, sessionIdFromQuery, true);
    }

    // ---- ROOM EVENTS ----

    socket.on(C2S.CREATE_ROOM, ({ playerName, sessionId }) => {
      try {
        const { code, room } = roomManager.createRoom(socket.id, playerName, sessionId);
        socket.join(code);
        socket.emit(S2C.ROOM_CREATED, {
          code,
          playerId: socket.id,
          players: room.players
        });
      } catch (err) {
        socket.emit(S2C.ROOM_ERROR, { message: err.message });
      }
    });

    socket.on(C2S.JOIN_ROOM, ({ code, playerName, sessionId }) => {
      try {
        const upperCode = code.toUpperCase();
        const { room } = roomManager.joinRoom(upperCode, socket.id, playerName, sessionId);
        socket.join(upperCode);
        socket.leave('lobby:browser');
        socket.emit(S2C.ROOM_JOINED, {
          code: upperCode,
          playerId: socket.id,
          players: room.players
        });
        socket.to(upperCode).emit(S2C.ROOM_UPDATED, { players: room.players });
        notifyLobbyBrowsers(io);
        autoStartIfFull(io, upperCode);
      } catch (err) {
        socket.emit(S2C.ROOM_ERROR, { message: err.message });
      }
    });

    socket.on(C2S.LEAVE_ROOM, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      const { code, room: foundRoom } = found;
      const player = foundRoom.players.find(p => p.id === socket.id);
      if (player) {
        roomManager.cancelDisconnectTimer(player.sessionId);
      }
      const { room, isEmpty } = roomManager.leaveRoom(code, socket.id);
      socket.leave(code);
      if (!isEmpty && room) {
        io.to(code).emit(S2C.ROOM_UPDATED, { players: room.players });
      }
      notifyLobbyBrowsers(io);
    });

    socket.on(C2S.START_GAME, () => {
      try {
        const found = roomManager.getRoomBySocket(socket.id);
        if (!found) return socket.emit(S2C.GAME_ERROR, { message: 'Not in a room' });
        const { code, room } = found;
        if (room.hostId !== socket.id) return socket.emit(S2C.GAME_ERROR, { message: 'Only host can start' });
        if (room.players.length < 2) return socket.emit(S2C.GAME_ERROR, { message: 'Need at least 2 players' });

        const expansion = room.players.length > 4;
        const gameState = gameEngine.createGame(room.players, expansion);
        roomManager.setGameState(code, gameState);
        // Track game start for all players
        for (const p of room.players) {
          if (p.sessionId) trackGameStart(p.sessionId);
        }
        broadcastGameState(io, code, gameState);
        notifyLobbyBrowsers(io);
        checkAndRunBot(io, code, room);
      } catch (err) {
        socket.emit(S2C.GAME_ERROR, { message: err.message });
      }
    });

    socket.on(C2S.CREATE_BOT_GAME, ({ playerName, sessionId, botCount, difficulty }) => {
      try {
        if (!playerName || !playerName.trim()) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Player name is required' });
        }
        if (!botCount || botCount < 1 || botCount > 5) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Bot count must be 1-5' });
        }
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Invalid difficulty' });
        }

        // Create room with human player
        const { code, room } = roomManager.createRoom(socket.id, playerName.trim(), sessionId);
        socket.join(code);

        // Add bots
        roomManager.addBotsToRoom(code, botCount, difficulty);

        // Emit room created so client transitions
        socket.emit(S2C.ROOM_CREATED, {
          code,
          playerId: socket.id,
          players: room.players
        });

        // Start game immediately - use expansion board for 5-6 players
        const expansion = room.players.length > 4;
        const gameState = gameEngine.createGame(room.players, expansion);
        roomManager.setGameState(code, gameState);
        if (sessionId) trackGameStart(sessionId);
        broadcastGameState(io, code, gameState);

        // Kick off bot turns
        checkAndRunBot(io, code, room);
      } catch (err) {
        socket.emit(S2C.ROOM_ERROR, { message: err.message });
      }
    });

    // ---- PUBLIC ROOMS / LOBBY BROWSER ----

    socket.on(C2S.CREATE_PUBLIC_ROOM, ({ playerName, sessionId }) => {
      try {
        if (roomManager.getRoomBySocket(socket.id)) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Already in a room' });
        }
        const { code, room } = roomManager.createPublicRoom(socket.id, playerName.trim(), sessionId);
        socket.join(code);
        socket.leave('lobby:browser');
        socket.emit(S2C.ROOM_CREATED, {
          code,
          playerId: socket.id,
          players: room.players,
          isPublic: true
        });
        notifyLobbyBrowsers(io);
      } catch (err) {
        socket.emit(S2C.ROOM_ERROR, { message: err.message });
      }
    });

    socket.on(C2S.BROWSE_ROOMS, () => {
      socket.join('lobby:browser');
      const rooms = roomManager.getPublicRooms();
      socket.emit(S2C.PUBLIC_ROOM_LIST, { rooms });
    });

    socket.on(C2S.STOP_BROWSING, () => {
      socket.leave('lobby:browser');
    });

    socket.on(C2S.QUICK_PLAY, ({ playerName, sessionId }) => {
      try {
        if (!playerName || !playerName.trim()) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Player name is required' });
        }
        if (roomManager.getRoomBySocket(socket.id)) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Already in a room' });
        }
        const available = roomManager.findAvailablePublicRoom();
        if (available) {
          const { room } = roomManager.joinRoom(available.code, socket.id, playerName.trim(), sessionId);
          socket.join(available.code);
          socket.leave('lobby:browser');
          socket.emit(S2C.ROOM_JOINED, {
            code: available.code,
            playerId: socket.id,
            players: room.players,
            isPublic: true
          });
          socket.to(available.code).emit(S2C.ROOM_UPDATED, { players: room.players });
          notifyLobbyBrowsers(io);
          autoStartIfFull(io, available.code);
        } else {
          const { code, room } = roomManager.createPublicRoom(socket.id, playerName.trim(), sessionId);
          socket.join(code);
          socket.leave('lobby:browser');
          socket.emit(S2C.ROOM_CREATED, {
            code,
            playerId: socket.id,
            players: room.players,
            isPublic: true
          });
          notifyLobbyBrowsers(io);
        }
      } catch (err) {
        socket.emit(S2C.ROOM_ERROR, { message: err.message });
      }
    });

    // ---- REJOIN ----

    socket.on(C2S.REJOIN, ({ sessionId }) => {
      if (!sessionId) return;
      // Update analytics with real session ID
      trackConnect(socket.id, sessionId, ip, userAgent);
      // Update friends presence
      friendsManager.setOnline(sessionId, socket.id);
      notifyFriendsStatus(io, sessionId, true);
      const result = roomManager.reconnectPlayer(sessionId, socket.id);
      if (!result) return; // No session to rejoin

      const { code, room } = result;
      socket.join(code);
      console.log(`Player reconnected: ${socket.id} (session: ${sessionId}) to room ${code}`);

      if (room.gameState) {
        // Game in progress — send game state
        const sanitized = sanitizeStateForPlayer(room.gameState, socket.id);
        socket.emit(S2C.REJOIN_SUCCESS, {
          code,
          playerId: socket.id,
          players: room.players,
          isPublic: room.isPublic || false,
          gameState: sanitized
        });
      } else {
        // Still in waiting room
        socket.emit(S2C.REJOIN_SUCCESS, {
          code,
          playerId: socket.id,
          players: room.players,
          isPublic: room.isPublic || false,
          gameState: null
        });
      }

      // Notify other players
      socket.to(code).emit(S2C.ROOM_UPDATED, { players: room.players });
      notifyLobbyBrowsers(io);
    });

    // ---- SPECTATOR ----

    socket.on(C2S.SPECTATE_RANDOM, ({ spectatorName }) => {
      try {
        const found = roomManager.findSpectatableRoom();
        if (!found) return socket.emit(S2C.SPECTATE_ERROR, { message: 'No active games to watch right now' });

        const { code, room } = found;
        roomManager.addSpectator(code, socket.id, spectatorName || 'Spectator');
        socket.join(code);

        const spectatorState = sanitizeStateForSpectator(room.gameState);
        socket.emit(S2C.SPECTATE_JOINED, {
          code,
          players: room.players,
          gameState: spectatorState,
          spectatorCount: room.spectators ? room.spectators.length : 0
        });
      } catch (err) {
        socket.emit(S2C.SPECTATE_ERROR, { message: err.message });
      }
    });

    socket.on(C2S.LEAVE_SPECTATE, () => {
      const found = roomManager.getRoomBySpectator(socket.id);
      if (!found) return;
      roomManager.removeSpectator(found.code, socket.id);
      socket.leave(found.code);
    });

    // ---- REMATCH ----

    socket.on(C2S.REMATCH, () => {
      try {
        const found = roomManager.getRoomBySocket(socket.id);
        if (!found) return socket.emit(S2C.GAME_ERROR, { message: 'Not in a room' });
        const { code, room } = found;
        if (!room.gameState || room.gameState.phase !== 'finished') {
          return socket.emit(S2C.GAME_ERROR, { message: 'Game is not finished' });
        }
        if (room.players.length < 2) {
          return socket.emit(S2C.GAME_ERROR, { message: 'Need at least 2 players' });
        }

        const expansion = room.players.length > 4;
        const gameState = gameEngine.createGame(room.players, expansion);
        roomManager.setGameState(code, gameState);
        broadcastGameState(io, code, gameState);
        checkAndRunBot(io, code, room);
      } catch (err) {
        socket.emit(S2C.GAME_ERROR, { message: err.message });
      }
    });

    // ---- GAME ACTIONS ----

    socket.on(C2S.ROLL_DICE, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      const result = handleGameAction(io, socket, found.code, (state) => {
        return gameEngine.rollDice(state, socket.id);
      }, 'rollDice');
      if (result && result.dice) {
        io.to(found.code).emit(S2C.DICE_RESULT, result.dice);
      }
    });

    socket.on(C2S.BUILD_SETTLEMENT, ({ vertexKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.buildSettlement(state, socket.id, vertexKey);
      }, 'buildSettlement');
    });

    socket.on(C2S.BUILD_CITY, ({ vertexKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.buildCity(state, socket.id, vertexKey);
      }, 'buildCity');
    });

    socket.on(C2S.BUILD_ROAD, ({ edgeKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.buildRoad(state, socket.id, edgeKey);
      }, 'buildRoad');
    });

    socket.on(C2S.BUY_DEV_CARD, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.buyDevCard(state, socket.id);
      }, 'buyDevCard');
    });

    socket.on(C2S.PLAY_DEV_CARD, ({ cardType, params }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.playDevCard(state, socket.id, cardType, params || {});
      }, 'playDevCard');
    });

    socket.on(C2S.END_TURN, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.endTurn(state, socket.id);
      }, 'endTurn');
    });

    socket.on(C2S.MOVE_ROBBER, ({ q, r }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.moveRobber(state, socket.id, q, r);
      }, 'moveRobber');
    });

    socket.on(C2S.STEAL_RESOURCE, ({ targetId }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.stealResource(state, socket.id, targetId);
      }, 'stealResource');
    });

    socket.on(C2S.DISCARD_RESOURCES, ({ resources }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.discardResources(state, socket.id, resources);
      }, 'discardResources');
    });

    socket.on(C2S.PLACE_INITIAL_SETTLEMENT, ({ vertexKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.placeInitialSettlement(state, socket.id, vertexKey);
      }, 'placeInitialSettlement');
    });

    socket.on(C2S.PLACE_INITIAL_ROAD, ({ edgeKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.placeInitialRoad(state, socket.id, edgeKey);
      }, 'placeInitialRoad');
    });

    // ---- TRADING ----

    socket.on(C2S.TRADE_OFFER, ({ offering, requesting }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeOffer(state, socket.id, offering, requesting);
        // Auto-reject trade for all bots
        if (state.pendingTrade) {
          for (const p of state.players) {
            if (p.isBot && state.pendingTrade.responses[p.id] === 'pending') {
              state.pendingTrade.responses[p.id] = 'rejected';
            }
          }
          // If all rejected (all opponents are bots), clear the trade
          const allRejected = Object.values(state.pendingTrade.responses).every(r => r === 'rejected');
          if (allRejected) {
            state.pendingTrade = null;
          }
        }
      }, 'tradeOffer');

      // Start 30s auto-reject timer for pending trades
      if (found.room?.gameState?.pendingTrade) {
        clearTradeTimer(found.code);
        const code = found.code;
        tradeTimers.set(code, setTimeout(() => {
          tradeTimers.delete(code);
          const room = roomManager.getRoom(code);
          if (!room || !room.gameState?.pendingTrade) return;
          // Auto-reject for all pending players
          const trade = room.gameState.pendingTrade;
          for (const [pid, response] of Object.entries(trade.responses)) {
            if (response === 'pending') {
              trade.responses[pid] = 'rejected';
            }
          }
          room.gameState.pendingTrade = null;
          broadcastGameState(io, code, room.gameState);
        }, 30000));
      }
    });

    socket.on(C2S.TRADE_ACCEPT, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      clearTradeTimer(found.code);
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeAccept(state, socket.id);
      }, 'tradeAccept');
    });

    socket.on(C2S.TRADE_REJECT, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeReject(state, socket.id);
      }, 'tradeReject');
      // Clear timer if trade fully resolved
      const room = roomManager.getRoom(found.code);
      if (room && !room.gameState?.pendingTrade) {
        clearTradeTimer(found.code);
      }
    });

    socket.on(C2S.TRADE_CANCEL, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      clearTradeTimer(found.code);
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeCancel(state, socket.id);
      }, 'tradeCancel');
    });

    socket.on(C2S.TRADE_WITH_BANK, ({ givingResource, givingAmount, receivingResource }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeWithBank(state, socket.id, givingResource, givingAmount, receivingResource);
      }, 'tradeWithBank');
    });

    // ---- UNDO ----

    socket.on(C2S.UNDO_REQUEST, () => {
      try {
        const found = roomManager.getRoomBySocket(socket.id);
        if (!found) return;
        const { code, room } = found;

        if (pendingUndos.has(code)) {
          return socket.emit(S2C.GAME_ERROR, { message: 'An undo vote is already in progress' });
        }

        const undoData = undoSnapshots.get(code);
        if (!undoData) {
          return socket.emit(S2C.GAME_ERROR, { message: 'Nothing to undo' });
        }

        const requester = room.players.find(p => p.id === socket.id);
        const votes = {};
        // The requester auto-accepts, everyone else must vote
        for (const p of room.players) {
          if (p.id === socket.id) {
            votes[p.id] = 'accepted';
          } else if (p.isBot) {
            votes[p.id] = 'accepted'; // Bots auto-accept
          } else {
            votes[p.id] = 'pending';
          }
        }

        const pending = {
          requesterId: socket.id,
          requesterName: requester?.name || 'Unknown',
          actionPlayerName: undoData.actionPlayerName,
          actionDesc: undoData.actionDesc,
          votes,
        };
        pendingUndos.set(code, pending);

        // Check if already resolved (e.g. solo with bots)
        const allVoted = Object.values(votes).every(v => v !== 'pending');
        if (allVoted) {
          const allAccepted = Object.values(votes).every(v => v === 'accepted');
          if (allAccepted) {
            // Restore snapshot
            const restored = deepClone(undoData.snapshot);
            room.gameState = restored;
            roomManager.updateGameState(code, restored);
            undoSnapshots.delete(code);
            pendingUndos.delete(code);
            for (const p of room.players) {
              io.to(p.id).emit(S2C.UNDO_RESOLVED, { accepted: true });
            }
            broadcastGameState(io, code, restored);
            checkAndRunBot(io, code, room);
            return;
          }
        }

        // Notify all players about the undo request
        for (const p of room.players) {
          if (!p.isBot) {
            io.to(p.id).emit(S2C.UNDO_REQUESTED, {
              requesterId: socket.id,
              requesterName: requester?.name || 'Unknown',
              actionPlayerName: undoData.actionPlayerName,
              actionDesc: undoData.actionDesc,
              votes,
            });
          }
        }
      } catch (err) {
        socket.emit(S2C.GAME_ERROR, { message: err.message });
      }
    });

    socket.on(C2S.UNDO_ACCEPT, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      const { code, room } = found;
      const pending = pendingUndos.get(code);
      if (!pending || pending.votes[socket.id] === undefined) return;

      pending.votes[socket.id] = 'accepted';

      // Check if all voted
      const allVoted = Object.values(pending.votes).every(v => v !== 'pending');
      if (!allVoted) {
        // Broadcast updated votes
        for (const p of room.players) {
          if (!p.isBot) {
            io.to(p.id).emit(S2C.UNDO_REQUESTED, { ...pending });
          }
        }
        return;
      }

      const allAccepted = Object.values(pending.votes).every(v => v === 'accepted');
      pendingUndos.delete(code);

      if (allAccepted) {
        const undoData = undoSnapshots.get(code);
        if (undoData) {
          const restored = deepClone(undoData.snapshot);
          room.gameState = restored;
          roomManager.updateGameState(code, restored);
          undoSnapshots.delete(code);
          for (const p of room.players) {
            io.to(p.id).emit(S2C.UNDO_RESOLVED, { accepted: true });
          }
          broadcastGameState(io, code, restored);
          checkAndRunBot(io, code, room);
        }
      } else {
        for (const p of room.players) {
          io.to(p.id).emit(S2C.UNDO_RESOLVED, { accepted: false });
        }
      }
    });

    socket.on(C2S.UNDO_REJECT, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      const { code, room } = found;
      const pending = pendingUndos.get(code);
      if (!pending || pending.votes[socket.id] === undefined) return;

      pending.votes[socket.id] = 'rejected';
      pendingUndos.delete(code);

      // Rejected — notify everyone
      for (const p of room.players) {
        if (!p.isBot) {
          io.to(p.id).emit(S2C.UNDO_RESOLVED, { accepted: false });
        }
      }
    });

    // ---- CHAT ----

    socket.on(C2S.CHAT_MESSAGE, ({ text }) => {
      // Check if sender is a player
      let found = roomManager.getRoomBySocket(socket.id);
      let senderName = 'Unknown';
      let senderColor = '#fff';
      if (found) {
        const player = found.room.players.find(p => p.id === socket.id);
        senderName = player ? player.name : 'Unknown';
        senderColor = player ? player.color : '#fff';
      } else {
        // Check if sender is a spectator
        found = roomManager.getRoomBySpectator(socket.id);
        if (!found) return;
        const spectator = found.room.spectators?.find(s => s.id === socket.id);
        senderName = spectator ? `${spectator.name} (spectator)` : 'Spectator';
        senderColor = '#999';
      }
      io.to(found.code).emit(S2C.CHAT_MESSAGE, {
        from: senderName,
        color: senderColor,
        text,
        timestamp: Date.now()
      });
    });

    // ---- FRIENDS ----

    socket.on(C2S.GET_FRIEND_CODE, ({ sessionId: sid, playerName }) => {
      if (!sid) return;
      const code = friendsManager.ensureFriendCode(sid, playerName);
      socket.emit(S2C.FRIEND_CODE, { friendCode: code });
    });

    socket.on(C2S.GET_FRIENDS, ({ sessionId: sid }) => {
      if (!sid) return;
      const friends = friendsManager.getFriendsList(sid);
      socket.emit(S2C.FRIENDS_LIST, { friends });
    });

    socket.on(C2S.ADD_FRIEND, ({ sessionId: sid, friendCode }) => {
      if (!sid || !friendCode) return;
      friendsManager.ensureFriendCode(sid);
      const result = friendsManager.addFriend(sid, friendCode.toUpperCase());
      if (result.error) {
        return socket.emit(S2C.FRIEND_ERROR, { message: result.error });
      }
      // Send updated list to both players
      socket.emit(S2C.FRIENDS_LIST, { friends: friendsManager.getFriendsList(sid) });
      const targetSocketId = friendsManager.getOnlineSocketId(result.targetSession);
      if (targetSocketId) {
        io.to(targetSocketId).emit(S2C.FRIENDS_LIST, {
          friends: friendsManager.getFriendsList(result.targetSession)
        });
      }
    });

    socket.on(C2S.REMOVE_FRIEND, ({ sessionId: sid, targetSession }) => {
      if (!sid || !targetSession) return;
      friendsManager.removeFriend(sid, targetSession);
      socket.emit(S2C.FRIENDS_LIST, { friends: friendsManager.getFriendsList(sid) });
      const targetSocketId = friendsManager.getOnlineSocketId(targetSession);
      if (targetSocketId) {
        io.to(targetSocketId).emit(S2C.FRIENDS_LIST, {
          friends: friendsManager.getFriendsList(targetSession)
        });
      }
    });

    socket.on(C2S.INVITE_FRIEND, ({ sessionId: sid, targetSession }) => {
      if (!sid || !targetSession) return;
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room) return socket.emit(S2C.FRIEND_ERROR, { message: 'Create or join a room first' });

      const targetSocketId = friendsManager.getOnlineSocketId(targetSession);
      if (!targetSocketId) {
        return socket.emit(S2C.FRIEND_ERROR, { message: 'Friend is offline' });
      }
      const player = room.room.players.find(p => p.id === socket.id);
      io.to(targetSocketId).emit(S2C.FRIEND_INVITE, {
        fromName: player?.name || 'A friend',
        fromSession: sid,
        roomCode: room.code,
      });
    });

    // ---- PROFILE ----

    socket.on(C2S.SET_PROFILE, ({ sessionId: sid, playerName, avatar }) => {
      if (!sid) return;
      const result = friendsManager.setProfile(sid, playerName, avatar);
      if (result.error) {
        return socket.emit(S2C.PROFILE_ERROR, { message: result.error, lockedUntil: result.lockedUntil });
      }
      socket.emit(S2C.PROFILE_DATA, friendsManager.getProfile(sid));
    });

    socket.on(C2S.GET_PROFILE, ({ sessionId: sid }) => {
      if (!sid) return;
      socket.emit(S2C.PROFILE_DATA, friendsManager.getProfile(sid));
    });

    // ---- ACHIEVEMENTS ----

    socket.on(C2S.GET_ACHIEVEMENTS, ({ sessionId: sid }) => {
      if (!sid) return;
      const list = achievements.getAchievements(sid);
      socket.emit(S2C.ACHIEVEMENTS_LIST, { achievements: list });
    });

    // ---- DISCONNECT ----

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      trackDisconnect(socket.id);

      // Track offline for friends
      const disconnectedSession = friendsManager.getSessionIdBySocketId(socket.id);
      if (disconnectedSession) {
        friendsManager.setOffline(disconnectedSession);
        notifyFriendsStatus(io, disconnectedSession, false);
      }

      // Clean up spectator if applicable
      const spectatorRoom = roomManager.getRoomBySpectator(socket.id);
      if (spectatorRoom) {
        roomManager.removeSpectator(spectatorRoom.code, socket.id);
      }

      const result = roomManager.markDisconnected(socket.id, (code, oldSocketId) => {
        // This runs after 30s timeout if player doesn't reconnect
        const { room, isEmpty } = roomManager.leaveRoom(code, oldSocketId);
        if (!isEmpty && room) {
          io.to(code).emit(S2C.ROOM_UPDATED, { players: room.players });
          io.to(code).emit(S2C.PLAYER_LEFT, { playerId: oldSocketId });
        }
        notifyLobbyBrowsers(io);
      });
      if (!result) {
        // Player wasn't in a room, nothing to do
        return;
      }
    });
  });
}
