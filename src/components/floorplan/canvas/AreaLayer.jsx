import { memo, useMemo } from 'react';

const AreaLayer = memo(({ 
  walls, 
  areas = [],
  selectedId, 
  onWallClick,
  wallDrawingPoints,
  wallPreviewEnd,
  isDrawingWall,
}) => {
  const areaEdgeSet = useMemo(() => {
    const toKey = (x1, y1, x2, y2) => {
      const a = `${x1},${y1}`;
      const b = `${x2},${y2}`;
      return a < b ? `${a}|${b}` : `${b}|${a}`;
    };

    const keys = new Set();
    areas.forEach((area) => {
      const points = Array.isArray(area.points) ? area.points : [];
      if (points.length < 2) return;

      for (let i = 0; i < points.length; i += 1) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        keys.add(toKey(p1.x, p1.y, p2.x, p2.y));
      }
    });

    return keys;
  }, [areas]);

  const isWallPartOfArea = (wall) => {
    const a = `${wall.x1},${wall.y1}`;
    const b = `${wall.x2},${wall.y2}`;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    return areaEdgeSet.has(key);
  };

  const renderWall = (wall) => {
    if (isWallPartOfArea(wall)) return null;

    const isSelected = selectedId === wall.id;

    return (
      <g key={wall.id}>
        <line
          data-id={wall.id}
          data-type="wall"
          x1={wall.x1}
          y1={wall.y1}
          x2={wall.x2}
          y2={wall.y2}
          stroke="transparent"
          strokeWidth={wall.thickness + 10}
          className="cursor-move"
          onClick={() => onWallClick?.(wall.id)}
        />
        <line
          x1={wall.x1}
          y1={wall.y1}
          x2={wall.x2}
          y2={wall.y2}
          stroke={isSelected ? '#2563eb' : wall.color}
          strokeWidth={isSelected ? 2.5 : 1.5}
          strokeLinecap="round"
          className="pointer-events-none"
        />
        {isSelected && (
          <>
            <circle cx={wall.x1} cy={wall.y1} r={4} fill="#2563eb" stroke="white" strokeWidth={1.5} />
            <circle cx={wall.x2} cy={wall.y2} r={4} fill="#2563eb" stroke="white" strokeWidth={1.5} />
          </>
        )}
      </g>
    );
  };

  const renderAreaContours = () => {
    return areas.map((area) => {
      const points = Array.isArray(area.points) ? area.points : [];
      if (points.length < 3) return null;

      const d = `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
      const isAreaSelected = selectedId === area.id;

      return (
        <path
          key={`contour-${area.id}`}
          d={d}
          fill="none"
          stroke={isAreaSelected ? '#1d4ed8' : '#475569'}
          strokeWidth={isAreaSelected ? 2.5 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
          className="pointer-events-none"
        />
      );
    });
  };

  const renderWallPreview = () => {
    const points = wallDrawingPoints ?? [];
    if (!isDrawingWall || points.length === 0 || !wallPreviewEnd) return null;
    const committedPointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
    const lastPoint = points[points.length - 1];

    return (
      <g>
        {points.length >= 2 && (
          <polyline
            points={committedPointsStr}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="7,5"
            opacity={0.95}
          />
        )}

        {lastPoint && wallPreviewEnd && (
          <line
            x1={lastPoint.x}
            y1={lastPoint.y}
            x2={wallPreviewEnd.x}
            y2={wallPreviewEnd.y}
            stroke="#ef4444"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.95}
          />
        )}

        {points.map((p, i) => (
          <circle
            key={i}
            data-wall-point-index={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#60a5fa"
            stroke="white"
            strokeWidth={1.5}
            className="cursor-move"
          />
        ))}
        {wallPreviewEnd && (
          <circle
            cx={wallPreviewEnd.x}
            cy={wallPreviewEnd.y}
            r={4}
            fill="#93c5fd"
            stroke="#ef4444"
            strokeWidth={1.5}
            className="cursor-move"
          />
        )}
      </g>
    );
  };

  return (
    <g>
      {walls.map(renderWall)}
      {renderAreaContours()}
      {renderWallPreview()}
    </g>
  );
});

AreaLayer.displayName = 'AreaLayer';

export default AreaLayer;
