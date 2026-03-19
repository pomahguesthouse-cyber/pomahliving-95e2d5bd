import { memo } from 'react';
import { GRID_SIZE, getPolygonArea, formatArea } from '@/features/areaPlan/geometryUtils';

const DrawingPreviewLayer = memo(({ drawingPoints, previewPoint, isDrawing }) => {
  if (!isDrawing || drawingPoints.length === 0) return null;
  
  const points = [...drawingPoints];
  if (previewPoint) {
    points.push(previewPoint);
  }
  
  const pointsString = points.map((p) => `${p.x},${p.y}`).join(' ');
  
  let areaSize = 0;
  if (points.length >= 3) {
    areaSize = getPolygonArea(points);
  }
  
  const centroid = points.length >= 3
    ? {
        x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
        y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
      }
    : null;
  
  const isClosing = previewPoint?.isClosing;
  
  return (
    <g>
      {points.length >= 3 && (
        <polygon
          points={pointsString}
          fill="#0ea5e9"
          fillOpacity={0.1}
          stroke="#0ea5e9"
          strokeWidth={2}
          strokeDasharray="6,4"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
      )}
      
      {points.length >= 1 && (
        <polyline
          points={pointsString}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="none"
          opacity={0.7}
          className="pointer-events-none"
        />
      )}
      
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={index === 0 ? 6 : 4}
          fill={index === 0 ? (isClosing ? '#22c55e' : '#0ea5e9') : 'white'}
          stroke={index === 0 ? (isClosing ? '#22c55e' : '#0ea5e9') : '#0ea5e9'}
          strokeWidth={2}
          className="pointer-events-none"
        />
      ))}
      
      {previewPoint && !isClosing && (
        <>
          <line
            x1={drawingPoints[drawingPoints.length - 1].x}
            y1={drawingPoints[drawingPoints.length - 1].y}
            x2={previewPoint.x}
            y2={previewPoint.y}
            stroke="#0ea5e9"
            strokeWidth={2}
            strokeDasharray="4,4"
            opacity={0.5}
            className="pointer-events-none"
          />
        </>
      )}
      
      {isClosing && drawingPoints.length >= 2 && (
        <circle
          cx={drawingPoints[0].x}
          cy={drawingPoints[0].y}
          r={10}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2}
          strokeDasharray="4,4"
          className="pointer-events-none animate-pulse"
        />
      )}
      
      {centroid && points.length >= 3 && (
        <g className="pointer-events-none">
          <rect
            x={centroid.x - 40}
            y={centroid.y - 12}
            width={80}
            height={24}
            fill="white"
            stroke="#e5e7eb"
            strokeWidth={1}
            rx={4}
          />
          <text
            x={centroid.x}
            y={centroid.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="monospace"
            fill="#6b7280"
          >
            {formatArea(areaSize)}
          </text>
        </g>
      )}
      
      <text
        x={drawingPoints[0].x}
        y={drawingPoints[0].y - 15}
        textAnchor="middle"
        fontSize={9}
        fill="#0ea5e9"
        fontWeight={500}
        className="pointer-events-none"
      >
        Start
      </text>
      
      {drawingPoints.length >= 1 && (
        <text
          x={drawingPoints[drawingPoints.length - 1].x}
          y={drawingPoints[drawingPoints.length - 1].y - 15}
          textAnchor="middle"
          fontSize={9}
          fill="#0ea5e9"
          fontWeight={500}
          className="pointer-events-none"
        >
          Click to add
        </text>
      )}
    </g>
  );
});

DrawingPreviewLayer.displayName = 'DrawingPreviewLayer';

export default DrawingPreviewLayer;
