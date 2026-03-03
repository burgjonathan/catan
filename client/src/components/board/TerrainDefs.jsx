// SVG <defs> for realistic Catan terrain tile patterns
export default function TerrainDefs() {
  return (
    <defs>
      {/* ─── FOREST ─── */}
      <radialGradient id="forest-bg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#3a8a28" />
        <stop offset="100%" stopColor="#1e5a12" />
      </radialGradient>
      <pattern id="forest-pattern" width="24" height="28" patternUnits="userSpaceOnUse">
        {/* Pine trees scattered */}
        <polygon points="12,2 6,14 18,14" fill="#1a6b10" opacity="0.7" />
        <polygon points="12,6 8,14 16,14" fill="#237a18" opacity="0.8" />
        <rect x="11" y="14" width="2" height="4" fill="#5a3a1a" />
        <polygon points="0,10 -4,22 4,22" fill="#1a6b10" opacity="0.4" />
        <polygon points="24,10 20,22 28,22" fill="#1a6b10" opacity="0.4" />
      </pattern>

      {/* ─── HILLS ─── */}
      <radialGradient id="hills-bg" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#d4763a" />
        <stop offset="100%" stopColor="#8a4a18" />
      </radialGradient>
      <pattern id="hills-pattern" width="20" height="12" patternUnits="userSpaceOnUse">
        {/* Brick rows */}
        <rect x="0" y="0" width="9" height="5" rx="0.5" fill="#c45a28" stroke="#8a3a12" strokeWidth="0.4" opacity="0.5" />
        <rect x="11" y="0" width="9" height="5" rx="0.5" fill="#b84e20" stroke="#8a3a12" strokeWidth="0.4" opacity="0.5" />
        <rect x="5" y="6" width="9" height="5" rx="0.5" fill="#c45a28" stroke="#8a3a12" strokeWidth="0.4" opacity="0.5" />
        <rect x="16" y="6" width="9" height="5" rx="0.5" fill="#b84e20" stroke="#8a3a12" strokeWidth="0.4" opacity="0.4" />
        <rect x="-5" y="6" width="9" height="5" rx="0.5" fill="#b84e20" stroke="#8a3a12" strokeWidth="0.4" opacity="0.4" />
      </pattern>

      {/* ─── PASTURE ─── */}
      <radialGradient id="pasture-bg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#98e060" />
        <stop offset="100%" stopColor="#5aaa30" />
      </radialGradient>
      <pattern id="pasture-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
        {/* Grass tufts */}
        <path d="M5,28 Q6,22 5,20 Q4,22 5,28" fill="#4a9a28" opacity="0.5" />
        <path d="M7,28 Q8,23 7,21 Q6,23 7,28" fill="#3a8a20" opacity="0.4" />
        <path d="M20,28 Q21,23 20,21 Q19,23 20,28" fill="#4a9a28" opacity="0.5" />
        <path d="M15,15 Q16,10 15,8 Q14,10 15,15" fill="#4a9a28" opacity="0.3" />
        <path d="M25,18 Q26,13 25,11 Q24,13 25,18" fill="#3a8a20" opacity="0.3" />
      </pattern>

      {/* ─── FIELDS ─── */}
      <radialGradient id="fields-bg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#f5e050" />
        <stop offset="100%" stopColor="#c8a020" />
      </radialGradient>
      <pattern id="fields-pattern" width="12" height="24" patternUnits="userSpaceOnUse">
        {/* Wheat stalks */}
        <line x1="6" y1="24" x2="6" y2="6" stroke="#b89830" strokeWidth="0.8" opacity="0.5" />
        <ellipse cx="5" cy="6" rx="1.5" ry="3" fill="#caa830" opacity="0.5" transform="rotate(-8,5,6)" />
        <ellipse cx="7" cy="7" rx="1.5" ry="3" fill="#caa830" opacity="0.5" transform="rotate(8,7,7)" />
        <ellipse cx="5" cy="9" rx="1.2" ry="2.5" fill="#caa830" opacity="0.4" transform="rotate(-12,5,9)" />
      </pattern>

      {/* ─── MOUNTAINS ─── */}
      <radialGradient id="mountains-bg" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#9a9a9a" />
        <stop offset="100%" stopColor="#505050" />
      </radialGradient>
      <pattern id="mountains-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
        {/* Rocky facets */}
        <polygon points="8,36 18,10 28,36" fill="#686868" opacity="0.4" />
        <polygon points="18,10 24,20 18,22" fill="#7a7a7a" opacity="0.3" />
        <polygon points="18,10 12,20 18,22" fill="#5a5a5a" opacity="0.3" />
        {/* Small crack lines */}
        <line x1="14" y1="20" x2="16" y2="28" stroke="#444" strokeWidth="0.4" opacity="0.5" />
        <line x1="22" y1="18" x2="20" y2="30" stroke="#444" strokeWidth="0.4" opacity="0.4" />
      </pattern>

      {/* ─── DESERT ─── */}
      <radialGradient id="desert-bg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#f0dca8" />
        <stop offset="100%" stopColor="#d4b878" />
      </radialGradient>
      <pattern id="desert-pattern" width="40" height="20" patternUnits="userSpaceOnUse">
        {/* Sand dune waves */}
        <path d="M0,14 Q10,8 20,14 Q30,20 40,14" fill="none" stroke="#c8a860" strokeWidth="0.8" opacity="0.4" />
        <path d="M0,6 Q10,2 20,6 Q30,10 40,6" fill="none" stroke="#c8a860" strokeWidth="0.6" opacity="0.3" />
        {/* Sand dots */}
        <circle cx="8" cy="10" r="0.5" fill="#b89848" opacity="0.4" />
        <circle cx="28" cy="16" r="0.5" fill="#b89848" opacity="0.4" />
        <circle cx="18" cy="4" r="0.5" fill="#b89848" opacity="0.3" />
      </pattern>

      {/* ─── OCEAN WATER ─── */}
      <radialGradient id="ocean-bg" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#1a7acc" />
        <stop offset="100%" stopColor="#0d4a7a" />
      </radialGradient>
      <pattern id="ocean-pattern" width="60" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,10 Q15,4 30,10 Q45,16 60,10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <path d="M-10,18 Q5,12 20,18 Q35,24 50,18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      </pattern>

      {/* ─── HEX BORDER GRADIENT ─── */}
      <linearGradient id="hex-border" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a08050" />
        <stop offset="50%" stopColor="#c8a060" />
        <stop offset="100%" stopColor="#806030" />
      </linearGradient>

      {/* ─── NUMBER TOKEN ─── */}
      <radialGradient id="token-bg" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#faf4e0" />
        <stop offset="100%" stopColor="#e8d8b0" />
      </radialGradient>

      {/* ─── ROBBER GRADIENT ─── */}
      <radialGradient id="robber-body" cx="40%" cy="30%" r="60%">
        <stop offset="0%" stopColor="#3a3a3a" />
        <stop offset="100%" stopColor="#0a0a0a" />
      </radialGradient>

      {/* ─── SETTLEMENT / CITY SHADING ─── */}
      <filter id="piece-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.5" />
      </filter>

      {/* Port dock gradient */}
      <radialGradient id="port-bg" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor="rgba(30,20,10,0.85)" />
        <stop offset="100%" stopColor="rgba(10,8,5,0.9)" />
      </radialGradient>
    </defs>
  );
}
