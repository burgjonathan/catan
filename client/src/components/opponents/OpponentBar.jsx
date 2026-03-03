import { useGame } from '../../context/GameContext';
import OpponentCard from './OpponentCard';
import './OpponentBar.css';

export default function OpponentBar() {
  const { state } = useGame();
  const { gameState, playerId } = state;

  if (!gameState) return null;

  const opponents = gameState.players.filter(p => p.id !== playerId);

  return (
    <div className="opponent-bar">
      {opponents.map(p => (
        <OpponentCard
          key={p.id}
          player={p}
          isCurrentTurn={gameState.players[gameState.currentPlayerIndex]?.id === p.id}
          hasLongestRoad={gameState.longestRoad.playerId === p.id}
          hasLargestArmy={gameState.largestArmy.playerId === p.id}
        />
      ))}
    </div>
  );
}
