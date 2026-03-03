import { useState, useEffect } from 'react';
import { useGameActions } from '../hooks/useGameActions';
import { useGame } from '../context/GameContext';
import { useSocketContext } from '../context/SocketContext';
import { generateDemoGameState, TUTORIAL_PLAYER_ID } from '../utils/demoGameState';
import './LobbyScreen.css';

export default function LobbyScreen() {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('catan_playerName') || '');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const actions = useGameActions();
  const { state, dispatch } = useGame();
  const { connected } = useSocketContext();

  const handleTutorial = () => {
    const gameState = generateDemoGameState();
    dispatch({
      type: 'START_TUTORIAL',
      payload: { playerId: TUTORIAL_PLAYER_ID, gameState },
    });
  };

  // Check URL for room code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
      setMode('join');
    }
  }, []);

  const saveName = (name) => {
    localStorage.setItem('catan_playerName', name);
  };

  const handleCreate = () => {
    if (!playerName.trim()) return;
    saveName(playerName.trim());
    actions.createRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    saveName(playerName.trim());
    actions.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleQuickPlay = () => {
    if (!playerName.trim()) return;
    saveName(playerName.trim());
    actions.quickPlay(playerName.trim());
  };

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
                onKeyDown={e => e.key === 'Enter' && playerName.trim() && handleQuickPlay()}
              />
            </div>
            <button className="btn btn-primary lobby-btn lobby-browse-btn" onClick={handleQuickPlay} disabled={!playerName.trim()}>
              Play Online
            </button>
            <div className="lobby-divider">
              <span>OR</span>
            </div>
            <div className="lobby-buttons">
              <button className="btn btn-secondary lobby-btn" onClick={() => playerName.trim() && setMode('create')} disabled={!playerName.trim()}>
                Create Private Room
              </button>
              <button className="btn btn-secondary lobby-btn" onClick={() => playerName.trim() && setMode('join')} disabled={!playerName.trim()}>
                Join by Code
              </button>
            </div>
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
            <button className="btn btn-primary lobby-btn" onClick={handleCreate} disabled={!playerName.trim()}>
              Create Private Game
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
          <button className="lobby-tutorial-btn" onClick={handleTutorial}>
            How to Play
          </button>
          <p>2-4 Players</p>
        </div>
      </div>
    </div>
  );
}
