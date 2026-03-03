import { useState } from 'react';
import { useGameActions } from '../../hooks/useGameActions';
import { RESOURCES, RESOURCE_ICONS } from 'shared/constants.js';
import './BankTrade.css';

export default function BankTrade({ canTrade, resources, ports }) {
  const actions = useGameActions();
  const [givingResource, setGivingResource] = useState(null);
  const [receivingResource, setReceivingResource] = useState(null);

  const getTradeRatio = (resource) => {
    if (ports.includes(resource)) return 2;
    if (ports.includes('3:1')) return 3;
    return 4;
  };

  const handleTrade = () => {
    if (!givingResource || !receivingResource || givingResource === receivingResource) return;
    const ratio = getTradeRatio(givingResource);
    actions.tradeWithBank(givingResource, ratio, receivingResource);
    setGivingResource(null);
    setReceivingResource(null);
  };

  const ratio = givingResource ? getTradeRatio(givingResource) : 4;
  const canAfford = givingResource && resources && resources[givingResource] >= ratio;

  return (
    <div className="bank-trade">
      <div className="bank-section">
        <h4>Give ({ratio}:1)</h4>
        <div className="bank-resources">
          {RESOURCES.map(r => {
            const rRatio = getTradeRatio(r);
            return (
              <button
                key={r}
                className={`bank-res-btn ${givingResource === r ? 'selected' : ''}`}
                onClick={() => setGivingResource(r)}
                disabled={(resources?.[r] || 0) < rRatio}
              >
                <span>{RESOURCE_ICONS[r]}</span>
                <span className="bank-res-name">{r}</span>
                <span className="bank-res-ratio">{rRatio}:1</span>
                <span className="bank-res-have">{resources?.[r] || 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bank-arrow">↓</div>

      <div className="bank-section">
        <h4>Receive</h4>
        <div className="bank-resources">
          {RESOURCES.map(r => (
            <button
              key={r}
              className={`bank-res-btn ${receivingResource === r ? 'selected' : ''}`}
              onClick={() => setReceivingResource(r)}
              disabled={r === givingResource}
            >
              <span>{RESOURCE_ICONS[r]}</span>
              <span className="bank-res-name">{r}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary bank-trade-btn"
        onClick={handleTrade}
        disabled={!canTrade || !canAfford || !receivingResource || givingResource === receivingResource}
      >
        Trade with Bank
      </button>
    </div>
  );
}
