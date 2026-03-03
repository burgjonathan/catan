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

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // ---- ROOM EVENTS ----

    socket.on(C2S.CREATE_ROOM, ({ playerName }) => {
      try {
        const { code, room } = roomManager.createRoom(socket.id, playerName);
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

    socket.on(C2S.JOIN_ROOM, ({ code, playerName }) => {
      try {
        const { room } = roomManager.joinRoom(code.toUpperCase(), socket.id, playerName);
        socket.join(code.toUpperCase());
        socket.leave('lobby:browser');
        socket.emit(S2C.ROOM_JOINED, {
          code: code.toUpperCase(),
          playerId: socket.id,
          players: room.players
        });
        socket.to(code.toUpperCase()).emit(S2C.ROOM_UPDATED, { players: room.players });
        notifyLobbyBrowsers(io);
      } catch (err) {
        socket.emit(S2C.ROOM_ERROR, { message: err.message });
      }
    });

    socket.on(C2S.LEAVE_ROOM, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return;
      const { code } = found;
      const { room, isEmpty } = roomManager.leaveRoom(code, socket.id);
      socket.leave(code);
      if (!isEmpty && room) {
        io.to(code).emit(S2C.ROOM_UPDATED, { players: room.players });
      }
      notifyLobbyBrowsers(io);
    });

    socket.on(C2S.START_GAME, () => {
      const found = roomManager.getRoomBySocket(socket.id);
      if (!found) return socket.emit(S2C.GAME_ERROR, { message: 'Not in a room' });
      const { code, room } = found;
      if (room.hostId !== socket.id) return socket.emit(S2C.GAME_ERROR, { message: 'Only host can start' });
      if (room.players.length < 2) return socket.emit(S2C.GAME_ERROR, { message: 'Need at least 2 players' });

      const gameState = gameEngine.createGame(room.players);
      roomManager.setGameState(code, gameState);
      broadcastGameState(io, code, gameState);
      notifyLobbyBrowsers(io);
    });

    // ---- PUBLIC ROOMS / LOBBY BROWSER ----

    socket.on(C2S.CREATE_PUBLIC_ROOM, ({ playerName, roomName }) => {
      try {
        if (!roomName || !roomName.trim()) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Room name is required' });
        }
        if (roomName.trim().length > 30) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Room name too long (max 30 chars)' });
        }
        if (roomManager.getRoomBySocket(socket.id)) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Already in a room' });
        }
        const { code, room } = roomManager.createPublicRoom(socket.id, playerName.trim(), roomName.trim());
        socket.join(code);
        socket.leave('lobby:browser');
        socket.emit(S2C.ROOM_CREATED, {
          code,
          playerId: socket.id,
          players: room.players
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

    socket.on(C2S.QUICK_PLAY, ({ playerName }) => {
      try {
        if (!playerName || !playerName.trim()) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Player name is required' });
        }
        if (roomManager.getRoomBySocket(socket.id)) {
          return socket.emit(S2C.ROOM_ERROR, { message: 'Already in a room' });
        }
        const available = roomManager.findAvailablePublicRoom();
        if (available) {
          const { room } = roomManager.joinRoom(available.code, socket.id, playerName.trim());
          socket.join(available.code);
          socket.leave('lobby:browser');
          socket.emit(S2C.ROOM_JOINED, {
            code: available.code,
            playerId: socket.id,
            players: room.players
          });
          socket.to(available.code).emit(S2C.ROOM_UPDATED, { players: room.players });
          notifyLobbyBrowsers(io);
        } else {
          const roomName = `${playerName.trim()}'s Game`;
          const { code, room } = roomManager.createPublicRoom(socket.id, playerName.trim(), roomName);
          socket.join(code);
          socket.leave('lobby:browser');
          socket.emit(S2C.ROOM_CREATED, {
            code,
            playerId: socket.id,
            players: room.players
          });
          notifyLobbyBrowsers(io);
        }
      } catch (err) {
        socket.emit(S2C.ROOM_ERROR, { message: err.message });
      }
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
      const found = roomManager.getRoomBySocket(socket.id);
      if (found) {
        const { code } = found;
        const { room, isEmpty } = roomManager.leaveRoom(code, socket.id);
        if (!isEmpty && room) {
          io.to(code).emit(S2C.ROOM_UPDATED, { players: room.players });
          io.to(code).emit(S2C.PLAYER_LEFT, { playerId: socket.id });
        }
        notifyLobbyBrowsers(io);
      }
    });
  });
}
