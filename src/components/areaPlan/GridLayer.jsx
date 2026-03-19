import { memo, useMemo } from 'react';
import { GRID_SIZE } from '@/features/areaPlan/geometryUtils';

const GridLayer = memo(({ visible, gridSize = GRID_SIZE }) => {
  const patternId = 'area-grid-pattern';
  
  if (!visible) return null;
  
  return (
    <g>
      <defs>
        <pattern
          id={patternId}
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={gridSize / 2} cy={gridSize / 2} r={0.5} fill="#cbd5e1" />
        </pattern>
      </defs>
      <rect x={-3000} y={-3000} width={6000} height={6000} fill={`url(#${patternId})`} />
    </g>
  );
});

GridLayer.displayName = 'GridLayer';

export default GridLayer;
