import { memo } from 'react';
import { GRID_SIZE } from '@/features/floorplan/floorPlanStore';

const GridLayer = memo(({ visible = true }) => {
  if (!visible) return null;

  return (
    <defs>
      <pattern id="smallGrid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
        <rect width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
      </pattern>
      <pattern id="grid" width={GRID_SIZE * 2} height={GRID_SIZE * 2} patternUnits="userSpaceOnUse">
        <rect width={GRID_SIZE * 2} height={GRID_SIZE * 2} fill="url(#smallGrid)" />
        <path d={`M ${GRID_SIZE * 2} 0 L 0 0 0 ${GRID_SIZE * 2}`} fill="none" stroke="#cbd5e1" strokeWidth={0.8} />
      </pattern>
    </defs>
  );
});

GridLayer.displayName = 'GridLayer';

export default GridLayer;
