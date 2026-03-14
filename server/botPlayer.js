import { PLAYER_COLORS, PLAYER_COLOR_NAMES } from '../shared/constants.js';

let botCounter = 0;

export function createBotPlayer(colorIndex, difficulty, name) {
  botCounter++;
  return {
    id: `bot-${Date.now()}-${botCounter}`,
    sessionId: null,
    name,
    color: PLAYER_COLORS[colorIndex],
    colorName: PLAYER_COLOR_NAMES[colorIndex],
    isHost: false,
    isBot: true,
    difficulty
  };
}
