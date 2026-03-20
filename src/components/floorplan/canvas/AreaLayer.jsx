import { memo, useMemo, useState } from 'react';
import { GRID_SIZE, METERS_PER_GRID } from '@/features/floorplan/floorPlanStore';
import InlineDimensionEditor from '../ui/InlineDimensionEditor';
import LineDrawingOverlay from './LineDrawingOverlay';

const AreaLayer = memo(({ 
  walls, 
  areas = [],
  selectedId, 
  hoveredWallId,
  showDimensions,
  onWallClick,
  onDimensionEdit,
  wallDrawingPoints,
  wallPreviewEnd,
  isDrawingWall,
  snapIndicator,
  angleLabel,
  previewLengthLabel,
}) => {
  const [editingWallId, setEditingWallId] = useState(null);
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
    const isEditing = editingWallId === wall.id;
    const mx = (wall.x1 + wall.x2) / 2;
    const my = (wall.y1 + wall.y2) / 2;
    const wallLengthMeters = ((wall.length || Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1)) / GRID_SIZE) * METERS_PER_GRID;
    const isHorizontal = Math.abs(wall.y2 - wall.y1) < Math.abs(wall.x2 - wall.x1);

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
        {showDimensions && !isEditing && (
          <g onClick={(event) => { event.stopPropagation(); setEditingWallId(wall.id); }}>
            <rect
              x={mx - 20}
              y={my - 10}
              width={40}
              height={14}
              rx={4}
              fill="white"
              stroke="#e2e8f0"
              strokeWidth={1}
              opacity={0.95}
              className="cursor-text"
            />
            <text
              x={mx}
              y={my + 1}
              textAnchor="middle"
              fontSize={8}
              fontFamily="monospace"
              fill="#334155"
              className="pointer-events-none"
            >
              {wallLengthMeters.toFixed(2)}m
            </text>
          </g>
        )}
        {isEditing && (
          <InlineDimensionEditor
            value={wallLengthMeters.toFixed(2)}
            x={mx}
            y={my}
            isHorizontal={isHorizontal}
            onSubmit={(value) => {
              onDimensionEdit?.(wall.id, value);
              setEditingWallId(null);
            }}
            onCancel={() => setEditingWallId(null)}
          />
        )}
      </g>
    );
  };

  return (
    <g>
      {walls.map(renderWall)}
      <LineDrawingOverlay
        points={wallDrawingPoints}
        previewEnd={wallPreviewEnd}
        isDrawing={isDrawingWall}
        snapIndicator={snapIndicator}
        angleLabel={angleLabel}
        lengthLabel={previewLengthLabel}
      />
    </g>
  );
});

AreaLayer.displayName = 'AreaLayer';

export default AreaLayer;
