import { memo } from 'react';
import { GRID_SIZE } from '@/features/floorplan/floorPlanStore';
import DimensionLabel from '../ui/DimensionLabel';

const WallLayer = memo(({ walls, selectedId, showDimensions, onWallClick }) => {
  return (
    <g>
      {walls.map((wall) => {
        const isSelected = selectedId === wall.id;
        const length = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);

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
            {showDimensions && length > 20 && (
              <DimensionLabel x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} />
            )}
          </g>
        );
      })}
    </g>
  );
});

WallLayer.displayName = 'WallLayer';

export default WallLayer;
