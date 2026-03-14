import { createContext, useContext, useReducer, useEffect } from 'react';
import { gameReducer, initialState } from './gameReducer';
import { useSocketContext } from './SocketContext';
import { S2C } from 'shared/protocol.js';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      [S2C.ROOM_CREATED]: (data) => dispatch({ type: 'ROOM_CREATED', payload: data }),
      [S2C.ROOM_JOINED]: (data) => dispatch({ type: 'ROOM_JOINED', payload: data }),
      [S2C.ROOM_UPDATED]: (data) => dispatch({ type: 'ROOM_UPDATED', payload: data }),
      [S2C.REJOIN_SUCCESS]: (data) => dispatch({ type: 'REJOIN_SUCCESS', payload: data }),
      [S2C.ROOM_ERROR]: (data) => dispatch({ type: 'ROOM_ERROR', payload: data }),
      [S2C.GAME_STATE]: (data) => dispatch({ type: 'GAME_STATE', payload: data }),
      [S2C.GAME_ERROR]: (data) => dispatch({ type: 'GAME_ERROR', payload: data }),
      [S2C.GAME_LOG]: (data) => dispatch({ type: 'GAME_LOG', payload: data }),
      [S2C.GAME_OVER]: (data) => dispatch({ type: 'GAME_OVER', payload: data }),
      [S2C.DICE_RESULT]: (data) => dispatch({ type: 'DICE_RESULT', payload: data }),
      [S2C.MUST_DISCARD]: (data) => dispatch({ type: 'MUST_DISCARD', payload: data }),
      [S2C.TRADE_OFFERED]: (data) => dispatch({ type: 'TRADE_OFFERED', payload: data }),
      [S2C.TRADE_RESOLVED]: (data) => dispatch({ type: 'TRADE_RESOLVED', payload: data }),
      [S2C.CHAT_MESSAGE]: (data) => dispatch({ type: 'CHAT_MESSAGE', payload: data }),
      [S2C.SPECTATE_JOINED]: (data) => dispatch({ type: 'SPECTATE_JOINED', payload: data }),
      [S2C.SPECTATE_ERROR]: (data) => dispatch({ type: 'SPECTATE_ERROR', payload: data }),
      [S2C.FRIEND_CODE]: (data) => dispatch({ type: 'FRIEND_CODE', payload: data }),
      [S2C.FRIENDS_LIST]: (data) => dispatch({ type: 'FRIENDS_LIST', payload: data }),
      [S2C.FRIEND_ERROR]: (data) => dispatch({ type: 'FRIEND_ERROR', payload: data }),
      [S2C.FRIEND_INVITE]: (data) => dispatch({ type: 'FRIEND_INVITE', payload: data }),
      [S2C.FRIEND_ONLINE]: (data) => dispatch({ type: 'FRIEND_ONLINE', payload: data }),
      [S2C.FRIEND_OFFLINE]: (data) => dispatch({ type: 'FRIEND_OFFLINE', payload: data }),
      [S2C.UNDO_REQUESTED]: (data) => dispatch({ type: 'UNDO_REQUESTED', payload: data }),
      [S2C.UNDO_RESOLVED]: (data) => dispatch({ type: 'UNDO_RESOLVED', payload: data }),
      [S2C.PROFILE_DATA]: (data) => dispatch({ type: 'PROFILE_DATA', payload: data }),
      [S2C.PROFILE_ERROR]: (data) => dispatch({ type: 'PROFILE_ERROR', payload: data }),
      [S2C.ACHIEVEMENTS_LIST]: (data) => dispatch({ type: 'ACHIEVEMENTS_LIST', payload: data }),
      [S2C.ACHIEVEMENTS_UNLOCKED]: (data) => dispatch({ type: 'ACHIEVEMENTS_UNLOCKED', payload: data }),
    };

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler);
    }

    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        socket.off(event, handler);
      }
    };
  }, [socket]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
