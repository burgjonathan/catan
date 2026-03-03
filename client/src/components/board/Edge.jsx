export default function Edge({ edgeKey, p1, p2, owner, clickable, onClick }) {
  if (owner) {
    return (
      <g>
        {/* Road shadow */}
        <line
          x1={p1.x + 1} y1={p1.y + 2}
          x2={p2.x + 1} y2={p2.y + 2}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Road body */}
        <line
          x1={p1.x} y1={p1.y}
          x2={p2.x} y2={p2.y}
          stroke={owner}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Road highlight */}
        <line
          x1={p1.x} y1={p1.y}
          x2={p2.x} y2={p2.y}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    );
  }
  if (clickable) {
    return (
      <line
        x1={p1.x} y1={p1.y}
        x2={p2.x} y2={p2.y}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="6"
        strokeLinecap="round"
        cursor="pointer"
        onClick={onClick}
        className="edge-spot"
      />
    );
  }
  return null;
}
