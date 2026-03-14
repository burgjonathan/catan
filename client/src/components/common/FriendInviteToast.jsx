import { useGame } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import './FriendInviteToast.css';

export default function FriendInviteToast() {
  const { state } = useGame();
  const actions = useGameActions();
  const { friendInvite } = state;

  if (!friendInvite) return null;

  const handleJoin = () => {
    actions.joinRoom(friendInvite.roomCode, state.playerName);
    actions.dismissInvite();
  };

  const handleDismiss = () => {
    actions.dismissInvite();
  };

  return (
    <div className="friend-invite-toast">
      <div className="friend-invite-content">
        <div className="friend-invite-text">
          <strong>{friendInvite.fromName}</strong> invited you to play!
        </div>
        <div className="friend-invite-actions">
          <button className="btn btn-primary btn-xs" onClick={handleJoin}>Join</button>
          <button className="btn btn-secondary btn-xs" onClick={handleDismiss}>Decline</button>
        </div>
      </div>
    </div>
  );
}
