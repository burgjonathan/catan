import { useDiceRoll } from '../../hooks/useDiceRoll';
import './DiceDisplay.css';

const DOT_POSITIONS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function Die({ value }) {
  const dots = DOT_POSITIONS[value] || [];
  return (
    <svg viewBox="0 0 100 100" className="die">
      {/* Die shadow */}
      <rect x="4" y="6" width="96" height="96" rx="14" fill="rgba(0,0,0,0.25)" />
      {/* Die body */}
      <rect x="2" y="2" width="96" height="96" rx="14" fill="#f8f2e0" stroke="#8B7355" strokeWidth="2.5" />
      {/* Inner edge highlight */}
      <rect x="6" y="6" width="88" height="88" rx="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Parchment texture */}
      <rect x="2" y="2" width="96" height="96" rx="14"
        fill="none"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent)'
        }}
      />
      {dots.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={10} fill="#2a1a0a" />
          <circle cx={cx - 1} cy={cy - 1} r={3} fill="rgba(80,50,20,0.4)" />
        </g>
      ))}
    </svg>
  );
}

export default function DiceDisplay({ diceResult, canRoll, onRoll }) {
  const { displayDice, animating } = useDiceRoll(diceResult);

  return (
    <div className="dice-display">
      <div className={`dice-container ${animating ? 'animating' : ''}`}>
        <Die value={displayDice[0]} />
        <Die value={displayDice[1]} />
      </div>
      {diceResult && (
        <div className="dice-total">{diceResult.die1 + diceResult.die2}</div>
      )}
      {canRoll && (
        <button className="btn btn-primary roll-btn" onClick={onRoll}>
          Roll Dice
        </button>
      )}
    </div>
  );
}
