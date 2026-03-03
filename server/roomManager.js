import { PLAYER_COLORS, PLAYER_COLOR_NAMES } from '../shared/constants.js';

const rooms = new Map();

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

export function createRoom(hostSocketId, hostName) {
  const code = generateCode();
  const room = {
    code,
    players: [{
      id: hostSocketId,
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

export function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code);
  if (!room) throw new Error('Room not found');
  if (room.status !== 'waiting') throw new Error('Game already in progress');
  if (room.players.length >= 4) throw new Error('Room is full');
  if (room.players.some(p => p.id === socketId)) throw new Error('Already in room');

  const colorIndex = room.players.length;
  room.players.push({
    id: socketId,
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
