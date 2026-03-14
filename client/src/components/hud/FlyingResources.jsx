import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { RESOURCES, TERRAIN_RESOURCE, RESOURCE_ICONS } from 'shared/constants.js';
import { getVerticesForHex, hexPositionsForRadius } from 'shared/hexGeometry.js';
import './FlyingResources.css';

const FLY_DURATION = 700;

function getHexScreenPos(q, r) {
  const el = document.querySelector(`[data-hex="${q},${r}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function getCardScreenPos(resource) {
  const el = document.querySelector(`.resource-card[data-resource="${resource}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

let flyId = 0;

export default function FlyingResources({ onAnimStart, onAnimEnd }) {
  const { state } = useGame();
  const { gameState, playerId, diceResult } = state;
  const [flyers, setFlyers] = useState([]);
  const prevResourcesRef = useRef(null);
  const pendingGainsRef = useRef(null);

  // Step 1: When GAME_STATE arrives with resource gains, store them as pending
  useEffect(() => {
    if (!gameState || !playerId) return;

    const myPlayer = gameState.players.find(p => p.id === playerId);
    if (!myPlayer) return;

    const curResources = myPlayer.resources;
    const prevResources = prevResourcesRef.current;

    if (prevResources && curResources) {
      const gains = {};
      let hasGain = false;
      for (const r of RESOURCES) {
        const diff = (curResources[r] || 0) - (prevResources[r] || 0);
        if (diff > 0) {
          gains[r] = diff;
          hasGain = true;
        }
      }
      if (hasGain) {
        // Store gains - they'll be matched with dice result
        pendingGainsRef.current = { gains, board: gameState.board, timestamp: Date.now() };
      }
    }

    prevResourcesRef.current = curResources ? { ...curResources } : null;
  }, [gameState, playerId]);

  // Step 2: When DICE_RESULT arrives, match it with pending gains and spawn flyers
  useEffect(() => {
    if (!diceResult || !gameState || !playerId) return;

    const pending = pendingGainsRef.current;
    if (!pending) return;
    // Only process gains that happened very recently (same event batch)
    if (Date.now() - pending.timestamp > 500) {
      pendingGainsRef.current = null;
      return;
    }

    const total = diceResult.die1 + diceResult.die2;
    if (total === 7) {
      pendingGainsRef.current = null;
      return;
    }

    const { gains, board } = pending;
    pendingGainsRef.current = null;

    // Find producing hexes
    const producingHexes = board.hexes.filter(h =>
      h.number === total
      && h.terrain !== 'desert'
      && !(h.q === board.robberHex.q && h.r === board.robberHex.r)
    );

    // Match each resource gain to a specific hex
    const newFlyers = [];
    const remainingGains = { ...gains };

    for (const hex of producingHexes) {
      const resource = TERRAIN_RESOURCE[hex.terrain];
      if (!resource || !remainingGains[resource]) continue;

      const hexPositions = hexPositionsForRadius(board.boardRadius || 2);
      const vertices = getVerticesForHex(hex.q, hex.r, hexPositions);
      let gained = 0;
      for (const vKey of vertices) {
        const v = board.vertices[vKey];
        if (v?.ownerId === playerId) {
          gained += v.building === 'city' ? 2 : 1;
        }
      }

      const toSpawn = Math.min(gained, remainingGains[resource]);
      for (let i = 0; i < toSpawn; i++) {
        flyId++;
        newFlyers.push({
          id: flyId,
          resource,
          hexQ: hex.q,
          hexR: hex.r,
          delay: i * 120,
        });
      }
      remainingGains[resource] -= toSpawn;
    }

    if (newFlyers.length > 0) {
      onAnimStart?.();

      requestAnimationFrame(() => {
        const positioned = newFlyers.map(f => {
          const from = getHexScreenPos(f.hexQ, f.hexR);
          const to = getCardScreenPos(f.resource);
          return { ...f, from, to };
        }).filter(f => f.from && f.to);

        if (positioned.length > 0) {
          setFlyers(prev => [...prev, ...positioned]);

          const maxDelay = Math.max(...positioned.map(f => f.delay));
          setTimeout(() => {
            const ids = new Set(positioned.map(f => f.id));
            setFlyers(prev => prev.filter(f => !ids.has(f.id)));
            onAnimEnd?.();
          }, FLY_DURATION + maxDelay + 50);
        } else {
          onAnimEnd?.();
        }
      });
    }
  }, [diceResult, gameState, playerId, onAnimStart, onAnimEnd]);

  if (flyers.length === 0) return null;

  return (
    <div className="flying-resources-layer">
      {flyers.map(f => (
        <FlyingIcon key={f.id} flyer={f} />
      ))}
    </div>
  );
}

function FlyingIcon({ flyer }) {
  const { resource, from, to, delay } = flyer;
  const icon = RESOURCE_ICONS[resource];

  const style = {
    '--from-x': `${from.x}px`,
    '--from-y': `${from.y}px`,
    '--to-x': `${to.x}px`,
    '--to-y': `${to.y}px`,
    '--fly-duration': `${FLY_DURATION}ms`,
    animationDelay: `${delay}ms`,
  };

  return (
    <div className="flying-icon" style={style}>
      {icon}
    </div>
  );
}
