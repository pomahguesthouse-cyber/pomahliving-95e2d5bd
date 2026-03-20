import { memo } from 'react';
import { GRID_SIZE, METERS_PER_GRID } from '@/features/floorplan/floorPlanStore';
import ResizeHandles from '../ui/ResizeHandles';

const getPolygonCentroid = (points) => {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < n; i += 1) {
    const { x: x0, y: y0 } = points[i];
    const { x: x1, y: y1 } = points[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  area *= 0.5;
  if (area === 0) {
    const sum = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    return { x: sum.x / n, y: sum.y / n };
  }

  return {
    x: cx / (6 * area),
    y: cy / (6 * area),
  };
};

const getPolygonAreaMeters = (points) => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const { x: x0, y: y0 } = points[i];
    const { x: x1, y: y1 } = points[(i + 1) % points.length];
    area += x0 * y1 - x1 * y0;
  }
  area = Math.abs(area) / 2;
  const scale = METERS_PER_GRID / GRID_SIZE;
  return area * scale * scale;
};

const FilledAreaLayer = memo(({ areas = [], selectedId, onAreaClick, showText = false, showDimensions = false, editingAreaId, editingVertexIndex }) => {
  return (
    <g>
      {areas.map((area, index) => {
        const points = Array.isArray(area.points) ? area.points : [];
        if (points.length < 3) return null; // Need at least 3 points to form a polygon

        const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
        const isSelected = selectedId === area.id;

        const areaMeters = getPolygonAreaMeters(points).toFixed(2);
        const areaLabel = (area.name || area.label || '').trim() || `area-${index + 1}`;

        const centroid = getPolygonCentroid(points);

        const box = {
          x: area.x ?? Math.min(...points.map((p) => p.x)),
          y: area.y ?? Math.min(...points.map((p) => p.y)),
          width: area.width ?? (Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x))),
          height: area.height ?? (Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y))),
        };

        return (
          <g key={area.id}>
            <polygon
              data-id={area.id}
              data-type="area"
              points={pointsStr}
              fill={isSelected ? '#dbeafe' : area.fill || '#f0f9ff'}
              stroke={isSelected ? '#1d4ed8' : area.stroke || '#475569'}
              strokeWidth={isSelected ? 2.5 : 2}
              strokeDasharray="7,5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
              className="cursor-move"
              onClick={() => onAreaClick?.(area.id)}
            />
            {isSelected && (
              <ResizeHandles room={{ id: area.id, ...box, type: 'area' }} />
            )}
            {isSelected && (
              <g className="pointer-events-auto">
                {points.map((point, index) => (
                  <circle
                    key={`vertex-${index}`}
                    data-vertex-index={index}
                    data-area-id={area.id}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill={editingAreaId === area.id && editingVertexIndex === index ? '#ef4444' : '#2563eb'}
                    stroke="white"
                    strokeWidth={1.5}
                    className="cursor-pointer hover:opacity-80 transition-all"
                  />
                ))}
              </g>
            )}
            <g className="pointer-events-none">
              <text
                x={centroid.x}
                y={centroid.y - ((showText || showDimensions) ? 7 : 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight="700"
                fill="#1f2937"
                fontFamily="monospace"
                className="select-none"
              >
                {areaLabel}
              </text>
            </g>
            {(showText || showDimensions) && (
              <g className="pointer-events-none">
                <text
                  x={centroid.x}
                  y={centroid.y + 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight="600"
                  fill="#374151"
                  fontFamily="monospace"
                  className="select-none"
                >
                  {areaMeters} m²
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
});

FilledAreaLayer.displayName = 'FilledAreaLayer';

export default FilledAreaLayer;
