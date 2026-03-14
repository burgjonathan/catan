import { useGame } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import './UndoVoteModal.css';

export default function UndoVoteModal() {
  const { state } = useGame();
  const actions = useGameActions();
  const { undoRequest, playerId } = state;

  if (!undoRequest) return null;

  const isRequester = undoRequest.requesterId === playerId;
  const myVote = undoRequest.votes[playerId];
  const needsMyVote = myVote === 'pending';

  const voters = Object.entries(undoRequest.votes).map(([id, vote]) => {
    const player = state.gameState?.players?.find(p => p.id === id);
    return { id, name: player?.name || 'Unknown', vote, color: player?.color };
  });

  return (
    <div className="undo-modal-overlay">
      <div className="undo-modal">
        <h3 className="undo-modal-title">Undo Request</h3>
        <p className="undo-modal-desc">
          <strong style={{ color: '#f1c40f' }}>{undoRequest.requesterName}</strong> wants to undo: <em>{undoRequest.actionDesc}</em>
        </p>
        <p className="undo-modal-sub">
          {undoRequest.actionPlayerName !== undoRequest.requesterName
            ? `(action by ${undoRequest.actionPlayerName})`
            : ''}
        </p>

        <div className="undo-votes">
          {voters.map(v => (
            <div key={v.id} className="undo-vote-row">
              <span className="undo-vote-color" style={{ background: v.color }} />
              <span className="undo-vote-name">{v.name}</span>
              <span className={`undo-vote-status ${v.vote}`}>
                {v.vote === 'accepted' ? 'Accepted' : v.vote === 'rejected' ? 'Rejected' : 'Pending...'}
              </span>
            </div>
          ))}
        </div>

        {needsMyVote && (
          <div className="undo-modal-actions">
            <button className="btn btn-primary" onClick={() => actions.undoAccept()}>
              Accept
            </button>
            <button className="btn btn-danger" onClick={() => actions.undoReject()}>
              Reject
            </button>
          </div>
        )}

        {isRequester && !needsMyVote && (
          <p className="undo-modal-waiting">Waiting for other players to vote...</p>
        )}
      </div>
    </div>
  );
}
