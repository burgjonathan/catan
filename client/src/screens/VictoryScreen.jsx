import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import AchievementToast from '../components/common/AchievementToast';
import './VictoryScreen.css';

export default function VictoryScreen() {
  const { state, dispatch } = useGame();
  const actions = useGameActions();
  const { winner, newAchievements, achievements } = state;

  useEffect(() => {
    actions.getAchievements();
  }, []);

  const handleReturn = () => {
    dispatch({ type: 'RESET' });
    window.location.href = window.location.origin;
  };

  const handleRematch = () => {
    actions.rematch();
  };

  const unlockedAchievements = (achievements || []).filter(a => a.unlocked);

  return (
    <div className="victory-screen">
      <AchievementToast
        achievements={newAchievements}
        onDismiss={() => actions.dismissAchievements()}
      />
      <div className="victory-container">
        <div className="victory-crown">&#9813;</div>
        <h1 className="victory-title">Victory!</h1>
        <div className="winner-name" style={{ color: winner?.color }}>
          {winner?.name || 'Unknown'}
        </div>
        <p className="victory-subtitle">has won the game!</p>

        {unlockedAchievements.length > 0 && (
          <div className="victory-achievements">
            <h3 className="victory-achievements-title">Achievements</h3>
            <div className="victory-achievements-grid">
              {unlockedAchievements.map(a => (
                <div key={a.id} className="victory-badge" title={a.description}>
                  <span className="victory-badge-icon">{a.icon}</span>
                  <span className="victory-badge-name">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="victory-buttons">
          <button className="btn btn-primary victory-btn" onClick={handleRematch}>
            Rematch
          </button>
          <button className="btn btn-secondary victory-btn" onClick={handleReturn}>
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
