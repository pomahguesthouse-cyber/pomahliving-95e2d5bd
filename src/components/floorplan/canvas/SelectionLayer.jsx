import { memo } from 'react';
import { GRID_SIZE } from '@/features/floorplan/floorPlanStore';
import ResizeHandles from '../ui/ResizeHandles';

const SelectionLayer = memo(({ landBoundary, outdoorElements, selectedId, showText, showDimensions, showLandDimensions }) => {
  const renderLandBoundary = () => {
    if (!landBoundary) return null;
    const { x, y, width, height } = landBoundary;
    const isSelected = selectedId === 'land-boundary';

    return (
      <g>
        <rect
          data-id="land-boundary"
          data-type="land-boundary"
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke={isSelected ? '#2563eb' : '#94a3b8'}
          strokeWidth={2}
          strokeDasharray="12,6"
          className="cursor-move"
        />
        {showLandDimensions && (
          <>
            <text
              x={x + width / 2}
              y={y - 8}
              textAnchor="middle"
              fontSize={9}
              fill="#64748b"
              fontFamily="monospace"
              className="pointer-events-none"
            >
              {(width / GRID_SIZE * 0.1).toFixed(2)}m
            </text>
            <text
              x={x + width + 8}
              y={y + height / 2}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={9}
              fill="#64748b"
              fontFamily="monospace"
              className="pointer-events-none"
            >
              {(height / GRID_SIZE * 0.1).toFixed(2)}m
            </text>
          </>
        )}
        {isSelected && (
          <ResizeHandles room={{ id: 'land-boundary', x, y, width, height, type: 'land-boundary' }} />
        )}
      </g>
    );
  };

  const renderOutdoorElements = () => (
    <>
      {outdoorElements.map((el) => {
        const isSelected = selectedId === el.id;
        return (
          <g key={el.id}>
            <rect
              data-id={el.id}
              data-type="outdoor"
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill={el.fill}
              stroke={isSelected ? '#2563eb' : el.stroke}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={el.type === 'road' ? 'none' : '4,2'}
              rx={0}
              className="cursor-move"
            />
            {showText && (
              <text
                x={el.x + el.width / 2}
                y={el.y + el.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="#6b7280"
                className="select-none pointer-events-none"
              >
                {el.label}
              </text>
            )}
            {showDimensions && (
              <text
                x={el.x + el.width / 2}
                y={el.y + el.height / 2 + 14}
                textAnchor="middle"
                fontSize={8}
                fill="#9ca3af"
                fontFamily="monospace"
                className="pointer-events-none"
              >
                {(el.width / GRID_SIZE * 0.1).toFixed(2)} x {(el.height / GRID_SIZE * 0.1).toFixed(2)}m
              </text>
            )}
          </g>
        );
      })}
    </>
  );

  return (
    <g>
      {renderLandBoundary()}
      {renderOutdoorElements()}
    </g>
  );
});

SelectionLayer.displayName = 'SelectionLayer';

export default SelectionLayer;
