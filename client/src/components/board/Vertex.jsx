import Settlement from './Settlement';
import City from './City';

export default function Vertex({ vertexKey, pos, building, owner, clickable, onClick }) {
  if (building === 'city') {
    return <City x={pos.x} y={pos.y} color={owner} />;
  }
  if (building === 'settlement') {
    if (clickable) {
      // Render settlement with a clickable overlay (for upgrading to city)
      return (
        <g cursor="pointer" onClick={onClick}>
          {/* Invisible larger hit area for mobile */}
          <circle cx={pos.x} cy={pos.y} r={22} fill="transparent" />
          <Settlement x={pos.x} y={pos.y} color={owner} />
          <circle
            cx={pos.x}
            cy={pos.y}
            r={12}
            fill="rgba(255,255,255,0.2)"
            stroke="#f1c40f"
            strokeWidth="2"
            strokeDasharray="4 2"
            className="vertex-spot"
          />
        </g>
      );
    }
    return <Settlement x={pos.x} y={pos.y} color={owner} />;
  }
  if (clickable) {
    return (
      <g cursor="pointer" onClick={onClick}>
        {/* Invisible larger hit area for mobile */}
        <circle cx={pos.x} cy={pos.y} r={22} fill="transparent" />
        <circle
          cx={pos.x}
          cy={pos.y}
          r={8}
          fill="rgba(255,255,255,0.5)"
          stroke="#fff"
          strokeWidth="2"
          className="vertex-spot"
        />
      </g>
    );
  }
  return null;
}
