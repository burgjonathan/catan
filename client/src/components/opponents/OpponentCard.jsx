import './OpponentCard.css';

export default function OpponentCard({ player, isCurrentTurn, hasLongestRoad, hasLargestArmy }) {
  return (
    <div className={`opponent-card ${isCurrentTurn ? 'active-turn' : ''}`}>
      <div className="opponent-header">
        <div className="opponent-color" style={{ background: player.color }} />
        {player.avatar && <span className="opponent-avatar">{player.avatar}</span>}
        <span className="opponent-name">{player.name}{player.isBot ? ' [BOT]' : ''}</span>
      </div>
      <div className="opponent-stats">
        <div className="opponent-stat" title="Resource Cards">
          <span className="stat-icon">🃏</span>
          <span>{player.resourceCount ?? '?'}</span>
        </div>
        <div className="opponent-stat" title="Development Cards">
          <span className="stat-icon">📜</span>
          <span>{player.devCardCount ?? 0}</span>
        </div>
        <div className="opponent-stat" title="Knights Played">
          <span className="stat-icon">⚔️</span>
          <span>{player.playedKnights || 0}</span>
        </div>
      </div>
      <div className="opponent-badges">
        {hasLongestRoad && <span className="badge road-badge">Longest Road</span>}
        {hasLargestArmy && <span className="badge army-badge">Largest Army</span>}
      </div>
    </div>
  );
}
