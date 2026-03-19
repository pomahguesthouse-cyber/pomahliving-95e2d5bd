import { memo, useState } from 'react';
import { GRID_SIZE, METERS_PER_GRID } from '@/features/floorplan/floorPlanStore';
import ResizeHandles from '../ui/ResizeHandles';
import InlineDimensionEditor from '../ui/InlineDimensionEditor';

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
  onRoomUpdate,
}) => {
  const [editingWidth, setEditingWidth] = useState(null);
  const [editingHeight, setEditingHeight] = useState(null);

  const renderRoomDimension = (room, isHorizontal, position) => {
    const length = isHorizontal ? room.width : room.height;
    const lengthMeters = (length / GRID_SIZE * METERS_PER_GRID).toFixed(2);
    const mx = isHorizontal ? room.x + room.width / 2 : room.x - 10;
    const my = isHorizontal ? room.y - 10 : room.y + room.height / 2;
    const isEditing = isHorizontal ? editingWidth === room.id : editingHeight === room.id;
    const editState = isHorizontal ? editingWidth : editingHeight;

    if (isEditing) {
      return (
        <InlineDimensionEditor
          key={`edit-${position}-${room.id}`}
          value={lengthMeters}
          x={mx}
          y={my}
          isHorizontal={isHorizontal}
          onSubmit={(val) => {
            const newLengthPx = Math.round((val / METERS_PER_GRID) * GRID_SIZE);
            const updates = isHorizontal 
              ? { width: newLengthPx } 
              : { height: newLengthPx };
            onRoomUpdate?.(room.id, updates);
            if (isHorizontal) setEditingWidth(null);
            else setEditingHeight(null);
          }}
          onCancel={() => {
            if (isHorizontal) setEditingWidth(null);
            else setEditingHeight(null);
          }}
        />
      );
    }

    return (
      <g key={`dim-${position}-${room.id}`} onClick={(e) => { e.stopPropagation(); isHorizontal ? setEditingWidth(room.id) : setEditingHeight(room.id); }}>
        <rect
          x={mx - 16}
          y={my - 5}
          width={32}
          height={10}
          fill="white"
          stroke="#e5e7eb"
          strokeWidth={0.5}
          rx={2}
          className="cursor-text"
        />
        <text
          x={mx}
          y={my + 2}
          textAnchor="middle"
          fontSize={7}
          fill="#374151"
          fontFamily="monospace"
          className="pointer-events-none"
        >
          {lengthMeters}m
        </text>
      </g>
    );
  };

  return (
    <g>
      {rooms.map((room) => {
        const isSelected = selectedId === room.id;
        const isEditing = editingRoomId === room.id;
        const wMeters = (room.width / GRID_SIZE * METERS_PER_GRID).toFixed(2);
        const hMeters = (room.height / GRID_SIZE * METERS_PER_GRID).toFixed(2);
        const area = (room.width / GRID_SIZE * METERS_PER_GRID * (room.height / GRID_SIZE * METERS_PER_GRID)).toFixed(2);

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
                  {wMeters} x {hMeters}m
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
                {renderRoomDimension(room, true, 'width')}
                {renderRoomDimension(room, false, 'height')}
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
