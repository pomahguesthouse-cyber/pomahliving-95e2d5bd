import { memo } from 'react';

const ResizeHandles = memo(({ room }) => {
  const size = 6;
  const offset = 3;
  
  const handles = [
    { position: 'nw', x: room.x - offset, y: room.y - offset, cursor: 'nw-resize' },
    { position: 'ne', x: room.x + room.width - offset, y: room.y - offset, cursor: 'ne-resize' },
    { position: 'sw', x: room.x - offset, y: room.y + room.height - offset, cursor: 'sw-resize' },
    { position: 'se', x: room.x + room.width - offset, y: room.y + room.height - offset, cursor: 'se-resize' },
    { position: 'n', x: room.x + room.width / 2 - offset, y: room.y - offset, cursor: 'n-resize' },
    { position: 's', x: room.x + room.width / 2 - offset, y: room.y + room.height - offset, cursor: 's-resize' },
    { position: 'w', x: room.x - offset, y: room.y + room.height / 2 - offset, cursor: 'w-resize' },
    { position: 'e', x: room.x + room.width - offset, y: room.y + room.height / 2 - offset, cursor: 'e-resize' },
  ];

  return (
    <>
      {handles.map(({ position, x, y, cursor }) => (
        <rect
          key={position}
          data-id={room.id}
          data-type={room.type || 'room'}
          data-handle={position}
          x={x}
          y={y}
          width={size}
          height={size}
          fill="white"
          stroke="#2563eb"
          strokeWidth={0.75}
          rx={1}
          className="cursor-nw-resize"
          style={{ cursor }}
        />
      ))}
    </>
  );
});

ResizeHandles.displayName = 'ResizeHandles';

export default ResizeHandles;
