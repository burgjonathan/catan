import { vertexPixelPosition } from 'shared/hexGeometry.js';

const PORT_RESOURCE_COLORS = {
  'wood': '#8d6e3f',
  'brick': '#d84315',
  'sheep': '#7cb342',
  'wheat': '#fdd835',
  'ore': '#90a4ae',
  '3:1': '#e0d8c0'
};

const PORT_ICONS = {
  'wood': '🌲',
  'brick': '🧱',
  'sheep': '🐑',
  'wheat': '🌾',
  'ore': '⛏️',
};

export default function Port({ port, size }) {
  const p1 = vertexPixelPosition(port.vertexKeys[0], size);
  const p2 = vertexPixelPosition(port.vertexKeys[1], size);
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  const dist = Math.sqrt(mid.x * mid.x + mid.y * mid.y);
  const scale = dist > 0 ? 1 + 35 / dist : 1;
  const labelPos = { x: mid.x * scale, y: mid.y * scale };

  const label = port.type === '3:1' ? '3:1' : '2:1';
  const color = PORT_RESOURCE_COLORS[port.type] || '#e0d8c0';

  return (
    <g className="port">
      {/* Dock planks */}
      <line x1={p1.x} y1={p1.y} x2={labelPos.x} y2={labelPos.y}
            stroke="#6a5030" strokeWidth="3" opacity="0.5" />
      <line x1={p1.x} y1={p1.y} x2={labelPos.x} y2={labelPos.y}
            stroke="#8a7050" strokeWidth="1.5" opacity="0.5" />
      <line x1={p2.x} y1={p2.y} x2={labelPos.x} y2={labelPos.y}
            stroke="#6a5030" strokeWidth="3" opacity="0.5" />
      <line x1={p2.x} y1={p2.y} x2={labelPos.x} y2={labelPos.y}
            stroke="#8a7050" strokeWidth="1.5" opacity="0.5" />

      {/* Port circle - ship/dock look */}
      <circle cx={labelPos.x} cy={labelPos.y} r={17} fill="url(#port-bg)" stroke={color} strokeWidth="2" />
      <circle cx={labelPos.x} cy={labelPos.y} r={14.5} fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />

      {/* Ratio text */}
      <text x={labelPos.x} y={labelPos.y - 1} textAnchor="middle" dominantBaseline="central"
            fontSize="9" fontWeight="bold" fontFamily="var(--font-display)" fill={color}>
        {label}
      </text>
      {/* Resource name or generic label */}
      {port.type !== '3:1' && (
        <text x={labelPos.x} y={labelPos.y + 9} textAnchor="middle" fontSize="6.5"
              fontWeight="600" fill={color} opacity="0.85">
          {port.type}
        </text>
      )}
      {port.type === '3:1' && (
        <text x={labelPos.x} y={labelPos.y + 9} textAnchor="middle" fontSize="6"
              fill={color} opacity="0.6">
          any
        </text>
      )}
    </g>
  );
}
