import { memo } from 'react';

const OpeningLayer = memo(({ doors, windows, openings, selectedId, showDimensions, onDoorClick, onWindowClick }) => {
  return (
    <g>
      {doors.map((door) => {
        const isSelected = selectedId === door.id;
        const r = door.width / 2;
        return (
          <g key={door.id} transform={`translate(${door.x}, ${door.y}) rotate(${door.rotation})`}>
            <line
              data-id={door.id}
              data-type="door"
              x1={-r}
              y1={0}
              x2={r}
              y2={0}
              stroke={isSelected ? '#2563eb' : '#374151'}
              strokeWidth={6}
              className="cursor-move"
              onClick={() => onDoorClick?.(door.id)}
            />
            <path
              d={`M ${r} 0 A ${r} ${r} 0 0 0 0 ${-r}`}
              fill="none"
              stroke={isSelected ? '#2563eb' : '#6b7280'}
              strokeWidth={1.5}
              strokeDasharray="4,3"
              className="pointer-events-none"
            />
            <circle cx={-r} cy={0} r={3} fill={isSelected ? '#2563eb' : '#374151'} className="pointer-events-none" />
            {showDimensions && (
              <text x={0} y={-r - 8} textAnchor="middle" fontSize={7} fill="#6b7280" fontFamily="monospace">
                P
              </text>
            )}
          </g>
        );
      })}

      {windows.map((win) => {
        const isSelected = selectedId === win.id;
        const hw = win.width / 2;
        return (
          <g key={win.id} transform={`translate(${win.x}, ${win.y}) rotate(${win.rotation})`}>
            <rect
              data-id={win.id}
              data-type="window"
              x={-hw}
              y={-5}
              width={win.width}
              height={10}
              fill="white"
              stroke={isSelected ? '#2563eb' : '#374151'}
              strokeWidth={2}
              className="cursor-move"
              onClick={() => onWindowClick?.(win.id)}
            />
            <line x1={0} y1={-5} x2={0} y2={5} stroke={isSelected ? '#2563eb' : '#374151'} strokeWidth={1.5} className="pointer-events-none" />
            <line x1={-hw + 2} y1={0} x2={-2} y2={0} stroke="#93c5fd" strokeWidth={1} className="pointer-events-none" />
            <line x1={2} y1={0} x2={hw - 2} y2={0} stroke="#93c5fd" strokeWidth={1} className="pointer-events-none" />
            {showDimensions && (
              <text x={0} y={-12} textAnchor="middle" fontSize={7} fill="#6b7280" fontFamily="monospace">
                J
              </text>
            )}
          </g>
        );
      })}

      {openings.map((op) => {
        const isSelected = selectedId === op.id;
        const hw = op.width / 2;
        return (
          <g key={op.id} transform={`translate(${op.x}, ${op.y}) rotate(${op.rotation})`}>
            <line
              data-id={op.id}
              data-type="opening"
              x1={-hw}
              y1={0}
              x2={hw}
              y2={0}
              stroke={isSelected ? '#2563eb' : '#9ca3af'}
              strokeWidth={4}
              strokeDasharray="8,6"
              className="cursor-move"
            />
          </g>
        );
      })}
    </g>
  );
});

OpeningLayer.displayName = 'OpeningLayer';

export default OpeningLayer;
