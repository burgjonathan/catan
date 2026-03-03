import { useGame } from '../context/GameContext';
import './VictoryScreen.css';

export default function VictoryScreen() {
  const { state, dispatch } = useGame();
  const { winner } = state;

  const handleReturn = () => {
    dispatch({ type: 'RESET' });
    window.location.href = window.location.origin;
  };

  return (
    <div className="victory-screen">
      <div className="victory-container">
        <div className="victory-crown">&#9813;</div>
        <h1 className="victory-title">Victory!</h1>
        <div className="winner-name" style={{ color: winner?.color }}>
          {winner?.name || 'Unknown'}
        </div>
        <p className="victory-subtitle">has won the game!</p>
        <button className="btn btn-primary victory-btn" onClick={handleReturn}>
          Return to Lobby
        </button>
      </div>
    </div>
  );
}
