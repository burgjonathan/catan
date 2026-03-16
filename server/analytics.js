// Analytics tracker with file + database persistence
// Tracks: visits, active users, play time per session

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbLoad, dbSave } from './dataStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'analytics_data.json');

function loadFromFile() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return {
      totalVisits: data.totalVisits || 0,
      sessions: new Map(Object.entries(data.sessions || {})),
      startedAt: data.startedAt || Date.now(),
    };
  } catch {
    return null;
  }
}

function saveData() {
  const data = {
    totalVisits: analytics.totalVisits,
    sessions: Object.fromEntries(analytics.sessions),
    startedAt: analytics.startedAt,
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf-8');
  } catch (err) {
    console.error('Failed to save analytics data:', err.message);
  }
  dbSave('analytics', data);
}

const saved = loadFromFile();

const analytics = {
  totalVisits: saved ? saved.totalVisits : 0,
  activeUsers: new Map(),
  sessions: saved ? saved.sessions : new Map(),
  startedAt: saved ? saved.startedAt : Date.now(),
};

export async function initAnalytics() {
  const data = await dbLoad('analytics');
  if (data) {
    analytics.totalVisits = data.totalVisits || 0;
    analytics.sessions = new Map(Object.entries(data.sessions || {}));
    analytics.startedAt = data.startedAt || Date.now();
    console.log('Analytics loaded from database');
  }
}

export function trackConnect(socketId, sessionId, ip, userAgent) {
  analytics.totalVisits++;

  analytics.activeUsers.set(socketId, {
    sessionId,
    connectedAt: Date.now(),
    ip,
    userAgent,
  });

  // Update session record
  let session = analytics.sessions.get(sessionId);
  if (!session) {
    session = {
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      totalTime: 0,
      visits: 0,
      gamesPlayed: 0,
      currentGameStart: null,
    };
    analytics.sessions.set(sessionId, session);
  }
  session.visits++;
  session.lastSeen = Date.now();
  saveData();
}

export function trackDisconnect(socketId) {
  const user = analytics.activeUsers.get(socketId);
  if (!user) return;

  const session = analytics.sessions.get(user.sessionId);
  if (session) {
    // Add time spent this connection
    session.totalTime += Date.now() - user.connectedAt;
    session.lastSeen = Date.now();
    // If they were in a game, end the game timer
    if (session.currentGameStart) {
      session.currentGameStart = null;
    }
  }

  analytics.activeUsers.delete(socketId);
  saveData();
}

export function trackGameStart(sessionId) {
  const session = analytics.sessions.get(sessionId);
  if (session) {
    session.gamesPlayed++;
    session.currentGameStart = Date.now();
    saveData();
  }
}

export function getActiveCount() {
  return analytics.activeUsers.size;
}

export function getStats() {
  const now = Date.now();

  // Build active users list with current time included
  const activeUsers = [];
  for (const [socketId, user] of analytics.activeUsers) {
    const session = analytics.sessions.get(user.sessionId);
    activeUsers.push({
      socketId,
      sessionId: user.sessionId,
      connectedAt: user.connectedAt,
      currentSessionDuration: now - user.connectedAt,
      ip: user.ip,
      userAgent: user.userAgent,
      inGame: session?.currentGameStart != null,
    });
  }

  // Build session history
  const sessions = [];
  for (const [sessionId, s] of analytics.sessions) {
    // Check if this session is currently active
    let currentConnectionTime = 0;
    for (const [, user] of analytics.activeUsers) {
      if (user.sessionId === sessionId) {
        currentConnectionTime = now - user.connectedAt;
        break;
      }
    }

    sessions.push({
      sessionId,
      firstSeen: s.firstSeen,
      lastSeen: s.lastSeen,
      totalTime: s.totalTime + currentConnectionTime,
      visits: s.visits,
      gamesPlayed: s.gamesPlayed,
      isOnline: currentConnectionTime > 0,
    });
  }

  // Sort sessions by lastSeen descending
  sessions.sort((a, b) => b.lastSeen - a.lastSeen);

  return {
    serverStartedAt: analytics.startedAt,
    serverUptime: now - analytics.startedAt,
    totalVisits: analytics.totalVisits,
    activeUsersCount: analytics.activeUsers.size,
    uniqueSessions: analytics.sessions.size,
    activeUsers,
    sessions,
  };
}
