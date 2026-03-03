import { useState, useEffect, useRef } from 'react';
import { RESOURCES, RESOURCE_ICONS } from 'shared/constants.js';
import './ResourceCards.css';

const FLY_DURATION = 700; // must match FlyingResources

export default function ResourceCards({ resources, animatingResources }) {
  const prevRef = useRef({});
  const [displayedResources, setDisplayedResources] = useState({});
  const pendingUpdateRef = useRef(null);

  // When resources change, either delay (if animating) or update immediately
  useEffect(() => {
    if (!resources) return;

    const prev = prevRef.current;
    const hasGain = RESOURCES.some(r => (resources[r] || 0) > (prev[r] || 0));
    const isFirstLoad = Object.keys(prev).length === 0;

    if (isFirstLoad || !hasGain || !animatingResources) {
      // Immediate update (first load, resource loss, or no animation)
      setDisplayedResources({ ...resources });
      prevRef.current = { ...resources };
      return;
    }

    // Resource gain with animation active - delay showing the new counts
    // Keep displaying old counts, schedule update after fly animation
    if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
    pendingUpdateRef.current = setTimeout(() => {
      setDisplayedResources({ ...resources });
      pendingUpdateRef.current = null;
    }, FLY_DURATION + 200);

    prevRef.current = { ...resources };
  }, [resources, animatingResources]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
    };
  }, []);

  if (!resources) return null;

  return (
    <div className="resource-cards">
      {RESOURCES.map(r => {
        const displayed = displayedResources[r] ?? resources[r] ?? 0;
        return (
          <div key={r} className="resource-group">
            <div className="resource-card" data-resource={r}>
              <span className="resource-icon">{RESOURCE_ICONS[r]}</span>
              <span className="resource-count">{displayed}</span>
            </div>
            <span className="resource-label">{r}</span>
          </div>
        );
      })}
    </div>
  );
}
