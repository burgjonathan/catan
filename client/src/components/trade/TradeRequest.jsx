import { useState, useEffect } from 'react';
import { useGameActions } from '../../hooks/useGameActions';
import { RESOURCES, RESOURCE_ICONS } from 'shared/constants.js';
import './TradeRequest.css';

function ResourceList({ resources, label }) {
  const items = Object.entries(resources || {}).filter(([, v]) => v > 0);
  if (items.length === 0) return null;
  return (
    <div className="trade-req-resources">
      <span className="trade-req-label">{label}</span>
      {items.map(([r, amount]) => (
        <span key={r} className="trade-req-item">
          {RESOURCE_ICONS[r]} {amount} {r}
        </span>
      ))}
    </div>
  );
}

export default function TradeRequest({ trade, myResources }) {
  const actions = useGameActions();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [trade?.id]);

  const canAccept = trade.requesting && Object.entries(trade.requesting).every(
    ([r, amount]) => (myResources?.[r] || 0) >= amount
  );

  return (
    <div className="trade-request">
      <div className="trade-req-header">
        <h4>Trade Offer from {trade.fromName}</h4>
        <span className={`trade-timer ${countdown <= 10 ? 'urgent' : ''}`}>{countdown}s</span>
      </div>

      <ResourceList resources={trade.offering} label="They give:" />
      <ResourceList resources={trade.requesting} label="They want:" />

      <div className="trade-req-actions">
        <button className="btn btn-success" onClick={actions.tradeAccept} disabled={!canAccept}>
          Accept
        </button>
        <button className="btn btn-danger" onClick={actions.tradeReject}>
          Reject
        </button>
      </div>
    </div>
  );
}
