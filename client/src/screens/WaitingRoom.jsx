import { useGame } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import './WaitingRoom.css';

export default function WaitingRoom() {
  const { state } = useGame();
  const actions = useGameActions();
  const { roomCode, players, playerId } = state;

  const isHost = players[0]?.id === playerId;
  const canStart = players.length >= 2;
  const shareLink = `${window.location.origin}?room=${roomCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  return (
    <div className="waiting-screen">
      <div className="waiting-container">
        <h2 className="waiting-title">Game Lobby</h2>

        <div className="room-code-display">
          <span className="room-code-label">Room Code</span>
          <div className="room-code-value" onClick={copyCode} title="Click to copy">
            {roomCode}
          </div>
          <button className="btn btn-secondary copy-btn" onClick={copyLink}>
            Copy Invite Link
          </button>
        </div>

        <div className="players-list">
          <h3>Players ({players.length}/4)</h3>
          {players.map((p, i) => (
            <div key={p.id} className="player-item">
              <div className="player-color" style={{ background: p.color }} />
              <span className="player-name">
                {p.name}
                {p.id === playerId && <span className="you-badge">You</span>}
                {p.isHost && <span className="host-badge">Host</span>}
              </span>
              <span className="player-color-name">{p.colorName}</span>
            </div>
          ))}
          {Array.from({ length: 4 - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="player-item empty">
              <div className="player-color empty-color" />
              <span className="player-name">Waiting for player...</span>
            </div>
          ))}
        </div>

        <div className="waiting-actions">
          {isHost && (
            <button
              className="btn btn-primary start-btn"
              onClick={() => actions.startGame()}
              disabled={!canStart}
            >
              {canStart ? 'Start Game' : 'Need at least 2 players'}
            </button>
          )}
          {!isHost && (
            <p className="waiting-msg">Waiting for host to start the game...</p>
          )}
          <button className="btn btn-secondary" onClick={() => actions.leaveRoom()}>
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
