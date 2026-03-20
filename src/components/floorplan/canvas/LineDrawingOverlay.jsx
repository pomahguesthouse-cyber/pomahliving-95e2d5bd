import { memo } from 'react';

const snapStyles = {
  endpoint: { stroke: '#2563eb', fill: '#dbeafe' },
  startpoint: { stroke: '#1d4ed8', fill: '#bfdbfe' },
  midpoint: { stroke: '#f59e0b', fill: '#fef3c7' },
  intersection: { stroke: '#be123c', fill: '#ffe4e6' },
  'line-segment': { stroke: '#0f766e', fill: '#ccfbf1' },
  grid: { stroke: '#94a3b8', fill: '#ffffff' },
};

const LineDrawingOverlay = memo(({ points = [], previewEnd, isDrawing, snapIndicator, angleLabel, lengthLabel }) => {
  if (!isDrawing || points.length === 0 || !previewEnd) return null;

  const committedPointsStr = points.map((point) => `${point.x},${point.y}`).join(' ');
  const lastPoint = points[points.length - 1];
  const snapStyle = snapIndicator ? (snapStyles[snapIndicator.type] || snapStyles.grid) : null;
  const angleX = previewEnd.x + 10;
  const angleY = previewEnd.y - 14;
  const lengthX = (lastPoint.x + previewEnd.x) / 2;
  const lengthY = (lastPoint.y + previewEnd.y) / 2 - 14;

  return (
    <g>
      {points.length >= 2 && (
        <polyline
          points={committedPointsStr}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="7,5"
          opacity={0.95}
        />
      )}

      <line
        x1={lastPoint.x}
        y1={lastPoint.y}
        x2={previewEnd.x}
        y2={previewEnd.y}
        stroke="#ef4444"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.95}
      />

      {points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          data-wall-point-index={index}
          cx={point.x}
          cy={point.y}
          r={4}
          fill="#60a5fa"
          stroke="white"
          strokeWidth={1.5}
          className="cursor-move"
        />
      ))}

      {snapIndicator && snapStyle && snapIndicator.type !== 'line-segment' && (
        <g className="pointer-events-none" opacity={0.95}>
          <line
            x1={snapIndicator.x - 9}
            y1={snapIndicator.y}
            x2={snapIndicator.x + 9}
            y2={snapIndicator.y}
            stroke={snapStyle.stroke}
            strokeWidth={1}
          />
          <line
            x1={snapIndicator.x}
            y1={snapIndicator.y - 9}
            x2={snapIndicator.x}
            y2={snapIndicator.y + 9}
            stroke={snapStyle.stroke}
            strokeWidth={1}
          />
          <circle
            cx={snapIndicator.x}
            cy={snapIndicator.y}
            r={5}
            fill={snapStyle.fill}
            stroke={snapStyle.stroke}
            strokeWidth={1.5}
          />
        </g>
      )}

      {snapIndicator?.type === 'line-segment' && snapStyle && (
        <g className="pointer-events-none" opacity={0.95}>
          <line
            x1={snapIndicator.x1}
            y1={snapIndicator.y1}
            x2={snapIndicator.x2}
            y2={snapIndicator.y2}
            stroke={snapStyle.stroke}
            strokeWidth={2}
            strokeDasharray="5,4"
          />
          <circle
            cx={snapIndicator.x}
            cy={snapIndicator.y}
            r={5}
            fill={snapStyle.fill}
            stroke={snapStyle.stroke}
            strokeWidth={1.5}
          />
        </g>
      )}

      {lengthLabel && (
        <g className="pointer-events-none">
          <rect
            x={lengthX - 22}
            y={lengthY - 10}
            width={44}
            height={16}
            rx={4}
            fill="white"
            stroke="#e2e8f0"
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            x={lengthX}
            y={lengthY + 1}
            textAnchor="middle"
            fontSize={8}
            fontFamily="monospace"
            fill="#334155"
          >
            {lengthLabel}
          </text>
        </g>
      )}

      {angleLabel && (
        <g className="pointer-events-none">
          <rect
            x={angleX - 18}
            y={angleY - 10}
            width={36}
            height={16}
            rx={4}
            fill="white"
            stroke="#e2e8f0"
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            x={angleX}
            y={angleY + 1}
            textAnchor="middle"
            fontSize={8}
            fontFamily="monospace"
            fill="#334155"
          >
            {angleLabel}
          </text>
        </g>
      )}
    </g>
  );
});

LineDrawingOverlay.displayName = 'LineDrawingOverlay';

export default LineDrawingOverlay;