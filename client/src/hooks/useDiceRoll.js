import { useState, useEffect } from 'react';

export function useDiceRoll(diceResult) {
  const [animating, setAnimating] = useState(false);
  const [displayDice, setDisplayDice] = useState([1, 1]);

  useEffect(() => {
    if (!diceResult) return;
    setAnimating(true);
    const interval = setInterval(() => {
      setDisplayDice([
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6)
      ]);
    }, 80);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayDice([diceResult.die1, diceResult.die2]);
      setAnimating(false);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [diceResult]);

  return { displayDice, animating };
}
