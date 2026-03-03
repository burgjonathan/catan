export default function NumberToken({ cx, cy, number }) {
  const isRed = number === 6 || number === 8;
  const dots = 6 - Math.abs(7 - number);

  return (
    <g>
      {/* Token shadow */}
      <circle cx={cx + 0.5} cy={cy + 1} r={14.5} fill="rgba(0,0,0,0.3)" />
      {/* Token body - parchment look */}
      <circle cx={cx} cy={cy} r={14} fill="url(#token-bg)" stroke="#8a7040" strokeWidth="1.5" />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={12} fill="none" stroke="rgba(120,90,40,0.2)" strokeWidth="0.5" />
      {/* Number */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="15"
        fontWeight="bold"
        fontFamily="var(--font-display)"
        fill={isRed ? '#b02020' : '#2a2a2a'}
      >
        {number}
      </text>
      {/* Probability dots */}
      <text
        x={cx}
        y={cy + 11}
        textAnchor="middle"
        fontSize="5"
        fill={isRed ? '#b02020' : '#555'}
      >
        {'•'.repeat(dots)}
      </text>
    </g>
  );
}
