import { useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';

export default function SoundTriggers() {
  const { state } = useGame();
  const { playSfx } = useAudio();

  const prevDice = useRef(null);
  const prevLogLen = useRef(0);
  const prevTradeOffer = useRef(null);
  const prevChatLen = useRef(0);
  const prevScreen = useRef(state.screen);
  const prevError = useRef(null);
  const prevPhase = useRef(null);
  const prevTurnIdx = useRef(null);
  const prevPlayersLen = useRef(0);

  // Dice roll
  useEffect(() => {
    if (state.diceResult && state.diceResult !== prevDice.current) {
      playSfx('diceRoll');
    }
    prevDice.current = state.diceResult;
  }, [state.diceResult, playSfx]);

  // Game log events (building, dev cards, etc.)
  useEffect(() => {
    const logs = state.gameLog;
    if (logs.length > prevLogLen.current) {
      const newLogs = logs.slice(prevLogLen.current);
      for (const log of newLogs) {
        const msg = (log.message || log).toLowerCase();
        if (msg.includes('built a settlement') || msg.includes('placed a settlement')) {
          playSfx('buildSettlement');
        } else if (msg.includes('built a city') || msg.includes('upgraded')) {
          playSfx('buildCity');
        } else if (msg.includes('built a road') || msg.includes('placed a road')) {
          playSfx('buildRoad');
        } else if (msg.includes('bought a development') || msg.includes('dev card')) {
          playSfx('devCard');
        } else if (msg.includes('played') && (msg.includes('knight') || msg.includes('monopoly') || msg.includes('year of plenty') || msg.includes('road building'))) {
          playSfx('devCard');
        } else if (msg.includes('moved the robber') || msg.includes('robber')) {
          playSfx('robber');
        } else if (msg.includes('stole') || msg.includes('steal')) {
          playSfx('robber');
        } else if (msg.includes('received') || msg.includes('collected')) {
          playSfx('resourceGain');
        }
      }
    }
    prevLogLen.current = logs.length;
  }, [state.gameLog, playSfx]);

  // Trade events
  useEffect(() => {
    if (state.tradeOffer && state.tradeOffer !== prevTradeOffer.current) {
      playSfx('tradeOffer');
    }
    if (!state.tradeOffer && prevTradeOffer.current) {
      playSfx('tradeComplete');
    }
    prevTradeOffer.current = state.tradeOffer;
  }, [state.tradeOffer, playSfx]);

  // Chat messages
  useEffect(() => {
    if (state.chatMessages.length > prevChatLen.current) {
      playSfx('chatMessage');
    }
    prevChatLen.current = state.chatMessages.length;
  }, [state.chatMessages, playSfx]);

  // Victory
  useEffect(() => {
    if (state.screen === 'victory' && prevScreen.current !== 'victory') {
      playSfx('victory');
    }
    prevScreen.current = state.screen;
  }, [state.screen, playSfx]);

  // Error
  useEffect(() => {
    if (state.error && state.error !== prevError.current) {
      playSfx('error');
    }
    prevError.current = state.error;
  }, [state.error, playSfx]);

  // Discard phase
  useEffect(() => {
    if (state.mustDiscard) {
      playSfx('discard');
    }
  }, [state.mustDiscard, playSfx]);

  // Your turn detection
  useEffect(() => {
    const gs = state.gameState;
    if (!gs) return;
    const currentIdx = gs.currentPlayerIndex;
    const currentPlayer = gs.players[currentIdx];
    if (currentPlayer?.id === state.playerId && currentIdx !== prevTurnIdx.current) {
      playSfx('yourTurn');
    }
    prevTurnIdx.current = currentIdx;
  }, [state.gameState, state.playerId, playSfx]);

  // Player join
  useEffect(() => {
    if (state.players.length > prevPlayersLen.current && prevPlayersLen.current > 0) {
      playSfx('playerJoin');
    }
    prevPlayersLen.current = state.players.length;
  }, [state.players, playSfx]);

  return null;
}
