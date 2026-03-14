import { useEffect, useState } from 'react';
import './AchievementToast.css';

export default function AchievementToast({ achievements, onDismiss }) {
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (!achievements || achievements.length === 0) return;
    const timer = setTimeout(() => {
      setDismissing(true);
      setTimeout(() => {
        onDismiss?.();
      }, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [achievements, onDismiss]);

  if (!achievements || achievements.length === 0) return null;

  const handleClick = () => {
    setDismissing(true);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  return (
    <div className="achievement-toast-container">
      {achievements.map((a) => (
        <div
          key={a.id}
          className={`achievement-toast${dismissing ? ' dismissing' : ''}`}
          onClick={handleClick}
        >
          <div className="achievement-toast-icon">{a.icon}</div>
          <div className="achievement-toast-content">
            <div className="achievement-toast-label">Achievement Unlocked</div>
            <div className="achievement-toast-name">{a.name}</div>
            <div className="achievement-toast-desc">{a.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
