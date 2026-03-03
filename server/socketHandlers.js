import { C2S, S2C } from '../shared/protocol.js';
import * as roomManager from './roomManager.js';
import * as gameEngine from './gameEngine.js';
import { setupSignaling } from './signalingRelay.js';

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

function broadcastGameState(io, roomCode, state) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  for (const player of room.players) {
    const sanitized = sanitizeStateForPlayer(state, player.id);
    io.to(player.id).emit(S2C.GAME_STATE, sanitized);
  }
}

function handleGameAction(io, socket, roomCode, actionFn) {
  try {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.gameState) throw new Error('No active game');

    const result = actionFn(room.gameState);
    const state = result && result.state ? result.state : room.gameState;
    roomManager.updateGameState(roomCode, state);

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
      return result;
    }

    broadcastGameState(io, roomCode, state);
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
  const gameState = gameEngine.createGame(room.players);
  roomManager.setGameState(code, gameState);
  broadcastGameState(io, code, gameState);
  notifyLobbyBrowsers(io);
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

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

        const gameState = gameEngine.createGame(room.players);
        roomManager.setGameState(code, gameState);
        broadcastGameState(io, code, gameState);
        notifyLobbyBrowsers(io);
      } catch (err) {
        socket.emit(S2C.GAME_ERROR, { message: err.message });
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

    // ---- GAME ACTIONS ----

    socket.on(C2S.ROLL_DICE, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      const result = handleGameAction(io, socket, found.code, (state) => {
        return gameEngine.rollDice(state, socket.id);
      });
      if (result && result.dice) {
        io.to(found.code).emit(S2C.DICE_RESULT, result.dice);
      }
    });

    socket.on(C2S.BUILD_SETTLEMENT, ({ vertexKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.buildSettlement(state, socket.id, vertexKey);
      });
    });

    socket.on(C2S.BUILD_CITY, ({ vertexKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.buildCity(state, socket.id, vertexKey);
      });
    });

    socket.on(C2S.BUILD_ROAD, ({ edgeKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.buildRoad(state, socket.id, edgeKey);
      });
    });

    socket.on(C2S.BUY_DEV_CARD, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.buyDevCard(state, socket.id);
      });
    });

    socket.on(C2S.PLAY_DEV_CARD, ({ cardType, params }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.playDevCard(state, socket.id, cardType, params || {});
      });
    });

    socket.on(C2S.END_TURN, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.endTurn(state, socket.id);
      });
    });

    socket.on(C2S.MOVE_ROBBER, ({ q, r }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.moveRobber(state, socket.id, q, r);
      });
    });

    socket.on(C2S.STEAL_RESOURCE, ({ targetId }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.stealResource(state, socket.id, targetId);
      });
    });

    socket.on(C2S.DISCARD_RESOURCES, ({ resources }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.discardResources(state, socket.id, resources);
      });
    });

    socket.on(C2S.PLACE_INITIAL_SETTLEMENT, ({ vertexKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.placeInitialSettlement(state, socket.id, vertexKey);
      });
    });

    socket.on(C2S.PLACE_INITIAL_ROAD, ({ edgeKey }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.placeInitialRoad(state, socket.id, edgeKey);
      });
    });

    // ---- TRADING ----

    socket.on(C2S.TRADE_OFFER, ({ offering, requesting }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeOffer(state, socket.id, offering, requesting);
      });
    });

    socket.on(C2S.TRADE_ACCEPT, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeAccept(state, socket.id);
      });
    });

    socket.on(C2S.TRADE_REJECT, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeReject(state, socket.id);
      });
    });

    socket.on(C2S.TRADE_CANCEL, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeCancel(state, socket.id);
      });
    });

    socket.on(C2S.TRADE_WITH_BANK, ({ givingResource, givingAmount, receivingResource }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      handleGameAction(io, socket, found.code, (state) => {
        gameEngine.tradeWithBank(state, socket.id, givingResource, givingAmount, receivingResource);
      });
    });

    // ---- CHAT ----

    socket.on(C2S.CHAT_MESSAGE, ({ text }) => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      const player = found.room.players.find(p => p.id === socket.id);
      io.to(found.code).emit(S2C.CHAT_MESSAGE, {
        from: player ? player.name : 'Unknown',
        color: player ? player.color : '#fff',
        text,
        timestamp: Date.now()
      });
    });

    // ---- SIGNALING ----

    setupSignaling(socket, io);

    // ---- DISCONNECT ----

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
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
