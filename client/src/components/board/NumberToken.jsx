export default function NumberToken({ cx, cy, number }) {
  const isRed = number === 6 || number === 8;
  const dots = 6 - Math.abs(7 - number);

  return (
    <g>
      {/* Token shadow - blurred */}
      <circle cx={cx + 0.8} cy={cy + 1.5} r={16} fill="rgba(0,0,0,0.25)" />
      <circle cx={cx + 0.4} cy={cy + 1} r={15.5} fill="rgba(0,0,0,0.15)" />
      {/* Token body - parchment look */}
      <circle cx={cx} cy={cy} r={15} fill="url(#token-bg)" stroke="#9a8048" strokeWidth="1.5" />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={12.5} fill="none" stroke="rgba(130,100,45,0.22)" strokeWidth="0.6" />
      {/* Specular highlight arc */}
      <path
        d={`M ${cx - 9} ${cy - 7} A 11 11 0 0 1 ${cx + 9} ${cy - 7}`}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Number */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="16"
        fontWeight="800"
        fontFamily="var(--font-display)"
        fill={isRed ? '#b02020' : '#2a2a2a'}
      >
        {number}
      </text>
      {/* Probability dots */}
      <text
        x={cx}
        y={cy + 11.5}
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="bold"
        fill={isRed ? '#b02020' : '#555'}
      >
        {'•'.repeat(dots)}
      </text>
    </g>
  );
}
