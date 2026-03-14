import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'achievements_data.json');

const ACHIEVEMENT_DEFS = [
  { id: 'first_win', name: 'First Victory', description: 'Win your first game', icon: '\u{1F3C6}' },
  { id: 'no_trade_win', name: 'Lone Wolf', description: 'Win without trading with other players', icon: '\u{1F43A}' },
  { id: 'all_settlements', name: 'Settler', description: 'Build all 5 settlements in a game', icon: '\u{1F3D8}\uFE0F' },
  { id: 'all_cities', name: 'Metropolis', description: 'Build all 4 cities in a game', icon: '\u{1F3F0}' },
  { id: 'longest_road', name: 'Road Runner', description: 'Hold the Longest Road card', icon: '\u{1F6E4}\uFE0F' },
  { id: 'largest_army', name: 'Warlord', description: 'Hold the Largest Army card', icon: '\u2694\uFE0F' },
  { id: 'knight_master', name: 'Knight Master', description: 'Play 10 knights across all games', icon: '\u{1F6E1}\uFE0F' },
  { id: 'ten_wins', name: 'Veteran', description: 'Win 10 games', icon: '\u2B50' },
  { id: 'quick_win', name: 'Speed Demon', description: 'Win a game in under 30 turns', icon: '\u26A1' },
  { id: 'max_resources', name: 'Hoarder', description: 'Hold 15+ resources at once', icon: '\u{1F4B0}' },
  { id: 'comeback_win', name: 'Comeback King', description: 'Win after being last in VP', icon: '\u{1F451}' },
  { id: 'bot_slayer', name: 'Bot Slayer', description: 'Win against 3 hard bots', icon: '\u{1F916}' },
];

// In-memory state
let playerAchievements = {}; // sessionId -> [{ id, unlockedAt }]
let playerStats = {};        // sessionId -> { totalWins, totalKnights }

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      playerAchievements = data.playerAchievements || {};
      playerStats = data.playerStats || {};
    }
  } catch {
    // Start fresh if file is corrupted
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      playerAchievements,
      playerStats,
    }, null, 2));
  } catch {
    // Silent fail for persistence
  }
}

// Initialize on import
loadData();

function ensurePlayer(sessionId) {
  if (!playerAchievements[sessionId]) playerAchievements[sessionId] = [];
  if (!playerStats[sessionId]) playerStats[sessionId] = { totalWins: 0, totalKnights: 0 };
}

function hasAchievement(sessionId, achievementId) {
  return (playerAchievements[sessionId] || []).some(a => a.id === achievementId);
}

function unlock(sessionId, achievementId, newlyUnlocked) {
  if (hasAchievement(sessionId, achievementId)) return;
  const def = ACHIEVEMENT_DEFS.find(d => d.id === achievementId);
  if (!def) return;
  const entry = { id: achievementId, unlockedAt: Date.now() };
  playerAchievements[sessionId].push(entry);
  newlyUnlocked.push({ ...def, unlockedAt: entry.unlockedAt });
}

export function checkAchievements(state, sessionId, playerId) {
  if (!sessionId) return [];
  ensurePlayer(sessionId);

  const newlyUnlocked = [];
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  // Figure out who won by finding the player with highest VP
  const vpScores = state.players.map(p => {
    let vp = p.settlements.length + p.cities.length * 2;
    if (state.longestRoad.playerId === p.id) vp += 2;
    if (state.largestArmy.playerId === p.id) vp += 2;
    const vpCards = (p.devCards || []).filter(c => c === 'victoryPoint').length
      + (p.newDevCards || []).filter(c => c === 'victoryPoint').length;
    vp += vpCards;
    return { id: p.id, vp };
  });

  const winnerEntry = vpScores.reduce((a, b) => a.vp >= b.vp ? a : b);
  const didWin = winnerEntry.id === playerId;

  // Update cumulative stats
  const stats = playerStats[sessionId];
  stats.totalKnights += player.playedKnights || 0;
  if (didWin) stats.totalWins += 1;

  // --- Check each achievement ---

  // 1. First Victory
  if (didWin && stats.totalWins >= 1) {
    unlock(sessionId, 'first_win', newlyUnlocked);
  }

  // 2. Lone Wolf - win without trading with other players
  // We check if player has no completed trades recorded in state
  // Since there's no direct trade tracking, we look at the game log
  if (didWin) {
    const playerTraded = (state.gameLog || []).some(log => {
      const msg = typeof log === 'string' ? log : (log.message || '');
      return msg.includes(player.name) && (msg.includes('traded with') || msg.includes('accepted'));
    });
    if (!playerTraded) {
      unlock(sessionId, 'no_trade_win', newlyUnlocked);
    }
  }

  // 3. Settler - build all 5 settlements
  if (player.settlements.length + player.cities.length >= 5) {
    unlock(sessionId, 'all_settlements', newlyUnlocked);
  }

  // 4. Metropolis - build all 4 cities
  if (player.cities.length >= 4) {
    unlock(sessionId, 'all_cities', newlyUnlocked);
  }

  // 5. Road Runner - hold Longest Road
  if (state.longestRoad.playerId === playerId) {
    unlock(sessionId, 'longest_road', newlyUnlocked);
  }

  // 6. Warlord - hold Largest Army
  if (state.largestArmy.playerId === playerId) {
    unlock(sessionId, 'largest_army', newlyUnlocked);
  }

  // 7. Knight Master - 10 knights cumulative
  if (stats.totalKnights >= 10) {
    unlock(sessionId, 'knight_master', newlyUnlocked);
  }

  // 8. Veteran - 10 wins
  if (stats.totalWins >= 10) {
    unlock(sessionId, 'ten_wins', newlyUnlocked);
  }

  // 9. Speed Demon - win in under 30 turns
  if (didWin && state.turnNumber < 30) {
    unlock(sessionId, 'quick_win', newlyUnlocked);
  }

  // 10. Hoarder - hold 15+ resources at once
  // Check current resources (end of game state)
  const totalResources = Object.values(player.resources || {}).reduce((a, b) => a + b, 0);
  if (totalResources >= 15) {
    unlock(sessionId, 'max_resources', newlyUnlocked);
  }

  // 11. Comeback King - win after being last in VP at some point
  // We approximate: if winner had the lowest VP among non-bot players at some earlier stage
  // Since we only have final state, check if winner had fewest settlements early (heuristic)
  // Better: check if winner currently has the least non-bonus VP compared to others
  if (didWin) {
    const myBaseVP = player.settlements.length + player.cities.length * 2;
    const othersBaseVP = state.players
      .filter(p => p.id !== playerId)
      .map(p => p.settlements.length + p.cities.length * 2);
    const wasLast = othersBaseVP.some(vp => vp > myBaseVP + 2);
    if (wasLast) {
      unlock(sessionId, 'comeback_win', newlyUnlocked);
    }
  }

  // 12. Bot Slayer - win against 3 hard bots
  if (didWin) {
    const hardBots = state.players.filter(p => p.isBot && p.difficulty === 'hard');
    if (hardBots.length >= 3) {
      unlock(sessionId, 'bot_slayer', newlyUnlocked);
    }
  }

  saveData();
  return newlyUnlocked;
}

export function getAchievements(sessionId) {
  if (!sessionId) return [];
  const unlocked = playerAchievements[sessionId] || [];
  return ACHIEVEMENT_DEFS.map(def => {
    const entry = unlocked.find(a => a.id === def.id);
    return {
      ...def,
      unlocked: !!entry,
      unlockedAt: entry?.unlockedAt || null,
    };
  });
}
