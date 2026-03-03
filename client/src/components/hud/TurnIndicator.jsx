import './TurnIndicator.css';

const PHASE_LABELS = {
  setup1: 'Setup Round 1',
  setup2: 'Setup Round 2',
  roll: 'Roll Dice',
  main: 'Build & Trade',
  robber: 'Move Robber',
  discard: 'Discard Cards',
  steal: 'Steal Resource',
  roadBuilding: 'Place Roads',
  finished: 'Game Over'
};

export default function TurnIndicator({ currentPlayer, phase, turnNumber, isMyTurn }) {
  return (
    <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
      <div className="turn-player">
        <div className="turn-color" style={{ background: currentPlayer?.color }} />
        <span>{isMyTurn ? 'Your Turn' : `${currentPlayer?.name}'s Turn`}</span>
      </div>
      <div className="turn-phase">{PHASE_LABELS[phase] || phase}</div>
      {phase !== 'setup1' && phase !== 'setup2' && (
        <div className="turn-number">Turn {turnNumber}</div>
      )}
    </div>
  );
}
