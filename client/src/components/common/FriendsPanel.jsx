import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import './FriendsPanel.css';

export default function FriendsPanel({ onInvite }) {
  const { state } = useGame();
  const actions = useGameActions();
  const { friendCode, friendsList } = state;
  const [open, setOpen] = useState(false);
  const [addCode, setAddCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      actions.getFriendCode(state.playerName);
      actions.getFriends();
    }
  }, [open]);

  const handleAdd = () => {
    if (!addCode.trim()) return;
    actions.addFriend(addCode.trim());
    setAddCode('');
  };

  const handleCopy = () => {
    if (friendCode) {
      navigator.clipboard.writeText(friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onlineFriends = friendsList.filter(f => f.online);

  return (
    <div className="friends-panel-wrap">
      <button className="friends-toggle-btn" onClick={() => setOpen(!open)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Friends
        {onlineFriends.length > 0 && (
          <span className="friends-online-badge">{onlineFriends.length}</span>
        )}
      </button>

      {open && (
        <div className="friends-dropdown">
          <div className="friends-header">
            <h3>Friends</h3>
            <button className="friends-close-btn" onClick={() => setOpen(false)}>&times;</button>
          </div>

          <div className="friends-code-section">
            <label>Your Friend Code</label>
            <div className="friends-code-row">
              <span className="friends-code">{friendCode || '...'}</span>
              <button className="btn btn-secondary btn-xs" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="friends-add-section">
            <label>Add Friend</label>
            <div className="friends-add-row">
              <input
                type="text"
                className="friends-add-input"
                placeholder="Enter code"
                value={addCode}
                onChange={e => setAddCode(e.target.value.toUpperCase())}
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button className="btn btn-primary btn-xs" onClick={handleAdd} disabled={!addCode.trim()}>
                Add
              </button>
            </div>
          </div>

          <div className="friends-list-section">
            {friendsList.length === 0 ? (
              <div className="friends-empty">
                No friends yet. Share your code to connect!
              </div>
            ) : (
              <ul className="friends-list">
                {friendsList
                  .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
                  .map(friend => (
                    <li key={friend.sessionId} className="friends-list-item">
                      <div className="friends-list-info">
                        <span className={`friends-status-dot ${friend.online ? 'online' : 'offline'}`} />
                        <span className="friends-name">{friend.name}</span>
                      </div>
                      <div className="friends-list-actions">
                        {onInvite && friend.online && (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => actions.inviteFriend(friend.sessionId)}
                          >
                            Invite
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => actions.removeFriend(friend.sessionId)}
                          title="Remove friend"
                        >
                          &times;
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
