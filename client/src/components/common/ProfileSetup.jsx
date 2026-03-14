import { useState } from 'react';
import './ProfileSetup.css';

const AVATAR_CATEGORIES = [
  {
    label: 'Animals',
    emojis: ['🐱', '🐶', '🐺', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸', '🐙', '🦉', '🐧', '🦄', '🐲', '🦈'],
  },
  {
    label: 'Cool',
    emojis: ['😎', '🤠', '🥷', '🧙', '👑', '💀', '🎭', '🤖', '👽', '🦸', '🧛', '🧟', '🏴‍☠️', '⚡', '🔥'],
  },
  {
    label: 'Funny',
    emojis: ['🤡', '🥸', '🤪', '😈', '👻', '🎃', '🍕', '🌮', '🍩', '🧀', '🥑', '🍄', '🌵', '🎪', '💩'],
  },
];

export default function ProfileSetup({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile?.name || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');

  const nameLocked = profile?.nameLocked || false;
  const lockedUntil = profile?.lockedUntil || null;

  const formatLockedDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString();
  };

  const handleSave = () => {
    if (!name.trim() && !avatar) return;
    onSave(name.trim() || null, avatar || null);
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={e => e.stopPropagation()}>
        <h2>Edit Profile</h2>

        <div className="profile-field">
          <label>Nickname</label>
          <div className="profile-name-row">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              disabled={nameLocked}
            />
            {nameLocked && <span className="profile-lock-icon">🔒</span>}
          </div>
          {nameLocked && lockedUntil && (
            <div className="profile-lock-msg">
              Name locked until {formatLockedDate(lockedUntil)}
            </div>
          )}
        </div>

        <div className="profile-field">
          <label>Avatar</label>
          {avatar && <div className="profile-current-avatar">{avatar}</div>}
          {AVATAR_CATEGORIES.map(cat => (
            <div key={cat.label} className="avatar-category">
              <div className="avatar-category-label">{cat.label}</div>
              <div className="avatar-grid">
                {cat.emojis.map(emoji => (
                  <button
                    key={emoji}
                    className={`avatar-option ${avatar === emoji ? 'selected' : ''}`}
                    onClick={() => setAvatar(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="profile-actions">
          <button className="profile-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="profile-save-btn"
            onClick={handleSave}
            disabled={!name.trim() && !avatar}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
