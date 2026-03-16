import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbLoad, dbSave } from './dataStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'friends_data.json');

// In-memory state
let friendCodes = {};   // sessionId -> friendCode
let codesToSession = {}; // friendCode -> sessionId
let friendLists = {};    // sessionId -> [sessionId, ...]
let playerNames = {};    // sessionId -> name
let playerAvatars = {};  // sessionId -> avatar emoji
let nameLockedUntil = {}; // sessionId -> timestamp
const onlinePlayers = new Map(); // sessionId -> { socketId, name, status, roomCode }

function generateFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (codesToSession[code]);
  return code;
}

function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      friendCodes = data.friendCodes || {};
      codesToSession = data.codesToSession || {};
      friendLists = data.friendLists || {};
      playerNames = data.playerNames || {};
      playerAvatars = data.playerAvatars || {};
      nameLockedUntil = data.nameLockedUntil || {};
    }
  } catch {
    // Start fresh if file is corrupted
  }
}

function saveData() {
  const data = {
    friendCodes,
    codesToSession,
    friendLists,
    playerNames,
    playerAvatars,
    nameLockedUntil
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch {
    // Silent fail for persistence
  }
  dbSave('friends', data);
}

// Initialize on import
loadFromFile();

export async function initFriends() {
  const data = await dbLoad('friends');
  if (data) {
    friendCodes = data.friendCodes || {};
    codesToSession = data.codesToSession || {};
    friendLists = data.friendLists || {};
    playerNames = data.playerNames || {};
    playerAvatars = data.playerAvatars || {};
    nameLockedUntil = data.nameLockedUntil || {};
    console.log('Friends data loaded from database');
  }
}

export function ensureFriendCode(sessionId, name) {
  if (!sessionId) return null;
  if (friendCodes[sessionId]) {
    // Update name if changed (only if not taken)
    if (name && playerNames[sessionId] !== name && !isNameTaken(name, sessionId)) {
      playerNames[sessionId] = name;
      saveData();
    }
    return friendCodes[sessionId];
  }
  const code = generateFriendCode();
  friendCodes[sessionId] = code;
  codesToSession[code] = sessionId;
  if (name && !isNameTaken(name, sessionId)) playerNames[sessionId] = name;
  if (!friendLists[sessionId]) friendLists[sessionId] = [];
  saveData();
  return code;
}

export function getFriendCode(sessionId) {
  return friendCodes[sessionId] || null;
}

export function getSessionByCode(friendCode) {
  return codesToSession[friendCode] || null;
}

export function addFriend(sessionId, targetCode) {
  const targetSession = codesToSession[targetCode];
  if (!targetSession) return { error: 'Player not found' };
  if (targetSession === sessionId) return { error: "You can't add yourself" };

  if (!friendLists[sessionId]) friendLists[sessionId] = [];
  if (!friendLists[targetSession]) friendLists[targetSession] = [];

  if (friendLists[sessionId].includes(targetSession)) {
    return { error: 'Already friends' };
  }

  // Mutual friendship
  friendLists[sessionId].push(targetSession);
  friendLists[targetSession].push(sessionId);
  saveData();

  return { success: true, targetSession };
}

export function removeFriend(sessionId, targetSession) {
  if (!friendLists[sessionId]) return;
  friendLists[sessionId] = friendLists[sessionId].filter(id => id !== targetSession);
  if (friendLists[targetSession]) {
    friendLists[targetSession] = friendLists[targetSession].filter(id => id !== sessionId);
  }
  saveData();
}

export function getFriendsList(sessionId) {
  const friends = friendLists[sessionId] || [];
  return friends.map(fSessionId => {
    const online = onlinePlayers.get(fSessionId);
    return {
      sessionId: fSessionId,
      name: playerNames[fSessionId] || 'Unknown',
      avatar: playerAvatars[fSessionId] || null,
      friendCode: friendCodes[fSessionId],
      online: !!online,
      status: online?.status || 'offline',
      roomCode: online?.roomCode || null,
    };
  });
}

export function setOnline(sessionId, socketId, name) {
  onlinePlayers.set(sessionId, { socketId, name, status: 'online', roomCode: null });
  if (name && !isNameTaken(name, sessionId)) {
    playerNames[sessionId] = name;
    saveData();
  }
}

export function setOffline(sessionId) {
  onlinePlayers.delete(sessionId);
}

export function updateStatus(sessionId, status, roomCode) {
  const entry = onlinePlayers.get(sessionId);
  if (entry) {
    entry.status = status;
    entry.roomCode = roomCode || null;
  }
}

export function getOnlineSocketId(sessionId) {
  return onlinePlayers.get(sessionId)?.socketId || null;
}

export function getOnlineFriendSessionIds(sessionId) {
  const friends = friendLists[sessionId] || [];
  return friends.filter(fId => onlinePlayers.has(fId));
}

export function getSessionIdBySocketId(socketId) {
  for (const [sessionId, entry] of onlinePlayers) {
    if (entry.socketId === socketId) return sessionId;
  }
  return null;
}

export function isNameTaken(name, excludeSessionId) {
  if (!name) return false;
  const lower = name.toLowerCase();
  for (const [sid, n] of Object.entries(playerNames)) {
    if (sid !== excludeSessionId && n.toLowerCase() === lower) return true;
  }
  return false;
}

export function setProfile(sessionId, name, avatar) {
  // Check if name is locked
  if (nameLockedUntil[sessionId] && Date.now() < nameLockedUntil[sessionId]) {
    if (name && name !== playerNames[sessionId]) {
      return { error: 'Name locked', lockedUntil: nameLockedUntil[sessionId] };
    }
  }
  // Check if name is already taken by another player
  if (name && name !== playerNames[sessionId]) {
    if (isNameTaken(name, sessionId)) {
      return { error: 'This name is already taken' };
    }
    playerNames[sessionId] = name;
    nameLockedUntil[sessionId] = Date.now() + 20 * 24 * 60 * 60 * 1000;
  }
  if (avatar) {
    playerAvatars[sessionId] = avatar;
  }
  saveData();
  return { success: true };
}

export function getProfile(sessionId) {
  return {
    name: playerNames[sessionId] || null,
    avatar: playerAvatars[sessionId] || null,
    nameLocked: nameLockedUntil[sessionId] ? Date.now() < nameLockedUntil[sessionId] : false,
    lockedUntil: nameLockedUntil[sessionId] || null,
  };
}

export function getAvatar(sessionId) {
  return playerAvatars[sessionId] || null;
}
