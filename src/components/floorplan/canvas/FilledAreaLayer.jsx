import { memo } from 'react';

const FilledAreaLayer = memo(({ areas = [] }) => {
  return (
    <g>
      {areas.map((area) => {
        const points = area.points.map((p) => `${p.x},${p.y}`).join(' ');
        return (
          <polygon
            key={area.id}
            points={points}
            fill={area.fill || 'rgba(59,130,246,0.12)'}
            stroke={area.stroke || '#2563eb'}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
});

FilledAreaLayer.displayName = 'FilledAreaLayer';

export default FilledAreaLayer;
