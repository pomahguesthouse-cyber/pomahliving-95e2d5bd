import { memo } from 'react';
import { GRID_SIZE, METERS_PER_GRID } from '@/features/floorplan/floorPlanStore';
import ResizeHandles from '../ui/ResizeHandles';

const toMeters = (px) => (px / GRID_SIZE * METERS_PER_GRID);

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

const FilledAreaLayer = memo(({ areas = [], selectedId, onAreaClick, showText = false, showDimensions = false }) => {
  return (
    <g>
      {areas.map((area) => {
        const points = Array.isArray(area.points) ? area.points : [];
        if (points.length < 3) return null; // Need at least 3 points to form a polygon

        const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
        const isSelected = selectedId === area.id;

        const minX = Math.min(...points.map((p) => p.x));
        const maxX = Math.max(...points.map((p) => p.x));
        const minY = Math.min(...points.map((p) => p.y));
        const maxY = Math.max(...points.map((p) => p.y));

        const wMeters = toMeters(maxX - minX).toFixed(2);
        const hMeters = toMeters(maxY - minY).toFixed(2);
        const areaMeters = getPolygonAreaMeters(points).toFixed(2);

        const centroid = getPolygonCentroid(points);

        const box = {
          x: area.x ?? minX,
          y: area.y ?? minY,
          width: area.width ?? (maxX - minX),
          height: area.height ?? (maxY - minY),
        };

        return (
          <g key={area.id}>
            <polygon
              data-id={area.id}
              data-type="area"
              points={pointsStr}
              fill={isSelected ? '#eff6ff' : area.fill || 'rgba(59,130,246,0.12)'}
              stroke={isSelected ? '#2563eb' : area.stroke || '#9ca3af'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray="4,2"
              className="cursor-move"
              onClick={() => onAreaClick?.(area.id)}
            />
            {isSelected && (
              <ResizeHandles room={{ id: area.id, ...box, type: 'area' }} />
            )}
            {(showText || showDimensions) && (
              <g className="pointer-events-none">
                {showText && (
                  <text
                    x={centroid.x}
                    y={centroid.y - 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fontWeight="600"
                    fill="#1f2937"
                    className="select-none"
                  >
                    Ruangan
                  </text>
                )}
                <text
                  x={centroid.x}
                  y={centroid.y + (showText ? 4 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill="#6b7280"
                  fontFamily="monospace"
                  className="select-none"
                >
                  {wMeters} x {hMeters}m
                </text>
                <text
                  x={centroid.x}
                  y={centroid.y + (showText ? 14 : 10)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fill="#9ca3af"
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
