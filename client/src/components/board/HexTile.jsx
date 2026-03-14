import { axialToPixel, hexCornerOffsets } from 'shared/hexGeometry.js';
import { TERRAIN_RESOURCE } from 'shared/constants.js';
import NumberToken from './NumberToken';

const TERRAIN_FILLS = {
  forest: 'url(#forest-bg)',
  hills: 'url(#hills-bg)',
  pasture: 'url(#pasture-bg)',
  fields: 'url(#fields-bg)',
  mountains: 'url(#mountains-bg)',
  desert: 'url(#desert-bg)'
};

const TERRAIN_PATTERNS = {
  forest: 'url(#forest-pattern)',
  hills: 'url(#hills-pattern)',
  pasture: 'url(#pasture-pattern)',
  fields: 'url(#fields-pattern)',
  mountains: 'url(#mountains-pattern)',
  desert: 'url(#desert-pattern)'
};

// Rich SVG terrain illustrations
function ForestIcon({ cx, cy }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Back trees */}
      <polygon points="-14,-2 -10,-14 -6,-2" fill="#1a5a0e" />
      <polygon points="14,-2 10,-14 6,-2" fill="#1a5a0e" />
      {/* Middle tree */}
      <rect x={-1.5} y={2} width={3} height={8} rx={1} fill="#5a3a1a" />
      <polygon points="-12,4 0,-12 12,4" fill="#1e6b12" />
      <polygon points="-9,-1 0,-10 9,-1" fill="#248a18" />
      <polygon points="-6,-4 0,-9 6,-4" fill="#2a9a1e" />
      {/* Snow caps */}
      <polygon points="-2,-9 0,-12 2,-9" fill="#ddeedd" opacity="0.3" />
    </g>
  );
}

function HillsIcon({ cx, cy }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Rolling hills background */}
      <ellipse cx={0} cy={4} rx={18} ry={8} fill="#b85a20" opacity="0.4" />
      {/* Brick stack */}
      <rect x={-10} y={-6} width={9} height={5} rx={0.5} fill="#c44a20" stroke="#8a3215" strokeWidth="0.6" />
      <rect x={1} y={-6} width={9} height={5} rx={0.5} fill="#d45a28" stroke="#8a3215" strokeWidth="0.6" />
      <rect x={-5} y={0} width={9} height={5} rx={0.5} fill="#c44a20" stroke="#8a3215" strokeWidth="0.6" />
      <rect x={-14} y={0} width={8} height={5} rx={0.5} fill="#b84018" stroke="#8a3215" strokeWidth="0.6" opacity="0.7" />
      <rect x={5} y={0} width={8} height={5} rx={0.5} fill="#b84018" stroke="#8a3215" strokeWidth="0.6" opacity="0.7" />
    </g>
  );
}

function PastureIcon({ cx, cy }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Sheep body */}
      <ellipse cx={0} cy={2} rx={13} ry={9} fill="#f5f5f0" />
      {/* Wool bumps */}
      <circle cx={-7} cy={-3} r={5.5} fill="#eae8e0" />
      <circle cx={1} cy={-5} r={5.5} fill="#f0ede5" />
      <circle cx={8} cy={-2} r={4.5} fill="#eae8e0" />
      <circle cx={-2} cy={-1} r={4} fill="#f2f0ea" />
      {/* Head */}
      <ellipse cx={-14} cy={-1} rx={4.5} ry={4} fill="#2a2a2a" />
      {/* Ears */}
      <ellipse cx={-16} cy={-4} rx={2} ry={1.2} fill="#3a3a3a" transform="rotate(-20,-16,-4)" />
      {/* Eye */}
      <circle cx={-15} cy={-2} r={1.2} fill="#fff" />
      <circle cx={-15.3} cy={-2} r={0.6} fill="#111" />
      {/* Legs */}
      <rect x={-7} y={9} width={2} height={6} rx={1} fill="#2a2a2a" />
      <rect x={5} y={9} width={2} height={6} rx={1} fill="#2a2a2a" />
    </g>
  );
}

function WheatIcon({ cx, cy }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Multiple wheat stalks */}
      {[-6, 0, 6].map((dx, i) => (
        <g key={i} transform={`translate(${dx}, 0)`}>
          <line x1={0} y1={12} x2={dx * 0.1} y2={-4} stroke="#b89020" strokeWidth="1.2" />
          <ellipse cx={-1.5} cy={-3} rx={1.8} ry={3.5} fill="#daa520" transform={`rotate(-10,${-1.5},${-3})`} />
          <ellipse cx={1.5} cy={-2} rx={1.8} ry={3.5} fill="#d4a020" transform={`rotate(10,${1.5},${-2})`} />
          <ellipse cx={-2} cy={1} rx={1.4} ry={2.8} fill="#cca030" transform={`rotate(-18,${-2},1)`} />
          <ellipse cx={2} cy={1.5} rx={1.4} ry={2.8} fill="#c89828" transform={`rotate(18,2,1.5)`} />
        </g>
      ))}
    </g>
  );
}

function MountainIcon({ cx, cy }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Back mountain */}
      <polygon points="-18,10 -6,-10 6,10" fill="#5a5a5a" />
      <polygon points="-6,-10 0,0 -12,0" fill="#6a6a6a" />
      {/* Front mountain */}
      <polygon points="-4,10 8,-12 20,10" fill="#686868" />
      <polygon points="8,-12 14,0 2,0" fill="#787878" />
      {/* Snow caps */}
      <polygon points="-8,-6 -6,-10 -4,-6" fill="#e8e8f0" />
      <polygon points="5,-8 8,-12 11,-8" fill="#e8e8f0" />
      {/* Ore sparkles */}
      <circle cx={-8} cy={4} r={1.5} fill="#a0c8e0" opacity="0.7" />
      <circle cx={12} cy={2} r={1} fill="#a0c8e0" opacity="0.6" />
      <line x1={-9} y1={2} x2={-7} y2={4} stroke="#b0d0e8" strokeWidth="0.6" opacity="0.5" />
    </g>
  );
}

function DesertIcon({ cx, cy }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Cactus */}
      <rect x={-2} y={-8} width={4} height={16} rx={2} fill="#5a8a3c" />
      <rect x={-9} y={-3} width={7} height={3} rx={1.5} fill="#5a8a3c" />
      <rect x={-9} y={-8} width={3} height={6} rx={1.5} fill="#5a8a3c" />
      <rect x={2} y={-1} width={7} height={3} rx={1.5} fill="#5a8a3c" />
      <rect x={6} y={-6} width={3} height={6} rx={1.5} fill="#5a8a3c" />
      {/* Cactus highlights */}
      <line x1={0} y1={-6} x2={0} y2={6} stroke="#6aa848" strokeWidth="0.5" opacity="0.4" />
      {/* Sand ripples */}
      <path d="M-16,10 Q-8,7 0,10 Q8,13 16,10" fill="none" stroke="#c8a060" strokeWidth="0.8" opacity="0.4" />
    </g>
  );
}

const TERRAIN_ICON_COMPONENTS = {
  forest: ForestIcon,
  hills: HillsIcon,
  pasture: PastureIcon,
  fields: WheatIcon,
  mountains: MountainIcon,
  desert: DesertIcon,
};

export default function HexTile({ hex, size, clickable, onClick }) {
  const center = axialToPixel(hex.q, hex.r, size);
  const corners = hexCornerOffsets(size);
  const points = corners.map(c => `${center.x + c.x},${center.y + c.y}`).join(' ');

  const IconComponent = TERRAIN_ICON_COMPONENTS[hex.terrain];
  const hasNumber = hex.terrain !== 'desert' && hex.number;

  const iconY = hasNumber ? center.y - 24 : center.y;

  return (
    <g className={`hex-tile ${clickable ? 'clickable' : ''}`} data-hex={`${hex.q},${hex.r}`} onClick={clickable ? onClick : undefined}>
      {/* Base gradient fill */}
      <polygon
        points={points}
        fill={TERRAIN_FILLS[hex.terrain] || '#333'}
        stroke="url(#hex-border)"
        strokeWidth="2.5"
      />
      {/* Overlay texture pattern */}
      <polygon
        points={points}
        fill={TERRAIN_PATTERNS[hex.terrain]}
        opacity="0.7"
        stroke="none"
        pointerEvents="none"
      />
      {/* Inner vignette - darker edges for depth */}
      <polygon
        points={points}
        fill="url(#hex-vignette)"
        opacity="0.3"
        stroke="none"
        pointerEvents="none"
      />
      {/* Inner glow - subtle light from top-left */}
      <polygon
        points={points}
        fill="url(#hex-inner-glow)"
        opacity="0.5"
        stroke="none"
        pointerEvents="none"
      />
      {/* Inner highlight edge */}
      <polygon
        points={corners.map(c => `${center.x + c.x * 0.93},${center.y + c.y * 0.93}`).join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1.2"
        pointerEvents="none"
      />
      {/* Terrain icon */}
      {IconComponent && <IconComponent cx={center.x} cy={iconY} />}
      {/* Number token */}
      {hasNumber && (
        <NumberToken cx={center.x} cy={center.y + 6} number={hex.number} />
      )}
    </g>
  );
}
