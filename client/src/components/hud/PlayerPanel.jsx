import { useState, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import ResourceCards from './ResourceCards';
import BuildMenu from './BuildMenu';
import DevelopmentCards from './DevelopmentCards';
import DiceDisplay from './DiceDisplay';
import TurnIndicator from './TurnIndicator';
import FlyingResources from './FlyingResources';
import './PlayerPanel.css';

export default function PlayerPanel() {
  const { state } = useGame();
  const actions = useGameActions();
  const { gameState, playerId, diceResult } = state;
  const [animating, setAnimating] = useState(false);

  const handleAnimStart = useCallback(() => setAnimating(true), []);
  const handleAnimEnd = useCallback(() => setAnimating(false), []);

  if (!gameState) return null;

  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const currentPhase = gameState.phase;
  const isSetup = currentPhase === 'setup1' || currentPhase === 'setup2';

  const canPlayDev = isMyTurn
    && (currentPhase === 'main' || currentPhase === 'roll')
    && !myPlayer?.hasPlayedDevCardThisTurn;

  return (
    <div className="player-panel">
      <TurnIndicator
        currentPlayer={gameState.players[gameState.currentPlayerIndex]}
        phase={currentPhase}
        turnNumber={gameState.turnNumber}
        isMyTurn={isMyTurn}
      />

      <div className="player-panel-content">
        <div className="player-panel-left">
          <ResourceCards resources={myPlayer?.resources} animatingResources={animating} />
        </div>

        <DevelopmentCards
          cards={myPlayer?.devCards || []}
          newCards={myPlayer?.newDevCards || []}
          canPlay={canPlayDev}
          onPlay={(cardType, params) => actions.playDevCard(cardType, params)}
        />

        <div className="player-panel-center">
          <DiceDisplay
            diceResult={diceResult}
            canRoll={isMyTurn && currentPhase === 'roll'}
            onRoll={actions.rollDice}
          />

          {!isSetup && (
            <BuildMenu
              resources={myPlayer?.resources}
              isMyTurn={isMyTurn}
              phase={currentPhase}
              onBuildSettlement={() => actions.setPendingAction('buildSettlement')}
              onBuildCity={() => actions.setPendingAction('buildCity')}
              onBuildRoad={() => actions.setPendingAction('buildRoad')}
              onBuyDevCard={() => actions.buyDevCard()}
            />
          )}
        </div>

        <div className="player-panel-right">
          {isMyTurn && currentPhase === 'main' && (
            <button className="btn btn-primary end-turn-btn" onClick={actions.endTurn}>
              End Turn
            </button>
          )}
        </div>
      </div>

      {/* Flying resource icons from hex tiles to cards */}
      <FlyingResources onAnimStart={handleAnimStart} onAnimEnd={handleAnimEnd} />
    </div>
  );
}
