import { memo } from 'react';
import { GRID_SIZE } from '@/features/floorplan/floorPlanStore';
import ResizeHandles from '../ui/ResizeHandles';
import DimensionLabel from '../ui/DimensionLabel';

const RoomLayer = memo(({
  rooms,
  selectedId,
  editingRoomId,
  editingRoomName,
  showText,
  showDimensions,
  onRoomClick,
  onRoomDoubleClick,
  onNameDoubleClick,
}) => {
  return (
    <g>
      {rooms.map((room) => {
        const isSelected = selectedId === room.id;
        const isEditing = editingRoomId === room.id;
        const w = room.width / GRID_SIZE;
        const h = room.height / GRID_SIZE;
        const area = (w * h).toFixed(2);

        return (
          <g key={room.id}>
            <rect
              data-id={room.id}
              data-type="room"
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              fill={isSelected ? '#eff6ff' : room.fill}
              stroke={isSelected ? '#2563eb' : room.stroke}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray="4,2"
              className="cursor-move"
              onClick={() => onRoomClick?.(room.id)}
              onDoubleClick={() => onRoomDoubleClick?.(room.id, room.name)}
            />

            {showText && (
              <>
                {isEditing ? (
                  <foreignObject
                    x={room.x + room.width / 2 - 50}
                    y={room.y + room.height / 2 - 18}
                    width={100}
                    height={28}
                  >
                    <input
                      type="text"
                      value={editingRoomName}
                      className="w-full px-2 py-1 text-xs text-center bg-white border-2 border-blue-500 rounded outline-none shadow"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                  </foreignObject>
                ) : (
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.height / 2 - 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fontWeight="600"
                    fill="#1f2937"
                    className="select-none pointer-events-none cursor-text"
                    onDoubleClick={() => onNameDoubleClick?.(room.id, room.name)}
                  >
                    {room.name}
                  </text>
                )}
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 + 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill="#6b7280"
                  fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {w.toFixed(1)} x {h.toFixed(1)}m
                </text>
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fill="#9ca3af"
                  fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {area} m²
                </text>
              </>
            )}

            {showDimensions && isSelected && (
              <>
                <DimensionLabel x1={room.x} y1={room.y - 10} x2={room.x + room.width} y2={room.y - 10} />
                <DimensionLabel x1={room.x + room.width + 10} y1={room.y} x2={room.x + room.width + 10} y2={room.y + room.height} />
              </>
            )}

            {isSelected && !isEditing && (
              <ResizeHandles room={room} />
            )}
          </g>
        );
      })}
    </g>
  );
});

RoomLayer.displayName = 'RoomLayer';

export default RoomLayer;
