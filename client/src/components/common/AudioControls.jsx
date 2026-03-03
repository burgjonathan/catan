import { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import './AudioControls.css';

export default function AudioControls() {
  const { musicOn, sfxOn, musicVolume, toggleMusic, toggleSfx, changeMusicVolume } = useAudio();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="audio-controls">
      <button
        className="audio-toggle-btn"
        onClick={() => setExpanded(prev => !prev)}
        title="Audio Settings"
      >
        {musicOn || sfxOn ? '🔊' : '🔇'}
      </button>

      {expanded && (
        <div className="audio-panel">
          <div className="audio-panel-title">Audio</div>

          <div className="audio-row">
            <span className="audio-label">Music</span>
            <button
              className={`audio-switch ${musicOn ? 'on' : ''}`}
              onClick={toggleMusic}
            >
              <span className="audio-switch-knob" />
            </button>
          </div>

          {musicOn && (
            <div className="audio-row volume-row">
              <span className="audio-label">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => changeMusicVolume(parseFloat(e.target.value))}
                className="audio-slider"
              />
            </div>
          )}

          <div className="audio-row">
            <span className="audio-label">Sound FX</span>
            <button
              className={`audio-switch ${sfxOn ? 'on' : ''}`}
              onClick={toggleSfx}
            >
              <span className="audio-switch-knob" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
