import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import TradeOffer from './TradeOffer';
import TradeRequest from './TradeRequest';
import BankTrade from './BankTrade';
import './TradePanel.css';

export default function TradePanel() {
  const { state } = useGame();
  const { gameState, playerId } = state;
  const [tab, setTab] = useState('player');

  if (!gameState) return null;

  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const myPlayer = gameState.players.find(p => p.id === playerId);
  const incomingTrade = gameState.pendingTrade && gameState.pendingTrade.from !== playerId;

  return (
    <div className="trade-panel">
      <div className="trade-tabs">
        <button
          className={`trade-tab ${tab === 'player' ? 'active' : ''}`}
          onClick={() => setTab('player')}
        >
          Trade
        </button>
        <button
          className={`trade-tab ${tab === 'bank' ? 'active' : ''}`}
          onClick={() => setTab('bank')}
        >
          Bank
        </button>
      </div>

      <div className="trade-content">
        {incomingTrade && (
          <TradeRequest trade={gameState.pendingTrade} myResources={myPlayer?.resources} />
        )}

        {tab === 'player' && !incomingTrade && (
          <TradeOffer
            canTrade={isMyTurn && gameState.phase === 'main' && !gameState.pendingTrade}
            resources={myPlayer?.resources}
          />
        )}

        {tab === 'bank' && (
          <BankTrade
            canTrade={isMyTurn && gameState.phase === 'main'}
            resources={myPlayer?.resources}
            ports={myPlayer?.ports || []}
          />
        )}
      </div>
    </div>
  );
}
