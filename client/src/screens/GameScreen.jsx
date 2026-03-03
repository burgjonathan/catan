import { useGame } from '../context/GameContext';
import Board from '../components/board/Board';
import PlayerPanel from '../components/hud/PlayerPanel';
import ScoreBoard from '../components/hud/ScoreBoard';
import OpponentBar from '../components/opponents/OpponentBar';
import TradePanel from '../components/trade/TradePanel';
import VideoChat from '../components/chat/VideoChat';
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

export default function GameScreen() {
  const { state } = useGame();
  const { gameState, playerId } = state;

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
          <div className="game-sidebar-left">
            <VideoChat />
            <TextChat />
          </div>
          <div className="game-board-area">
            <Board />
          </div>
          <div className="game-sidebar-right">
            <TradePanel />
          </div>
        </div>
        <PlayerPanel />

        {showDiscard && <DiscardModal player={myPlayer} />}
        {showSteal && <StealModal targets={gameState.stealTargets} players={gameState.players} />}

        {state.error && (
          <div className="game-error-toast" onClick={() => state.dispatch?.({ type: 'CLEAR_ERROR' })}>
            {state.error}
          </div>
        )}

        <HelpButton />
        <TutorialOverlay />
      </div>
    </TutorialProvider>
  );
}
