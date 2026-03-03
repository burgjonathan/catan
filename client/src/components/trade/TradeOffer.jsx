import { useState } from 'react';
import { useGameActions } from '../../hooks/useGameActions';
import { RESOURCES, RESOURCE_ICONS } from 'shared/constants.js';
import './TradeOffer.css';

export default function TradeOffer({ canTrade, resources }) {
  const actions = useGameActions();
  const [offering, setOffering] = useState({});
  const [requesting, setRequesting] = useState({});

  const handleSubmit = () => {
    const hasOffer = Object.values(offering).some(v => v > 0);
    const hasRequest = Object.values(requesting).some(v => v > 0);
    if (!hasOffer || !hasRequest) return;
    actions.tradeOffer(offering, requesting);
    setOffering({});
    setRequesting({});
  };

  return (
    <div className="trade-offer">
      <div className="trade-section">
        <h4>I Give</h4>
        {RESOURCES.map(r => (
          <div key={r} className="trade-resource-row">
            <span className="trade-resource-icon">{RESOURCE_ICONS[r]}</span>
            <span className="trade-resource-name">{r}</span>
            <div className="trade-counter">
              <button
                onClick={() => setOffering(o => ({ ...o, [r]: Math.max(0, (o[r] || 0) - 1) }))}
                disabled={!offering[r]}
              >-</button>
              <span>{offering[r] || 0}</span>
              <button
                onClick={() => setOffering(o => ({ ...o, [r]: Math.min(resources?.[r] || 0, (o[r] || 0) + 1) }))}
                disabled={(offering[r] || 0) >= (resources?.[r] || 0)}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="trade-section">
        <h4>I Want</h4>
        {RESOURCES.map(r => (
          <div key={r} className="trade-resource-row">
            <span className="trade-resource-icon">{RESOURCE_ICONS[r]}</span>
            <span className="trade-resource-name">{r}</span>
            <div className="trade-counter">
              <button
                onClick={() => setRequesting(o => ({ ...o, [r]: Math.max(0, (o[r] || 0) - 1) }))}
                disabled={!requesting[r]}
              >-</button>
              <span>{requesting[r] || 0}</span>
              <button
                onClick={() => setRequesting(o => ({ ...o, [r]: (o[r] || 0) + 1 }))}
              >+</button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary trade-submit-btn"
        onClick={handleSubmit}
        disabled={!canTrade}
      >
        Propose Trade
      </button>
    </div>
  );
}
