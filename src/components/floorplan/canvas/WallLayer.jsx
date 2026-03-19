import { memo, useState } from 'react';
import { GRID_SIZE, WALL_THICKNESS } from '@/features/floorplan/floorPlanStore';
import InlineDimensionEditor from '../ui/InlineDimensionEditor';

const WallLayer = memo(({ 
  walls, 
  selectedId, 
  showDimensions, 
  onWallClick,
  onDimensionEdit,
  wallDrawingPoints,
  wallPreviewEnd,
  isDrawingWall,
}) => {
  const [editingWallId, setEditingWallId] = useState(null);

  const renderWall = (wall) => {
    const isSelected = selectedId === wall.id;
    const isEditing = editingWallId === wall.id;
    const length = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);
    const mx = (wall.x1 + wall.x2) / 2;
    const my = (wall.y1 + wall.y2) / 2;
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
          stroke={isSelected ? '#2563eb' : wall.color}
          strokeWidth={wall.thickness}
          strokeLinecap="butt"
          className="pointer-events-none"
        />
        {isSelected && (
          <>
            <circle cx={wall.x1} cy={wall.y1} r={4} fill="#2563eb" stroke="white" strokeWidth={1.5} />
            <circle cx={wall.x2} cy={wall.y2} r={4} fill="#2563eb" stroke="white" strokeWidth={1.5} />
          </>
        )}
        {showDimensions && length > 20 && !isEditing && (
          <g onClick={(e) => { e.stopPropagation(); setEditingWallId(wall.id); }}>
            <rect
              x={mx - 16}
              y={my - 10}
              width={32}
              height={12}
              fill="white"
              stroke="#e5e7eb"
              strokeWidth={0.5}
              rx={2}
              className="cursor-text"
            />
            <text
              x={mx}
              y={my + 2}
              textAnchor="middle"
              fontSize={7}
              fill="#374151"
              fontFamily="monospace"
              className="pointer-events-none"
            >
              {(length / GRID_SIZE * 0.1).toFixed(2)}m
            </text>
          </g>
        )}
        {isEditing && (
          <InlineDimensionEditor
            value={(length / GRID_SIZE * 0.1).toFixed(2)}
            x={mx}
            y={my}
            isHorizontal={isHorizontal}
            onSubmit={(val) => {
              onDimensionEdit?.(wall.id, val);
              setEditingWallId(null);
            }}
            onCancel={() => setEditingWallId(null)}
          />
        )}
      </g>
    );
  };

  const renderWallPreview = () => {
    if (!isDrawingWall || wallDrawingPoints.length === 0 || !wallPreviewEnd) return null;

    const points = [...wallDrawingPoints, wallPreviewEnd];
    const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <g>
        <polyline
          points={pointsStr}
          fill="none"
          stroke="#2563eb"
          strokeWidth={WALL_THICKNESS}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
        {wallDrawingPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={5}
            fill={i === 0 ? '#2563eb' : 'white'}
            stroke="#2563eb"
            strokeWidth={1.5}
          />
        ))}
        <circle
          cx={wallPreviewEnd.x}
          cy={wallPreviewEnd.y}
          r={5}
          fill="white"
          stroke="#2563eb"
          strokeWidth={1.5}
          strokeDasharray="3,2"
        />
        <line
          x1={wallDrawingPoints[wallDrawingPoints.length - 1]?.x || wallPreviewEnd.x}
          y1={wallDrawingPoints[wallDrawingPoints.length - 1]?.y || wallPreviewEnd.y}
          x2={wallPreviewEnd.x}
          y2={wallPreviewEnd.y}
          stroke="#2563eb"
          strokeWidth={WALL_THICKNESS}
          strokeDasharray="8,4"
          opacity={0.8}
        />
      </g>
    );
  };

  return (
    <g>
      {walls.map(renderWall)}
      {renderWallPreview()}
    </g>
  );
});

WallLayer.displayName = 'WallLayer';

export default WallLayer;
