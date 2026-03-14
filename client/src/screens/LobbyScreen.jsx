import { useState, useEffect } from 'react';
import { useGameActions } from '../hooks/useGameActions';
import { useGame } from '../context/GameContext';
import { useSocketContext } from '../context/SocketContext';
import { generateDemoGameState, TUTORIAL_PLAYER_ID } from '../utils/demoGameState';
import { isAdmin } from './AdminDashboard';
import FriendsPanel from '../components/common/FriendsPanel';
import ProfileSetup from '../components/common/ProfileSetup';
import './LobbyScreen.css';

export default function LobbyScreen({ onShowAdmin }) {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('catan_playerName') || '');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(null); // null, 'create', 'join', 'bots'
  const [botCount, setBotCount] = useState(1);
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [showProfile, setShowProfile] = useState(false);
  const actions = useGameActions();
  const { state, dispatch } = useGame();
  const { connected } = useSocketContext();

  const profile = state.profile;
  const profileAvatar = profile?.avatar || null;

  // Fetch profile on mount when connected
  useEffect(() => {
    if (connected) {
      actions.getProfile();
    }
  }, [connected]);

  // Sync profile name to local state when profile loads
  useEffect(() => {
    if (profile?.name && !playerName) {
      setPlayerName(profile.name);
      localStorage.setItem('catan_playerName', profile.name);
    }
  }, [profile]);

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
    actions.setProfile(playerName.trim(), profileAvatar);
    actions.createRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    saveName(playerName.trim());
    actions.setProfile(playerName.trim(), profileAvatar);
    actions.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleQuickPlay = () => {
    if (!playerName.trim()) return;
    saveName(playerName.trim());
    actions.setProfile(playerName.trim(), profileAvatar);
    actions.quickPlay(playerName.trim());
  };

  const handleBotGame = () => {
    if (!playerName.trim()) return;
    saveName(playerName.trim());
    actions.setProfile(playerName.trim(), profileAvatar);
    actions.createBotGame(playerName.trim(), botCount, botDifficulty);
  };

  const handleSpectate = () => {
    actions.spectateRandom(playerName.trim() || 'Spectator');
  };

  const handleProfileSave = (name, avatar) => {
    if (name) {
      setPlayerName(name);
      saveName(name);
    }
    actions.setProfile(name, avatar);
    setShowProfile(false);
  };

  const nameLocked = profile?.nameLocked || false;

  const nameInputSection = (extraProps = {}) => (
    <div className="lobby-name-input">
      <label>Your Name</label>
      <div className="lobby-name-with-avatar">
        {profileAvatar && (
          <button className="lobby-avatar-display" onClick={() => setShowProfile(true)} title="Edit Profile">
            {profileAvatar}
          </button>
        )}
        <input
          type="text"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          disabled={nameLocked}
          {...extraProps}
        />
        {nameLocked && <span className="lobby-lock-icon">🔒</span>}
        <button className="lobby-profile-btn" onClick={() => setShowProfile(true)} title="Edit Profile">
          {profileAvatar ? 'Edit' : 'Avatar'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="lobby-screen">
      <div className="lobby-bg-hex hex-1" />
      <div className="lobby-bg-hex hex-2" />
      <div className="lobby-bg-hex hex-3" />

      {connected && playerName.trim() && (
        <div className="lobby-friends-wrap">
          <FriendsPanel />
        </div>
      )}

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
            {nameInputSection({ onKeyDown: e => e.key === 'Enter' && playerName.trim() && handleQuickPlay() })}
            <button className="btn btn-primary lobby-btn lobby-browse-btn" onClick={handleQuickPlay} disabled={!playerName.trim()}>
              Play Online
            </button>
            <button className="btn btn-secondary lobby-btn lobby-browse-btn lobby-bot-btn" onClick={() => playerName.trim() && setMode('bots')} disabled={!playerName.trim()}>
              Play vs Bots
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
            <button className="btn btn-secondary lobby-btn lobby-spectate-btn" onClick={handleSpectate}>
              Watch a Live Game
            </button>
          </div>
        )}

        {mode === 'create' && connected && (
          <div className="lobby-actions">
            {nameInputSection()}
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
            {nameInputSection()}
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

        {mode === 'bots' && connected && (
          <div className="lobby-actions">
            {nameInputSection()}
            <div className="lobby-name-input">
              <label>Number of Bots</label>
              <div className="bot-selector">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={`bot-count-btn ${botCount === n ? 'active' : ''}`}
                    onClick={() => setBotCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="lobby-name-input">
              <label>Difficulty</label>
              <div className="bot-difficulty">
                {[
                  { id: 'easy', label: 'Easy', desc: 'Learning the ropes' },
                  { id: 'medium', label: 'Medium', desc: 'Solid competition' },
                  { id: 'hard', label: 'Hard', desc: 'Expert strategist' }
                ].map(d => (
                  <button
                    key={d.id}
                    className={`bot-diff-btn ${botDifficulty === d.id ? 'active' : ''}`}
                    onClick={() => setBotDifficulty(d.id)}
                  >
                    <span className="bot-diff-label">{d.label}</span>
                    <span className="bot-diff-desc">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            {botCount >= 4 && (
              <p className="expansion-hint">5-6 player expansion board</p>
            )}
            <button className="btn btn-primary lobby-btn" onClick={handleBotGame} disabled={!playerName.trim()}>
              Start Game
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
          {isAdmin() && (
            <button className="lobby-tutorial-btn" onClick={onShowAdmin} style={{ marginLeft: 8 }}>
              Analytics
            </button>
          )}
          <p>2-6 Players / Play vs Bots</p>
        </div>
      </div>

      {showProfile && (
        <ProfileSetup
          profile={profile}
          onSave={handleProfileSave}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
