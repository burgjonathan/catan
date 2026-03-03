import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import Board from '../components/board/Board';
import PlayerPanel from '../components/hud/PlayerPanel';
import ScoreBoard from '../components/hud/ScoreBoard';
import OpponentBar from '../components/opponents/OpponentBar';
import TradePanel from '../components/trade/TradePanel';
import TextChat from '../components/chat/TextChat';
import DiscardModal from '../components/common/DiscardModal';
import StealModal from '../components/common/StealModal';
import { TutorialProvider, useTutorial } from '../components/tutorial/TutorialContext';
import TutorialOverlay from '../components/tutorial/TutorialOverlay';
import './GameScreen.css';

function HelpButton() {
  const { active, startTutorial } = useTutorial();
  if (active) return null;
  return (
    <button className="tutorial-help-btn" onClick={startTutorial} title="Game Tutorial">
      ?
    </button>
  );
}

function LeaveGameButton() {
  const [confirming, setConfirming] = useState(false);
  const actions = useGameActions();

  return (
    <div className="leave-game-wrap">
      {confirming ? (
        <div className="leave-game-confirm">
          <span>Leave game?</span>
          <button className="btn btn-danger btn-sm" onClick={() => actions.leaveRoom()}>Yes</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setConfirming(false)}>No</button>
        </div>
      ) : (
        <button className="leave-game-btn" onClick={() => setConfirming(true)} title="Leave Game">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Leave
        </button>
      )}
    </div>
  );
}

function ExitTutorialButton() {
  const { dispatch } = useGame();
  return (
    <div className="leave-game-wrap">
      <button className="leave-game-btn" onClick={() => dispatch({ type: 'RESET' })} title="Back to Menu">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Exit Tutorial
      </button>
    </div>
  );
}

export default function GameScreen() {
  const { state } = useGame();
  const { gameState, playerId, tutorialMode } = state;

  if (!gameState) return <div className="loading">Loading game...</div>;

  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  const showDiscard = gameState.phase === 'discard' && gameState.discardPending?.includes(playerId);
  const showSteal = gameState.phase === 'steal' && isMyTurn;

  return (
    <TutorialProvider>
      <div className="game-screen">
        <ScoreBoard />
        <OpponentBar />
        <div className="game-middle">
          {!tutorialMode && (
            <div className="game-sidebar-left">
              <TextChat />
            </div>
          )}
          <div className="game-board-area">
            <Board />
          </div>
          <div className="game-sidebar-right">
            <TradePanel />
          </div>
        </div>
        <PlayerPanel />

        {!tutorialMode && showDiscard && <DiscardModal player={myPlayer} />}
        {!tutorialMode && showSteal && <StealModal targets={gameState.stealTargets} players={gameState.players} />}

        {!tutorialMode && state.error && (
          <div className="game-error-toast" onClick={() => state.dispatch?.({ type: 'CLEAR_ERROR' })}>
            {state.error}
          </div>
        )}

        {tutorialMode ? <ExitTutorialButton /> : <LeaveGameButton />}
        {!tutorialMode && <HelpButton />}
        <TutorialOverlay />
      </div>
    </TutorialProvider>
  );
}
