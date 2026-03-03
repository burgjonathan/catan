import { axialToPixel } from 'shared/hexGeometry.js';

export default function Robber({ hex, size }) {
  const { x, y } = axialToPixel(hex.q, hex.r, size);
  return (
    <g transform={`translate(${x}, ${y + 6})`} className="robber-piece">
      {/* Shadow */}
      <ellipse cx={0} cy={10} rx={10} ry={3.5} fill="#000" opacity="0.35" />
      {/* Body - hooded cloak shape */}
      <path
        d="M -7 -6 Q -8 -10 -5 -14 Q -2 -18 0 -18 Q 2 -18 5 -14 Q 8 -10 7 -6 L 9 8 Q 9 10 7 10 L -7 10 Q -9 10 -9 8 Z"
        fill="url(#robber-body)"
        stroke="#000"
        strokeWidth="0.8"
      />
      {/* Hood opening / face shadow */}
      <ellipse cx={0} cy={-12} rx={4} ry={3.5} fill="#1a1a1a" />
      {/* Eyes glowing */}
      <circle cx={-1.5} cy={-12.5} r={0.8} fill="#cc3333" opacity="0.8" />
      <circle cx={1.5} cy={-12.5} r={0.8} fill="#cc3333" opacity="0.8" />
      {/* Cloak folds */}
      <path d="M -3 -4 Q -1 0 -2 6" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      <path d="M 3 -4 Q 1 0 2 6" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      {/* Belt */}
      <rect x={-6} y={0} width={12} height={2} rx={1} fill="#2a2a2a" stroke="#444" strokeWidth="0.3" />
    </g>
  );
}
