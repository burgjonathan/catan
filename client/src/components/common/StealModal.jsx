import { useGameActions } from '../../hooks/useGameActions';
import './Modal.css';

export default function StealModal({ targets, players }) {
  const actions = useGameActions();

  const targetPlayers = targets.map(id => players.find(p => p.id === id)).filter(Boolean);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Steal a Resource</h3>
        <p className="modal-desc">Choose a player to steal from:</p>
        <div className="steal-targets">
          {targetPlayers.map(p => (
            <button
              key={p.id}
              className="steal-target-btn"
              onClick={() => actions.stealResource(p.id)}
            >
              <div className="steal-color" style={{ background: p.color }} />
              <span>{p.name}</span>
              <span className="steal-cards">{p.resourceCount ?? '?'} cards</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
