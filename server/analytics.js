// In-memory analytics tracker
// Tracks: visits, active users, play time per session

const analytics = {
  // Total page visits (each socket connection = 1 visit)
  totalVisits: 0,
  // { socketId: { sessionId, connectedAt, ip, userAgent } }
  activeUsers: new Map(),
  // { sessionId: { firstSeen, lastSeen, totalTime, visits, gamesPlayed, currentGameStart } }
  sessions: new Map(),
  // Server start time
  startedAt: Date.now(),
};

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
}

export function trackGameStart(sessionId) {
  const session = analytics.sessions.get(sessionId);
  if (session) {
    session.gamesPlayed++;
    session.currentGameStart = Date.now();
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
