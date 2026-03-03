export const initialState = {
  screen: 'lobby',
  roomCode: null,
  playerId: null,
  playerName: null,
  players: [],
  gameState: null,
  error: null,
  gameLog: [],
  chatMessages: [],
  diceResult: null,
  pendingAction: null,
  mustDiscard: false,
  tradeOffer: null,
  winner: null,
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
        error: null
      };

    case 'ROOM_JOINED':
      return {
        ...state,
        screen: 'waiting',
        roomCode: action.payload.code,
        playerId: action.payload.playerId,
        players: action.payload.players,
        error: null
      };

    case 'ROOM_UPDATED':
      return { ...state, players: action.payload.players };

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

    case 'SET_PENDING_ACTION':
      return { ...state, pendingAction: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
