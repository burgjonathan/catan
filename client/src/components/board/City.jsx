export default function City({ x, y, color }) {
  return (
    <g filter="url(#piece-shadow)">
      {/* Main building */}
      <path
        d={`M ${x - 10} ${y + 8} L ${x - 10} ${y - 6} L ${x - 4} ${y - 12} L ${x + 2} ${y - 6} L ${x + 2} ${y - 2} L ${x + 10} ${y - 2} L ${x + 10} ${y + 8} Z`}
        fill={color}
        stroke="#1a1a1a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Tower roof highlight */}
      <path
        d={`M ${x - 9} ${y - 5} L ${x - 4} ${y - 11} L ${x + 1} ${y - 5}`}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.8"
      />
      {/* Right wing roof line */}
      <path
        d={`M ${x + 2} ${y - 2} L ${x + 10} ${y - 2}`}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.6"
      />
      {/* Tower window */}
      <rect x={x - 6} y={y - 3} width={3} height={3} rx={0.3} fill="rgba(255,255,200,0.4)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3" />
      {/* Right wing window */}
      <rect x={x + 4} y={y + 1} width={3} height={3} rx={0.3} fill="rgba(255,255,200,0.4)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3" />
      {/* Door */}
      <rect x={x - 2} y={y + 3} width={4} height={5} rx={0.5} fill="rgba(0,0,0,0.3)" />
      {/* Side shading on right building */}
      <path
        d={`M ${x + 2} ${y - 2} L ${x + 10} ${y - 2} L ${x + 10} ${y + 8} L ${x + 2} ${y + 8} Z`}
        fill="rgba(0,0,0,0.1)"
        pointerEvents="none"
      />
      {/* Tower right-side shading */}
      <path
        d={`M ${x - 4} ${y - 12} L ${x + 2} ${y - 6} L ${x + 2} ${y + 8} L ${x - 1} ${y + 8} Z`}
        fill="rgba(0,0,0,0.08)"
        pointerEvents="none"
      />
      {/* Flag on tower */}
      <line x1={x - 4} y1={y - 12} x2={x - 4} y2={y - 16} stroke="#1a1a1a" strokeWidth="0.6" />
      <polygon points={`${x - 4},${y - 16} ${x - 1},${y - 14.5} ${x - 4},${y - 13}`} fill={color} stroke="#1a1a1a" strokeWidth="0.3" />
    </g>
  );
}
