import { useGame } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import FriendsPanel from '../components/common/FriendsPanel';
import TextChat from '../components/chat/TextChat';
import './WaitingRoom.css';

export default function WaitingRoom() {
  const { state } = useGame();
  const actions = useGameActions();
  const { roomCode, players, playerId, isPublic } = state;

  const isHost = players[0]?.id === playerId;
  const canStart = players.length >= 2;
  const shareLink = `${window.location.origin}?room=${roomCode}`;
  const maxPlayers = isPublic ? 4 : 6;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  if (isPublic) {
    return (
      <div className="waiting-screen">
        <div className="waiting-container">
          <h2 className="waiting-title">Finding Players</h2>

          <div className="public-waiting-status">
            <span className="public-player-count">{players.length}/4</span>
            <span className="public-player-label">Players in Game</span>
            <p className="waiting-msg">
              {players.length < 4 ? `Waiting for ${4 - players.length} more...` : 'Starting game...'}
            </p>
          </div>

          <div className="players-list">
            {players.map((p) => (
              <div key={p.id} className="player-item">
                <div className="player-color" style={{ background: p.color }} />
                {p.avatar && <span className="player-avatar">{p.avatar}</span>}
                <span className="player-name">
                  {p.name}
                  {p.id === playerId && <span className="you-badge">You</span>}
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

          <div className="waiting-chat">
            <TextChat />
          </div>

          <div className="waiting-actions">
            <button className="btn btn-secondary" onClick={() => actions.leaveRoom()}>
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {players.length < maxPlayers && (
            <div className="waiting-friends-wrap">
              <FriendsPanel onInvite />
            </div>
          )}
        </div>

        <div className="players-list">
          <h3>Players ({players.length}/{maxPlayers})</h3>
          {players.length > 4 && (
            <p className="expansion-note">5-6 player expansion board</p>
          )}
          {players.map((p) => (
            <div key={p.id} className="player-item">
              <div className="player-color" style={{ background: p.color }} />
              {p.avatar && <span className="player-avatar">{p.avatar}</span>}
              <span className="player-name">
                {p.name}
                {p.id === playerId && <span className="you-badge">You</span>}
                {p.isHost && <span className="host-badge">Host</span>}
              </span>
              <span className="player-color-name">{p.colorName}</span>
            </div>
          ))}
          {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="player-item empty">
              <div className="player-color empty-color" />
              <span className="player-name">Waiting for player...</span>
            </div>
          ))}
        </div>

        <div className="waiting-chat">
          <TextChat />
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
