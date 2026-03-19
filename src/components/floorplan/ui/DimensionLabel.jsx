import { memo } from 'react';

const DimensionLabel = memo(({ x1, y1, x2, y2, offset = 10 }) => {
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  if (len < 20) return null;

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);

  return (
    <g className="pointer-events-none">
      <line
        x1={x1}
        y1={y1 - (isHorizontal ? offset : 0)}
        x2={x1}
        y2={y1 + (isHorizontal ? offset : 0)}
        stroke="#6b7280"
        strokeWidth={0.5}
      />
      <line
        x1={x2}
        y1={y2 - (isHorizontal ? offset : 0)}
        x2={x2}
        y2={y2 + (isHorizontal ? offset : 0)}
        stroke="#6b7280"
        strokeWidth={0.5}
      />
      <line
        x1={x1}
        y1={isHorizontal ? y1 - offset : y1}
        x2={x2}
        y2={isHorizontal ? y2 - offset : y2}
        stroke="#6b7280"
        strokeWidth={0.5}
      />
      <rect
        x={mx - 14}
        y={(isHorizontal ? my - offset : my) - 5}
        width={28}
        height={10}
        rx={2}
        fill="white"
        stroke="#d1d5db"
        strokeWidth={0.3}
      />
      <text
        x={mx}
        y={(isHorizontal ? my - offset : my) + 2}
        textAnchor="middle"
        fontSize={7}
        fill="#374151"
        fontFamily="monospace"
      >
        {(len / 20).toFixed(1)}m
      </text>
    </g>
  );
});

DimensionLabel.displayName = 'DimensionLabel';

export default DimensionLabel;
