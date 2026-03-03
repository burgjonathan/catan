import { useGame } from '../../context/GameContext';
import { VP_TO_WIN } from 'shared/constants.js';
import './ScoreBoard.css';

function ScoreEntry({ name, color, vp, isCurrentTurn, badges, align }) {
  return (
    <div className={`score-entry ${isCurrentTurn ? 'current-turn' : ''} ${align}`}>
      <div className="score-entry-header">
        <div className="score-color" style={{ background: color }} />
        <span className="score-name">{name}</span>
        <span className="score-vp">{vp}</span>
      </div>
      <div className="score-pips">
        {Array.from({ length: VP_TO_WIN }, (_, i) => (
          <div
            key={i}
            className={`score-pip ${i < vp ? 'filled' : ''}`}
            style={i < vp ? { background: color } : undefined}
          />
        ))}
      </div>
      {badges.length > 0 && (
        <div className="score-badges">
          {badges.map(b => (
            <span key={b} className={`score-badge ${b === 'Longest Road' ? 'road' : 'army'}`}>{b}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScoreBoard() {
  const { state } = useGame();
  const { gameState, playerId } = state;

  if (!gameState) return null;

  const myPlayer = gameState.players.find(p => p.id === playerId);
  const opponents = gameState.players.filter(p => p.id !== playerId);
  const currentPlayerId = gameState.players[gameState.currentPlayerIndex]?.id;

  const hasLongestRoad = (id) => gameState.longestRoad?.playerId === id;
  const hasLargestArmy = (id) => gameState.largestArmy?.playerId === id;

  const getVP = (player, id) => {
    let vp = (player.settlements?.length || 0) + (player.cities?.length || 0) * 2
      + (hasLongestRoad(id) ? 2 : 0) + (hasLargestArmy(id) ? 2 : 0);
    // Only count hidden VP cards for self
    if (id === playerId) {
      vp += (player.devCards?.filter(c => c === 'victoryPoint').length || 0)
        + (player.newDevCards?.filter(c => c === 'victoryPoint').length || 0);
    }
    return vp;
  };

  const getBadges = (id) => {
    const b = [];
    if (hasLongestRoad(id)) b.push('Longest Road');
    if (hasLargestArmy(id)) b.push('Largest Army');
    return b;
  };

  return (
    <div className="scoreboard">
      <div className="scoreboard-left">
        {opponents.map(p => (
          <ScoreEntry
            key={p.id}
            name={p.name}
            color={p.color}
            vp={getVP(p, p.id)}
            isCurrentTurn={currentPlayerId === p.id}
            badges={getBadges(p.id)}
            align="left"
          />
        ))}
      </div>
      <div className="scoreboard-right">
        {myPlayer && (
          <ScoreEntry
            name="You"
            color={myPlayer.color}
            vp={getVP(myPlayer, playerId)}
            isCurrentTurn={currentPlayerId === playerId}
            badges={getBadges(playerId)}
            align="right"
          />
        )}
      </div>
    </div>
  );
}
