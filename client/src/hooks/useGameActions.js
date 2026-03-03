import { useSocketContext } from '../context/SocketContext';
import { useGame } from '../context/GameContext';
import { C2S } from 'shared/protocol.js';

export function useGameActions() {
  const { socket } = useSocketContext();
  const { dispatch } = useGame();

  return {
    createRoom: (playerName) => socket?.emit(C2S.CREATE_ROOM, { playerName }),
    joinRoom: (code, playerName) => socket?.emit(C2S.JOIN_ROOM, { code, playerName }),
    leaveRoom: () => socket?.emit(C2S.LEAVE_ROOM),
    startGame: () => socket?.emit(C2S.START_GAME),

    createPublicRoom: (playerName) => socket?.emit(C2S.CREATE_PUBLIC_ROOM, { playerName }),
    quickPlay: (playerName) => socket?.emit(C2S.QUICK_PLAY, { playerName }),

    rollDice: () => socket?.emit(C2S.ROLL_DICE),
    buildSettlement: (vertexKey) => socket?.emit(C2S.BUILD_SETTLEMENT, { vertexKey }),
    buildCity: (vertexKey) => socket?.emit(C2S.BUILD_CITY, { vertexKey }),
    buildRoad: (edgeKey) => socket?.emit(C2S.BUILD_ROAD, { edgeKey }),
    buyDevCard: () => socket?.emit(C2S.BUY_DEV_CARD),
    playDevCard: (cardType, params) => socket?.emit(C2S.PLAY_DEV_CARD, { cardType, params }),
    endTurn: () => socket?.emit(C2S.END_TURN),

    moveRobber: (q, r) => socket?.emit(C2S.MOVE_ROBBER, { q, r }),
    stealResource: (targetId) => socket?.emit(C2S.STEAL_RESOURCE, { targetId }),
    discardResources: (resources) => socket?.emit(C2S.DISCARD_RESOURCES, { resources }),

    tradeOffer: (offering, requesting) => socket?.emit(C2S.TRADE_OFFER, { offering, requesting }),
    tradeAccept: () => socket?.emit(C2S.TRADE_ACCEPT),
    tradeReject: () => socket?.emit(C2S.TRADE_REJECT),
    tradeCancel: () => socket?.emit(C2S.TRADE_CANCEL),
    tradeWithBank: (givingResource, givingAmount, receivingResource) =>
      socket?.emit(C2S.TRADE_WITH_BANK, { givingResource, givingAmount, receivingResource }),

    placeInitialSettlement: (vertexKey) => socket?.emit(C2S.PLACE_INITIAL_SETTLEMENT, { vertexKey }),
    placeInitialRoad: (edgeKey) => socket?.emit(C2S.PLACE_INITIAL_ROAD, { edgeKey }),

    sendChat: (text) => socket?.emit(C2S.CHAT_MESSAGE, { text }),

    setPendingAction: (action) => dispatch({ type: 'SET_PENDING_ACTION', payload: action }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };
}
