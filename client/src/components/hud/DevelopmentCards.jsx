import { useState } from 'react';
import { RESOURCES, RESOURCE_ICONS } from 'shared/constants.js';
import './DevelopmentCards.css';

const CARD_INFO = {
  knight: {
    name: 'Knight',
    icon: '\u2694\uFE0F',
    color: '#c0392b',
    description: 'Move the robber to any hex tile. Then steal 1 random resource card from a player who has a settlement or city adjacent to that hex.',
  },
  victoryPoint: {
    name: 'Victory Point',
    icon: '\u2B50',
    color: '#f1c40f',
    description: 'This card is worth 1 Victory Point. It is automatically counted toward your score and cannot be played.',
  },
  roadBuilding: {
    name: 'Road Building',
    icon: '\uD83D\uDEE4\uFE0F',
    color: '#27ae60',
    description: 'Place 2 roads for free anywhere on the board, following normal road placement rules. No resources needed.',
  },
  yearOfPlenty: {
    name: 'Year of Plenty',
    icon: '\uD83C\uDF3E',
    color: '#e67e22',
    description: 'Take any 2 resource cards from the bank. You may pick the same resource twice or 2 different ones.',
  },
  monopoly: {
    name: 'Monopoly',
    icon: '\uD83D\uDCB0',
    color: '#8e44ad',
    description: 'Name 1 resource type. Every other player must give you ALL of their cards of that resource type.',
  },
};

function DevCardVisual({ type, isNew, small }) {
  const info = CARD_INFO[type];
  return (
    <div className={`dev-card-visual ${small ? 'small' : ''} ${isNew ? 'is-new' : ''}`}
         style={{ borderColor: info.color }}>
      <div className="dev-card-visual-icon">{info.icon}</div>
      {!small && <div className="dev-card-visual-name">{info.name}</div>}
      {isNew && <div className="dev-card-new-tag">NEW</div>}
    </div>
  );
}

function DevCardDetail({ type, canPlay, onUse, onClose }) {
  const info = CARD_INFO[type];
  const isVP = type === 'victoryPoint';

  return (
    <div className="dev-card-detail" onClick={e => e.stopPropagation()}>
      <div className="dev-card-detail-header" style={{ borderBottomColor: info.color }}>
        <span className="dev-card-detail-icon">{info.icon}</span>
        <span className="dev-card-detail-name">{info.name}</span>
      </div>
      <p className="dev-card-detail-desc">{info.description}</p>
      <div className="dev-card-detail-actions">
        {isVP ? (
          <div className="dev-vp-notice" style={{ color: '#f1c40f', fontSize: '13px', fontWeight: 600 }}>
            Already counted in your score
          </div>
        ) : (
          <button
            className="btn btn-primary dev-use-btn"
            disabled={!canPlay}
            onClick={onUse}
          >
            {canPlay ? 'Use Card' : 'Cannot use now'}
          </button>
        )}
        <button className="btn btn-secondary dev-close-detail-btn" onClick={onClose}>Back</button>
      </div>
    </div>
  );
}

export default function DevelopmentCards({ cards, newCards, canPlay, onPlay }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [viewingCard, setViewingCard] = useState(null);
  const [showPicker, setShowPicker] = useState(null);

  const allPlayable = [...cards];
  const allNew = [...newCards];
  const totalCount = allPlayable.length + allNew.length;

  const handleUseCard = (cardType) => {
    setViewingCard(null);
    if (cardType === 'yearOfPlenty') {
      setShowPicker({ type: 'yearOfPlenty' });
    } else if (cardType === 'monopoly') {
      setShowPicker({ type: 'monopoly' });
    } else {
      onPlay(cardType, {});
      setPanelOpen(false);
    }
  };

  const handlePickerDone = (cardType, params) => {
    onPlay(cardType, params);
    setShowPicker(null);
    setPanelOpen(false);
  };

  if (totalCount === 0 && !showPicker) return null;

  return (
    <div className="dev-cards-wrapper">
      {/* Stack indicator - always visible */}
      <button className="dev-card-stack" onClick={() => setPanelOpen(true)} title="Development Cards">
        <div className="dev-card-stack-cards">
          {totalCount > 2 && <div className="dev-stack-layer layer-3" />}
          {totalCount > 1 && <div className="dev-stack-layer layer-2" />}
          <div className="dev-stack-layer layer-1" />
        </div>
        <span className="dev-card-stack-count">{totalCount}</span>
        {allNew.length > 0 && <span className="dev-card-stack-new">{allNew.length} new</span>}
      </button>

      {/* Full card panel overlay */}
      {panelOpen && (
        <div className="dev-panel-overlay" onClick={() => { setPanelOpen(false); setViewingCard(null); }}>
          <div className="dev-panel" onClick={e => e.stopPropagation()}>
            <div className="dev-panel-header">
              <h3>Development Cards</h3>
              <button className="dev-panel-close" onClick={() => { setPanelOpen(false); setViewingCard(null); }}>&times;</button>
            </div>

            {viewingCard ? (
              <DevCardDetail
                type={viewingCard}
                canPlay={canPlay && viewingCard !== 'victoryPoint' && allPlayable.includes(viewingCard)}
                onUse={() => handleUseCard(viewingCard)}
                onClose={() => setViewingCard(null)}
              />
            ) : (
              <div className="dev-panel-body">
                {allPlayable.length > 0 && (
                  <div className="dev-panel-section">
                    <div className="dev-panel-section-label">Ready to play</div>
                    <div className="dev-panel-grid">
                      {allPlayable.map((type, i) => (
                        <button key={`p-${i}`} className="dev-panel-card" onClick={() => setViewingCard(type)}>
                          <DevCardVisual type={type} />
                          {canPlay && type !== 'victoryPoint' && (
                            <div className="dev-card-use-hint">Click to view</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {allNew.length > 0 && (
                  <div className="dev-panel-section">
                    <div className="dev-panel-section-label">Bought this turn (playable next turn)</div>
                    <div className="dev-panel-grid">
                      {allNew.map((type, i) => (
                        <button key={`n-${i}`} className="dev-panel-card disabled" onClick={() => setViewingCard(type)}>
                          <DevCardVisual type={type} isNew />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {totalCount === 0 && (
                  <p className="dev-panel-empty">No development cards yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource pickers */}
      {showPicker?.type === 'yearOfPlenty' && (
        <YearOfPlentyPicker
          onSelect={(r1, r2) => handlePickerDone('yearOfPlenty', { resource1: r1, resource2: r2 })}
          onCancel={() => setShowPicker(null)}
        />
      )}
      {showPicker?.type === 'monopoly' && (
        <MonopolyPicker
          onSelect={(r) => handlePickerDone('monopoly', { resource: r })}
          onCancel={() => setShowPicker(null)}
        />
      )}
    </div>
  );
}

function YearOfPlentyPicker({ onSelect, onCancel }) {
  const [r1, setR1] = useState(null);

  return (
    <div className="resource-picker-overlay" onClick={onCancel}>
      <div className="resource-picker" onClick={e => e.stopPropagation()}>
        <h4>{!r1 ? 'Year of Plenty — Pick 1st resource' : 'Year of Plenty — Pick 2nd resource'}</h4>
        <div className="picker-resources">
          {RESOURCES.map(r => (
            <button key={r} className={`picker-btn ${r1 === r ? 'selected' : ''}`}
              onClick={() => {
                if (!r1) setR1(r);
                else onSelect(r1, r);
              }}>
              <span className="picker-btn-icon">{RESOURCE_ICONS[r]}</span>
              <span>{r}</span>
            </button>
          ))}
        </div>
        {r1 && <p className="picker-selection">First pick: <strong>{r1}</strong></p>}
      </div>
    </div>
  );
}

function MonopolyPicker({ onSelect, onCancel }) {
  return (
    <div className="resource-picker-overlay" onClick={onCancel}>
      <div className="resource-picker" onClick={e => e.stopPropagation()}>
        <h4>Monopoly — Pick a resource to steal</h4>
        <div className="picker-resources">
          {RESOURCES.map(r => (
            <button key={r} className="picker-btn" onClick={() => onSelect(r)}>
              <span className="picker-btn-icon">{RESOURCE_ICONS[r]}</span>
              <span>{r}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
