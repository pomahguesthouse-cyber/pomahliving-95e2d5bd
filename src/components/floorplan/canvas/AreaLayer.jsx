import { memo, useMemo } from 'react';
import LineDrawingOverlay from './LineDrawingOverlay';

const AreaLayer = memo(({ 
  walls, 
  areas = [],
  selectedId, 
  hoveredWallId,
  onWallClick,
  wallDrawingPoints,
  wallPreviewEnd,
  isDrawingWall,
  snapIndicator,
  angleLabel,
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
    const isHovered = hoveredWallId === wall.id;
    const strokeColor = isSelected ? '#2563eb' : isHovered ? '#ef4444' : wall.color;

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
          stroke={strokeColor}
          strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
          strokeLinecap="round"
          strokeDasharray="7,5"
          className="pointer-events-none"
        />
        {isSelected && (
          <>
            <circle data-id={wall.id} data-type="wall" data-wall-handle="start" cx={wall.x1} cy={wall.y1} r={5} fill="#2563eb" stroke="white" strokeWidth={1.5} className="cursor-move" />
            <circle data-id={wall.id} data-type="wall" data-wall-handle="end" cx={wall.x2} cy={wall.y2} r={5} fill="#2563eb" stroke="white" strokeWidth={1.5} className="cursor-move" />
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
          strokeDasharray="7,5"
          opacity={0.9}
          className="pointer-events-none"
        />
      );
    });
  };

  return (
    <g>
      {walls.map(renderWall)}
      {renderAreaContours()}
      <LineDrawingOverlay
        points={wallDrawingPoints}
        previewEnd={wallPreviewEnd}
        isDrawing={isDrawingWall}
        snapIndicator={snapIndicator}
        angleLabel={angleLabel}
      />
    </g>
  );
});

AreaLayer.displayName = 'AreaLayer';

export default AreaLayer;
