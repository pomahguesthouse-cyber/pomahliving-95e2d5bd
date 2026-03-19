import { memo } from 'react';

const ResizeHandles = memo(({ room }) => {
  const handles = [
    { position: 'nw', x: room.x - 4, y: room.y - 4, cursor: 'nw-resize' },
    { position: 'ne', x: room.x + room.width - 4, y: room.y - 4, cursor: 'ne-resize' },
    { position: 'sw', x: room.x - 4, y: room.y + room.height - 4, cursor: 'sw-resize' },
    { position: 'se', x: room.x + room.width - 4, y: room.y + room.height - 4, cursor: 'se-resize' },
    { position: 'n', x: room.x + room.width / 2 - 4, y: room.y - 4, cursor: 'n-resize' },
    { position: 's', x: room.x + room.width / 2 - 4, y: room.y + room.height - 4, cursor: 's-resize' },
    { position: 'w', x: room.x - 4, y: room.y + room.height / 2 - 4, cursor: 'w-resize' },
    { position: 'e', x: room.x + room.width - 4, y: room.y + room.height / 2 - 4, cursor: 'e-resize' },
  ];

  return (
    <>
      {handles.map(({ position, x, y, cursor }) => (
        <rect
          key={position}
          data-id={room.id}
          data-handle={position}
          x={x}
          y={y}
          width={8}
          height={8}
          fill="white"
          stroke="#2563eb"
          strokeWidth={1}
          rx={1}
          className={`cursor-${cursor}`}
        />
      ))}
    </>
  );
});

ResizeHandles.displayName = 'ResizeHandles';

export default ResizeHandles;
