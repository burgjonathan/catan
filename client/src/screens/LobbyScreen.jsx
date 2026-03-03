import { useState, useEffect } from 'react';
import { useGameActions } from '../hooks/useGameActions';
import { useGame } from '../context/GameContext';
import { useSocketContext } from '../context/SocketContext';
import RoomBrowser from './RoomBrowser';
import './LobbyScreen.css';

export default function LobbyScreen() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(null); // null, 'create', 'join', 'browse'
  const [isPublic, setIsPublic] = useState(false);
  const [roomName, setRoomName] = useState('');
  const actions = useGameActions();
  const { state } = useGame();
  const { connected } = useSocketContext();

  // Check URL for room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
      setMode('join');
    }
  }, []);

  const handleCreate = () => {
    if (!playerName.trim()) return;
    if (isPublic) {
      if (!roomName.trim()) return;
      actions.createPublicRoom(playerName.trim(), roomName.trim());
    } else {
      actions.createRoom(playerName.trim());
    }
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    actions.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  if (mode === 'browse' && connected) {
    return <RoomBrowser playerName={playerName.trim()} onBack={() => setMode(null)} />;
  }

  return (
    <div className="lobby-screen">
      <div className="lobby-bg-hex hex-1" />
      <div className="lobby-bg-hex hex-2" />
      <div className="lobby-bg-hex hex-3" />

      <div className="lobby-container">
        <div className="lobby-header">
          <h1 className="lobby-title">CATAN</h1>
          <p className="lobby-subtitle">Online Board Game</p>
        </div>

        {!connected && (
          <div className="lobby-connecting">Connecting to server...</div>
        )}

        {state.error && (
          <div className="lobby-error">{state.error}</div>
        )}

        {mode === null && connected && (
          <div className="lobby-actions">
            <div className="lobby-name-input">
              <label>Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && playerName.trim() && setMode('create')}
              />
            </div>
            <div className="lobby-buttons">
              <button className="btn btn-primary lobby-btn" onClick={() => playerName.trim() && setMode('create')} disabled={!playerName.trim()}>
                Create Room
              </button>
              <button className="btn btn-secondary lobby-btn" onClick={() => playerName.trim() && setMode('join')} disabled={!playerName.trim()}>
                Join by Code
              </button>
            </div>
            <div className="lobby-divider">
              <span>OR</span>
            </div>
            <button className="btn btn-primary lobby-btn lobby-browse-btn" onClick={() => playerName.trim() && setMode('browse')} disabled={!playerName.trim()}>
              Browse Public Games
            </button>
          </div>
        )}

        {mode === 'create' && connected && (
          <div className="lobby-actions">
            <div className="lobby-name-input">
              <label>Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>
            <label className="public-toggle">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
              <span>Public room (visible to all players)</span>
            </label>
            {isPublic && (
              <div className="lobby-name-input">
                <label>Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. Beginners Welcome"
                  maxLength={30}
                />
              </div>
            )}
            <button
              className="btn btn-primary lobby-btn"
              onClick={handleCreate}
              disabled={!playerName.trim() || (isPublic && !roomName.trim())}
            >
              Create New Game
            </button>
            <button className="btn btn-secondary lobby-btn" onClick={() => setMode(null)}>
              Back
            </button>
          </div>
        )}

        {mode === 'join' && connected && (
          <div className="lobby-actions">
            <div className="lobby-name-input">
              <label>Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>
            <div className="lobby-name-input">
              <label>Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-letter code"
                maxLength={6}
                className="room-code-input"
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <button className="btn btn-primary lobby-btn" onClick={handleJoin} disabled={!playerName.trim() || roomCode.length < 6}>
              Join Game
            </button>
            <button className="btn btn-secondary lobby-btn" onClick={() => setMode(null)}>
              Back
            </button>
          </div>
        )}

        <div className="lobby-footer">
          <p>2-4 Players</p>
        </div>
      </div>
    </div>
  );
}
