import { useState } from 'react';
import { useGameActions } from '../../hooks/useGameActions';
import { RESOURCES, RESOURCE_ICONS } from 'shared/constants.js';
import './Modal.css';

export default function DiscardModal({ player }) {
  const actions = useGameActions();
  const [discards, setDiscards] = useState({});

  const totalResources = Object.values(player.resources).reduce((a, b) => a + b, 0);
  const mustDiscard = Math.floor(totalResources / 2);
  const currentDiscard = Object.values(discards).reduce((a, b) => a + b, 0);

  const handleSubmit = () => {
    if (currentDiscard !== mustDiscard) return;
    actions.discardResources(discards);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Discard Resources</h3>
        <p className="modal-desc">
          You have {totalResources} cards. Discard {mustDiscard} cards.
        </p>
        <div className="discard-list">
          {RESOURCES.map(r => (
            <div key={r} className="discard-row">
              <span className="discard-icon">{RESOURCE_ICONS[r]}</span>
              <span className="discard-name">{r}</span>
              <span className="discard-have">({player.resources[r]})</span>
              <div className="trade-counter">
                <button
                  onClick={() => setDiscards(d => ({ ...d, [r]: Math.max(0, (d[r] || 0) - 1) }))}
                  disabled={!discards[r]}
                >-</button>
                <span>{discards[r] || 0}</span>
                <button
                  onClick={() => setDiscards(d => ({ ...d, [r]: Math.min(player.resources[r], (d[r] || 0) + 1) }))}
                  disabled={(discards[r] || 0) >= player.resources[r] || currentDiscard >= mustDiscard}
                >+</button>
              </div>
            </div>
          ))}
        </div>
        <p className="discard-count">{currentDiscard} / {mustDiscard} selected</p>
        <button
          className="btn btn-primary modal-btn"
          onClick={handleSubmit}
          disabled={currentDiscard !== mustDiscard}
        >
          Discard
        </button>
      </div>
    </div>
  );
}
