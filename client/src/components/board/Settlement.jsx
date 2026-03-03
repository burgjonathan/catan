export default function Settlement({ x, y, color }) {
  // Slightly darker shade for walls
  return (
    <g filter="url(#piece-shadow)">
      {/* House shape - front wall */}
      <path
        d={`M ${x - 8} ${y + 6} L ${x - 8} ${y - 2} L ${x} ${y - 10} L ${x + 8} ${y - 2} L ${x + 8} ${y + 6} Z`}
        fill={color}
        stroke="#1a1a1a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Roof highlight */}
      <path
        d={`M ${x - 7} ${y - 1.5} L ${x} ${y - 9} L ${x + 7} ${y - 1.5}`}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.8"
      />
      {/* Door */}
      <rect x={x - 2} y={y + 1} width={4} height={5} rx={0.5} fill="rgba(0,0,0,0.3)" />
      {/* Window */}
      <rect x={x + 3} y={y - 0.5} width={2.5} height={2.5} rx={0.3} fill="rgba(255,255,200,0.4)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3" />
      {/* Side shading */}
      <path
        d={`M ${x} ${y - 10} L ${x + 8} ${y - 2} L ${x + 8} ${y + 6} L ${x} ${y + 6} Z`}
        fill="rgba(0,0,0,0.12)"
        pointerEvents="none"
      />
    </g>
  );
}
