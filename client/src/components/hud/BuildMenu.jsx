import { useState } from 'react';
import { COSTS, RESOURCE_ICONS, RESOURCE_COLORS } from 'shared/constants.js';
import './BuildMenu.css';

function canAfford(resources, cost) {
  if (!resources) return false;
  for (const [r, amount] of Object.entries(cost)) {
    if ((resources[r] || 0) < amount) return false;
  }
  return true;
}

function CostTooltip({ cost, resources, visible, position }) {
  if (!visible) return null;
  return (
    <div className="cost-tooltip" style={position}>
      <div className="cost-tooltip-title">Cost</div>
      <div className="cost-tooltip-items">
        {Object.entries(cost).map(([r, amount]) => {
          const have = resources?.[r] || 0;
          const enough = have >= amount;
          return (
            <div key={r} className={`cost-tooltip-item ${enough ? 'have' : 'need'}`}>
              <span className="cost-tooltip-icon" style={{ color: RESOURCE_COLORS[r] }}>
                {RESOURCE_ICONS[r]}
              </span>
              <span className="cost-tooltip-name">{r}</span>
              <span className="cost-tooltip-amount">{have}/{amount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BuildButton({ icon, label, cost, resources, disabled, onClick }) {
  const [showCost, setShowCost] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({});

  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      bottom: window.innerHeight - rect.top + 8 + 'px',
      left: rect.left + rect.width / 2 + 'px',
      transform: 'translateX(-50%)',
    });
    setShowCost(prev => !prev);
  };

  return (
    <>
      <button
        className="build-btn"
        disabled={disabled}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseLeave={() => setShowCost(false)}
      >
        <span className="build-icon">{icon}</span>
        <span className="build-label">{label}</span>
      </button>
      <CostTooltip cost={cost} resources={resources} visible={showCost} position={tooltipPos} />
    </>
  );
}

export default function BuildMenu({ resources, isMyTurn, phase, onBuildSettlement, onBuildCity, onBuildRoad, onBuyDevCard }) {
  const canBuild = isMyTurn && phase === 'main';

  return (
    <div className="build-menu">
      <BuildButton
        icon="━"
        label="Road"
        cost={COSTS.road}
        resources={resources}
        disabled={!canBuild || !canAfford(resources, COSTS.road)}
        onClick={onBuildRoad}
      />
      <BuildButton
        icon="⌂"
        label="Settlement"
        cost={COSTS.settlement}
        resources={resources}
        disabled={!canBuild || !canAfford(resources, COSTS.settlement)}
        onClick={onBuildSettlement}
      />
      <BuildButton
        icon="🏰"
        label="City"
        cost={COSTS.city}
        resources={resources}
        disabled={!canBuild || !canAfford(resources, COSTS.city)}
        onClick={onBuildCity}
      />
      <BuildButton
        icon="🃏"
        label="Dev Card"
        cost={COSTS.devCard}
        resources={resources}
        disabled={!canBuild || !canAfford(resources, COSTS.devCard)}
        onClick={onBuyDevCard}
      />
    </div>
  );
}
