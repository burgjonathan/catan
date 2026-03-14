import { PLAYER_COLORS, PLAYER_COLOR_NAMES } from '../shared/constants.js';
import { createBotPlayer } from './botPlayer.js';
import { pickBotNames } from './botNames.js';

const rooms = new Map();
const disconnectTimers = new Map(); // sessionId -> timeout handle

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostSocketId, hostName, sessionId) {
  const code = generateCode();
  const room = {
    code,
    players: [{
      id: hostSocketId,
      sessionId,
      name: hostName,
      color: PLAYER_COLORS[0],
      colorName: PLAYER_COLOR_NAMES[0],
      isHost: true
    }],
    hostId: hostSocketId,
    gameState: null,
    status: 'waiting'
  };
  rooms.set(code, room);
  return { code, room };
}

export function createPublicRoom(hostSocketId, hostName, sessionId) {
  const code = generateCode();
  const room = {
    code,
    isPublic: true,
    players: [{
      id: hostSocketId,
      sessionId,
      name: hostName,
      color: PLAYER_COLORS[0],
      colorName: PLAYER_COLOR_NAMES[0],
      isHost: true
    }],
    hostId: hostSocketId,
    gameState: null,
    status: 'waiting',
    createdAt: Date.now()
  };
  rooms.set(code, room);
  return { code, room };
}

export function getPublicRooms() {
  const publicRooms = [];
  for (const [code, room] of rooms) {
    if (room.isPublic && room.status === 'waiting' && room.players.length < 4) {
      publicRooms.push({
        code,
        playerCount: room.players.length,
        maxPlayers: 4,
        createdAt: room.createdAt
      });
    }
  }
  return publicRooms.sort((a, b) => b.createdAt - a.createdAt);
}

export function findAvailablePublicRoom() {
  for (const [code, room] of rooms) {
    if (room.isPublic && room.status === 'waiting' && room.players.length < 4) {
      return { code, room };
    }
  }
  return null;
}

export function joinRoom(code, socketId, playerName, sessionId) {
  const room = rooms.get(code);
  if (!room) throw new Error('Room not found');
  if (room.status !== 'waiting') throw new Error('Game already in progress');
  if (room.players.length >= 4) throw new Error('Room is full');
  if (room.players.some(p => p.id === socketId)) throw new Error('Already in room');

  const colorIndex = room.players.length;
  room.players.push({
    id: socketId,
    sessionId,
    name: playerName,
    color: PLAYER_COLORS[colorIndex],
    colorName: PLAYER_COLOR_NAMES[colorIndex],
    isHost: false
  });
  return { room };
}

export function leaveRoom(code, socketId) {
  const room = rooms.get(code);
  if (!room) return { room: null, isEmpty: true };

  room.players = room.players.filter(p => p.id !== socketId);
  if (room.players.length === 0) {
    rooms.delete(code);
    return { room: null, isEmpty: true };
  }

  // Transfer host if host left
  if (room.hostId === socketId) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
  }

  // Also update gameState player IDs if game is in progress
  if (room.gameState) {
    room.gameState.players = room.gameState.players.filter(p => p.id !== socketId);
  }

  return { room, isEmpty: false };
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function getRoomBySocket(socketId) {
  for (const [code, room] of rooms) {
    if (room.players.some(p => p.id === socketId)) {
      return { code, room };
    }
  }
  return null;
}

export function getRoomBySession(sessionId) {
  for (const [code, room] of rooms) {
    const player = room.players.find(p => p.sessionId === sessionId);
    if (player) {
      return { code, room, player };
    }
  }
  return null;
}

export function reconnectPlayer(sessionId, newSocketId) {
  const found = getRoomBySession(sessionId);
  if (!found) return null;

  const { code, room, player } = found;
  const oldSocketId = player.id;
  player.id = newSocketId;
  player.disconnected = false;

  // Update hostId if this was the host
  if (room.hostId === oldSocketId) {
    room.hostId = newSocketId;
  }

  // Update player ID in gameState too
  if (room.gameState) {
    const gsPlayer = room.gameState.players.find(p => p.id === oldSocketId);
    if (gsPlayer) {
      gsPlayer.id = newSocketId;
    }
  }

  // Cancel disconnect timer
  if (disconnectTimers.has(sessionId)) {
    clearTimeout(disconnectTimers.get(sessionId));
    disconnectTimers.delete(sessionId);
  }

  return { code, room };
}

export function markDisconnected(socketId, onTimeout) {
  const found = getRoomBySocket(socketId);
  if (!found) return null;

  const { code, room } = found;
  const player = room.players.find(p => p.id === socketId);
  if (!player) return null;

  player.disconnected = true;

  // Set a 30-second timer to fully remove
  const timer = setTimeout(() => {
    disconnectTimers.delete(player.sessionId);
    onTimeout(code, socketId);
  }, 30000);

  disconnectTimers.set(player.sessionId, timer);
  return { code, room, player };
}

export function cancelDisconnectTimer(sessionId) {
  if (disconnectTimers.has(sessionId)) {
    clearTimeout(disconnectTimers.get(sessionId));
    disconnectTimers.delete(sessionId);
  }
}

export function addBotsToRoom(code, botCount, difficulty) {
  const room = rooms.get(code);
  if (!room) throw new Error('Room not found');
  if (room.players.length + botCount > 4) throw new Error('Too many players');

  const names = pickBotNames(botCount);
  for (let i = 0; i < botCount; i++) {
    const colorIndex = room.players.length;
    const bot = createBotPlayer(colorIndex, difficulty, names[i]);
    room.players.push(bot);
  }
  return room;
}

export function setGameState(code, gameState) {
  const room = rooms.get(code);
  if (room) {
    room.gameState = gameState;
    room.status = 'playing';
  }
}

export function updateGameState(code, gameState) {
  const room = rooms.get(code);
  if (room) {
    room.gameState = gameState;
  }
}
