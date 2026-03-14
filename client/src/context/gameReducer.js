export const initialState = {
  screen: 'lobby',
  roomCode: null,
  playerId: null,
  playerName: null,
  players: [],
  isPublic: false,
  gameState: null,
  error: null,
  gameLog: [],
  chatMessages: [],
  diceResult: null,
  pendingAction: null,
  mustDiscard: false,
  tradeOffer: null,
  winner: null,
  tutorialMode: false,
  isSpectator: false,
  friendCode: null,
  friendsList: [],
  friendInvite: null,
  undoRequest: null,
  profile: null,
  achievements: [],
  newAchievements: [],
};

export function gameReducer(state, action) {
  switch (action.type) {
    case 'ROOM_CREATED':
      return {
        ...state,
        screen: 'waiting',
        roomCode: action.payload.code,
        playerId: action.payload.playerId,
        players: action.payload.players,
        isPublic: action.payload.isPublic || false,
        error: null
      };

    case 'ROOM_JOINED':
      return {
        ...state,
        screen: 'waiting',
        roomCode: action.payload.code,
        playerId: action.payload.playerId,
        players: action.payload.players,
        isPublic: action.payload.isPublic || false,
        error: null
      };

    case 'ROOM_UPDATED':
      return { ...state, players: action.payload.players };

    case 'REJOIN_SUCCESS': {
      const p = action.payload;
      if (p.gameState) {
        return {
          ...state,
          screen: 'playing',
          roomCode: p.code,
          playerId: p.playerId,
          players: p.players,
          isPublic: p.isPublic || false,
          gameState: p.gameState,
          error: null
        };
      }
      return {
        ...state,
        screen: 'waiting',
        roomCode: p.code,
        playerId: p.playerId,
        players: p.players,
        isPublic: p.isPublic || false,
        error: null
      };
    }

    case 'ROOM_ERROR':
      return { ...state, error: action.payload.message };

    case 'GAME_STATE':
      return {
        ...state,
        screen: 'playing',
        gameState: action.payload,
        error: null,
        pendingAction: null
      };

    case 'GAME_ERROR':
      return { ...state, error: action.payload.message };

    case 'GAME_LOG':
      return { ...state, gameLog: [...state.gameLog, action.payload] };

    case 'GAME_OVER':
      return {
        ...state,
        screen: 'victory',
        winner: action.payload.winner,
        gameState: action.payload.finalState
      };

    case 'DICE_RESULT':
      return { ...state, diceResult: action.payload };

    case 'MUST_DISCARD':
      return { ...state, mustDiscard: true };

    case 'TRADE_OFFERED':
      return { ...state, tradeOffer: action.payload };

    case 'TRADE_RESOLVED':
      return { ...state, tradeOffer: null };

    case 'CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };

    case 'SPECTATE_JOINED': {
      const sp = action.payload;
      return {
        ...state,
        screen: 'playing',
        roomCode: sp.code,
        playerId: null,
        players: sp.players,
        gameState: sp.gameState,
        isSpectator: true,
        error: null
      };
    }

    case 'SPECTATE_ERROR':
      return { ...state, error: action.payload.message };

    case 'FRIEND_CODE':
      return { ...state, friendCode: action.payload.friendCode };

    case 'FRIENDS_LIST':
      return { ...state, friendsList: action.payload.friends };

    case 'FRIEND_INVITE':
      return { ...state, friendInvite: action.payload };

    case 'DISMISS_INVITE':
      return { ...state, friendInvite: null };

    case 'FRIEND_ERROR':
      return { ...state, error: action.payload.message };

    case 'FRIEND_ONLINE':
      return {
        ...state,
        friendsList: state.friendsList.map(f =>
          f.sessionId === action.payload.sessionId ? { ...f, online: true, status: 'online' } : f
        )
      };

    case 'FRIEND_OFFLINE':
      return {
        ...state,
        friendsList: state.friendsList.map(f =>
          f.sessionId === action.payload.sessionId ? { ...f, online: false, status: 'offline' } : f
        )
      };

    case 'UNDO_REQUESTED':
      return { ...state, undoRequest: action.payload };

    case 'UNDO_RESOLVED':
      return { ...state, undoRequest: null };

    case 'PROFILE_DATA':
      return { ...state, profile: action.payload };

    case 'PROFILE_ERROR':
      return { ...state, error: action.payload.message };

    case 'ACHIEVEMENTS_LIST':
      return { ...state, achievements: action.payload.achievements };

    case 'ACHIEVEMENTS_UNLOCKED': {
      const newOnes = action.payload.achievements || [];
      const merged = [...state.achievements];
      for (const a of newOnes) {
        const idx = merged.findIndex(e => e.id === a.id);
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], unlocked: true, unlockedAt: a.unlockedAt };
        } else {
          merged.push({ ...a, unlocked: true });
        }
      }
      return { ...state, achievements: merged, newAchievements: newOnes };
    }

    case 'DISMISS_ACHIEVEMENTS':
      return { ...state, newAchievements: [] };

    case 'SET_PENDING_ACTION':
      return { ...state, pendingAction: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };

    case 'START_TUTORIAL':
      return {
        ...state,
        screen: 'playing',
        tutorialMode: true,
        playerId: action.payload.playerId,
        gameState: action.payload.gameState,
        error: null,
      };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
