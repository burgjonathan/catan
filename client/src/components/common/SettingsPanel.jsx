import { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import './SettingsPanel.css';

export default function SettingsPanel() {
  const {
    musicOn, sfxOn, musicVolume, toggleMusic, toggleSfx, changeMusicVolume,
    voiceChatMuted, chatMessagesMuted, toggleVoiceChatMute, toggleChatMessagesMute
  } = useAudio();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="settings-controls">
      <button
        className="settings-toggle-btn"
        onClick={() => setExpanded(prev => !prev)}
        title="Settings"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="3" />
          <path d="M10 1.5v2M10 16.5v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1.5 10h2M16.5 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" />
        </svg>
      </button>

      {expanded && (
        <div className="settings-panel">
          <div className="settings-section-title">Audio</div>

          <div className="settings-row">
            <span className="settings-label">Music</span>
            <button
              className={`settings-switch ${musicOn ? 'on' : ''}`}
              onClick={toggleMusic}
            >
              <span className="settings-switch-knob" />
            </button>
          </div>

          {musicOn && (
            <div className="settings-row volume-row">
              <span className="settings-label">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => changeMusicVolume(parseFloat(e.target.value))}
                className="settings-slider"
              />
            </div>
          )}

          <div className="settings-row">
            <span className="settings-label">Sound FX</span>
            <button
              className={`settings-switch ${sfxOn ? 'on' : ''}`}
              onClick={toggleSfx}
            >
              <span className="settings-switch-knob" />
            </button>
          </div>

          <div className="settings-section-title">Chat</div>

          <div className="settings-row">
            <span className="settings-label">Voice Chat</span>
            <button
              className={`settings-switch ${!voiceChatMuted ? 'on' : ''}`}
              onClick={toggleVoiceChatMute}
            >
              <span className="settings-switch-knob" />
            </button>
          </div>

          <div className="settings-row">
            <span className="settings-label">Chat Messages</span>
            <button
              className={`settings-switch ${!chatMessagesMuted ? 'on' : ''}`}
              onClick={toggleChatMessagesMute}
            >
              <span className="settings-switch-knob" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
