import { useState, useRef, useCallback, useEffect } from 'react';
import useFloorPlanStore, { GRID_SIZE, METERS_PER_GRID, WALL_THICKNESS } from '@/features/floorplan/floorPlanStore';
import FloatingActions from './FloatingActions';
import DimensionLabel from '@/components/floorplan/ui/DimensionLabel';

const FloorPlanCanvas = () => {
  const svgRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [panStart, setPanStart] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [resizingRoom, setResizingRoom] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const [wallPointIndex, setWallPointIndex] = useState(null);

  const {
    walls, rooms, doors, windows, openings, landBoundary, outdoorElements,
    selectedId, selectedType, activeTool, gridVisible, zoom, panOffset,
    uploadedImage, showText, showDimensions,
    setActiveTool, setSelected, addWall, addRoom, addDoor, addWindow,
    addOpening, setLandBoundary, addOutdoorElement,
    moveItem, deleteItem, setZoom, setPanOffset, updateRoom,
  } = useFloorPlanStore();

  const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const getCanvasPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    };
  }, [zoom, panOffset]);

  const getScreenPoint = useCallback((canvasX, canvasY) => {
    return {
      x: canvasX * zoom + panOffset.x,
      y: canvasY * zoom + panOffset.y,
    };
  }, [zoom, panOffset]);

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setIsPanning(true);
      return;
    }

    const point = getCanvasPoint(e);

    if (activeTool === 'wall' || activeTool === 'land' || activeTool === 'room' ||
        activeTool === 'garden' || activeTool === 'road' || activeTool === 'carport') {
      setDragStart({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
    } else if (activeTool === 'door') {
      const id = addDoor(point.x, point.y);
      setSelected(id, 'door');
      setActiveTool('select');
    } else if (activeTool === 'window') {
      const id = addWindow(point.x, point.y);
      setSelected(id, 'window');
      setActiveTool('select');
    } else if (activeTool === 'opening') {
      const id = addOpening(point.x, point.y);
      setSelected(id, 'opening');
      setActiveTool('select');
    } else if (activeTool === 'select') {
      const target = e.target;
      const id = target.getAttribute('data-id');
      const type = target.getAttribute('data-type');
      const handle = target.getAttribute('data-handle');
      
      if (handle && id) {
        setResizingRoom(id);
        setResizeHandle(handle);
        setResizeStart({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
      } else if (id && type) {
        if (editingRoomId) {
          updateRoom(editingRoomId, { name: editingRoomName });
          setEditingRoomId(null);
        }
        setSelected(id, type);
        setIsDragging(true);
        setDragStart({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
      } else {
        if (editingRoomId) {
          updateRoom(editingRoomId, { name: editingRoomName });
          setEditingRoomId(null);
        }
        setSelected(null, null);
        setIsDragging(false);
        setDragStart(null);
      }
    }
  };

  const handleMouseMove = (e) => {
    const point = getCanvasPoint(e);
    setMousePos(point);

    if (isPanning && panStart) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (resizingRoom && resizeHandle && resizeStart) {
      const room = rooms.find((r) => r.id === resizingRoom);
      if (!room) return;
      
      const snappedX = snapToGrid(point.x);
      const snappedY = snapToGrid(point.y);
      const minSize = GRID_SIZE;
      
      let newX = room.x;
      let newY = room.y;
      let newWidth = room.width;
      let newHeight = room.height;

      if (resizeHandle === 'nw') {
        const dx = snappedX - resizeStart.x;
        const dy = snappedY - resizeStart.y;
        const newW = Math.max(minSize, room.width - dx);
        const newH = Math.max(minSize, room.height - dy);
        newX = room.x + room.width - newW;
        newY = room.y + room.height - newH;
        newWidth = newW;
        newHeight = newH;
      } else if (resizeHandle === 'ne') {
        const dx = snappedX - resizeStart.x;
        const dy = snappedY - resizeStart.y;
        newWidth = Math.max(minSize, room.width + dx);
        newY = room.y + room.height - Math.max(minSize, room.height - dy);
        newHeight = Math.max(minSize, room.height - dy);
      } else if (resizeHandle === 'sw') {
        const dx = snappedX - resizeStart.x;
        const dy = snappedY - resizeStart.y;
        const newW = Math.max(minSize, room.width - dx);
        newX = room.x + room.width - newW;
        newWidth = newW;
        newHeight = Math.max(minSize, room.height + dy);
      } else if (resizeHandle === 'se') {
        const dx = snappedX - resizeStart.x;
        const dy = snappedY - resizeStart.y;
        newWidth = Math.max(minSize, room.width + dx);
        newHeight = Math.max(minSize, room.height + dy);
      } else if (resizeHandle === 'n') {
        const dy = snappedY - resizeStart.y;
        newY = room.y + dy;
        newHeight = Math.max(minSize, room.height - dy);
      } else if (resizeHandle === 's') {
        const dy = snappedY - resizeStart.y;
        newHeight = Math.max(minSize, room.height + dy);
      } else if (resizeHandle === 'w') {
        const dx = snappedX - resizeStart.x;
        newX = room.x + dx;
        newWidth = Math.max(minSize, room.width - dx);
      } else if (resizeHandle === 'e') {
        const dx = snappedX - resizeStart.x;
        newWidth = Math.max(minSize, room.width + dx);
      }

      newX = snapToGrid(newX);
      newY = snapToGrid(newY);
      newWidth = snapToGrid(newWidth);
      newHeight = snapToGrid(newHeight);

      updateRoom(resizingRoom, { x: newX, y: newY, width: newWidth, height: newHeight });
      setResizeStart({ x: snappedX, y: snappedY });
      return;
    }

    if (isDragging && selectedId && dragStart) {
      const dx = snapToGrid(point.x) - snapToGrid(dragStart.x);
      const dy = snapToGrid(point.y) - snapToGrid(dragStart.y);
      if (dx !== 0 || dy !== 0) {
        moveItem(selectedId, selectedType, dx, dy);
        setDragStart({ x: point.x, y: point.y });
      }
    }
  };

  const handleMouseUp = (e) => {
    const point = getCanvasPoint(e);

    if (isPanning) {
      setPanStart(null);
      setIsPanning(false);
      return;
    }

    if (resizingRoom) {
      useFloorPlanStore.getState()._pushHistory();
      setResizingRoom(null);
      setResizeHandle(null);
      setResizeStart(null);
      return;
    }

    if (activeTool === 'wall' && dragStart) {
      const endX = snapToGrid(point.x);
      const endY = snapToGrid(point.y);
      if (endX !== dragStart.x || endY !== dragStart.y) {
        const id = addWall(dragStart.x, dragStart.y, endX, endY);
        setSelected(id, 'wall');
      }
      setDragStart(null);
    } else if (activeTool === 'room' && dragStart) {
      const width = snapToGrid(point.x) - dragStart.x;
      const height = snapToGrid(point.y) - dragStart.y;
      if (Math.abs(width) > GRID_SIZE && Math.abs(height) > GRID_SIZE) {
        const x = width > 0 ? dragStart.x : dragStart.x + width;
        const y = height > 0 ? dragStart.y : dragStart.y + height;
        const id = addRoom(x, y, Math.abs(width), Math.abs(height));
        setSelected(id, 'room');
      }
      setDragStart(null);
    } else if (activeTool === 'land' && dragStart) {
      const width = snapToGrid(point.x) - dragStart.x;
      const height = snapToGrid(point.y) - dragStart.y;
      if (Math.abs(width) > GRID_SIZE && Math.abs(height) > GRID_SIZE) {
        const x = width > 0 ? dragStart.x : dragStart.x + width;
        const y = height > 0 ? dragStart.y : dragStart.y + height;
        setLandBoundary(x, y, Math.abs(width), Math.abs(height));
        setActiveTool('select');
      }
      setDragStart(null);
    } else if (['garden', 'road', 'carport'].includes(activeTool) && dragStart) {
      const width = snapToGrid(point.x) - dragStart.x;
      const height = snapToGrid(point.y) - dragStart.y;
      if (Math.abs(width) > GRID_SIZE && Math.abs(height) > GRID_SIZE) {
        const x = width > 0 ? dragStart.x : dragStart.x + width;
        const y = height > 0 ? dragStart.y : dragStart.y + height;
        const typeMap = { garden: 'garden', road: 'road', carport: 'carport' };
        const id = addOutdoorElement(typeMap[activeTool], x, y, Math.abs(width), Math.abs(height));
        setSelected(id, 'outdoor');
      }
      setDragStart(null);
    }

    setIsDragging(false);
    setDragStart(null);
    if (isDragging && selectedId) {
      useFloorPlanStore.getState()._pushHistory();
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) deleteItem(selectedId);
      }
      if (e.key === 'Escape') {
        setSelected(null, null);
        setRoomEditMode(false);
        setActiveTool('select');
      }
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'r' || e.key === 'R') setActiveTool('room');
      if (e.key === 'w' || e.key === 'W') setActiveTool('wall');
      if (e.key === 'd' || e.key === 'D') setActiveTool('door');
      if (e.key === 'n' || e.key === 'N') setActiveTool('window');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteItem, setSelected, setActiveTool]);

  const renderLandBoundary = () => {
    if (!landBoundary) return null;
    const { x, y, width, height } = landBoundary;
    const isSelected = selectedId === 'land-boundary';
    return (
      <g>
        <rect
          data-id="land-boundary"
          data-type="land-boundary"
          x={x} y={y} width={width} height={height}
          fill="none"
          stroke={isSelected ? '#2563eb' : '#94a3b8'}
          strokeWidth={2}
          strokeDasharray="12,6"
          className="cursor-move"
        />
        {showDimensions && (
          <>
            <DimensionLabel x1={x} y1={y + height + 20} x2={x + width} y2={y + height + 20} />
            <DimensionLabel x1={x - 20} y1={y} x2={x - 20} y2={y + height} />
          </>
        )}
      </g>
    );
  };

  const renderOutdoorElements = () => (
    <g>
      {outdoorElements.map((el) => {
        const isSelected = selectedId === el.id;
        return (
          <g key={el.id}>
            <rect
              data-id={el.id}
              data-type="outdoor"
              x={el.x} y={el.y} width={el.width} height={el.height}
              fill={el.fill}
              stroke={isSelected ? '#2563eb' : el.stroke}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={el.type === 'road' ? 'none' : '4,2'}
              rx={0}
              className="cursor-move"
            />
            {showText && (
              <text
                x={el.x + el.width / 2} y={el.y + el.height / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={12} fill="#6b7280" className="select-none pointer-events-none"
              >
                {el.label}
              </text>
            )}
            {showDimensions && (
              <text
                x={el.x + el.width / 2} y={el.y + el.height / 2 + 16}
                textAnchor="middle" fontSize={9} fill="#9ca3af" fontFamily="monospace"
                className="pointer-events-none"
              >
                {(el.width / GRID_SIZE * METERS_PER_GRID).toFixed(1)} x {(el.height / GRID_SIZE * METERS_PER_GRID).toFixed(1)}m
              </text>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderRooms = () => (
    <g>
      {rooms.map((room) => {
        const isSelected = selectedId === room.id;
        const isEditing = editingRoomId === room.id;
        const w = (room.width / GRID_SIZE) * METERS_PER_GRID;
        const h = (room.height / GRID_SIZE) * METERS_PER_GRID;
        const area = (w * h).toFixed(2);
        return (
          <g key={room.id}>
            <rect
              data-id={room.id}
              data-type="room"
              x={room.x} y={room.y} width={room.width} height={room.height}
              fill={isSelected ? '#eff6ff' : room.fill}
              stroke={isSelected ? '#2563eb' : room.stroke}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray="4,2"
              className="cursor-move"
              onDoubleClick={() => {
                setEditingRoomId(room.id);
                setEditingRoomName(room.name);
              }}
            />
            {/* Room labels */}
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
                      onChange={(e) => setEditingRoomName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateRoom(room.id, { name: editingRoomName });
                          setEditingRoomId(null);
                        } else if (e.key === 'Escape') {
                          setEditingRoomId(null);
                        }
                      }}
                      onBlur={() => {
                        updateRoom(room.id, { name: editingRoomName });
                        setEditingRoomId(null);
                      }}
                      autoFocus
                      className="w-full px-2 py-1 text-xs text-center bg-white border-2 border-blue-500 rounded outline-none shadow"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                  </foreignObject>
                ) : (
                  <text
                    x={room.x + room.width / 2} y={room.y + room.height / 2 - 10}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fontWeight="600" fill="#1f2937"
                    className="select-none pointer-events-none cursor-text"
                    onDoubleClick={() => {
                      setEditingRoomId(room.id);
                      setEditingRoomName(room.name);
                    }}
                  >
                    {room.name}
                  </text>
                )}
                <text
                  x={room.x + room.width / 2} y={room.y + room.height / 2 + 4}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={9} fill="#6b7280" fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {w.toFixed(1)} x {h.toFixed(1)}m
                </text>
                <text
                  x={room.x + room.width / 2} y={room.y + room.height / 2 + 14}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={8} fill="#9ca3af" fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {area} m²
                </text>
              </>
            )}
            {/* Dimension lines - show when selected */}
            {isSelected && showDimensions && (
              <>
                <DimensionLabel x1={room.x} y1={room.y - 10} x2={room.x + room.width} y2={room.y - 10} />
                <DimensionLabel x1={room.x + room.width + 10} y1={room.y} x2={room.x + room.width + 10} y2={room.y + room.height} />
              </>
            )}
            {/* Resize handles - show on single click when selected */}
            {isSelected && !isEditing && (
              <>
                {/* Corner handles */}
                <rect data-id={room.id} data-handle="nw" x={room.x - 4} y={room.y - 4} width={8} height={8}
                  fill="white" stroke="#2563eb" strokeWidth={1} rx={1} className="cursor-nw-resize" />
                <rect data-id={room.id} data-handle="ne" x={room.x + room.width - 4} y={room.y - 4} width={8} height={8}
                  fill="white" stroke="#2563eb" strokeWidth={1} rx={1} className="cursor-ne-resize" />
                <rect data-id={room.id} data-handle="sw" x={room.x - 4} y={room.y + room.height - 4} width={8} height={8}
                  fill="white" stroke="#2563eb" strokeWidth={1} rx={1} className="cursor-sw-resize" />
                <rect data-id={room.id} data-handle="se" x={room.x + room.width - 4} y={room.y + room.height - 4} width={8} height={8}
                  fill="white" stroke="#2563eb" strokeWidth={1} rx={1} className="cursor-se-resize" />
                {/* Edge handles */}
                <rect data-id={room.id} data-handle="n" x={room.x + room.width / 2 - 4} y={room.y - 4} width={8} height={8}
                  fill="white" stroke="#2563eb" strokeWidth={1} rx={1} className="cursor-n-resize" />
                <rect data-id={room.id} data-handle="s" x={room.x + room.width / 2 - 4} y={room.y + room.height - 4} width={8} height={8}
                  fill="white" stroke="#2563eb" strokeWidth={1} rx={1} className="cursor-s-resize" />
                <rect data-id={room.id} data-handle="w" x={room.x - 4} y={room.y + room.height / 2 - 4} width={8} height={8}
                  fill="white" stroke="#2563eb" strokeWidth={1} rx={1} className="cursor-w-resize" />
                <rect data-id={room.id} data-handle="e" x={room.x + room.width - 4} y={room.y + room.height / 2 - 4} width={8} height={8}
                  fill="white" stroke="#2563eb" strokeWidth={1} rx={1} className="cursor-e-resize" />
              </>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderWalls = () => (
    <g>
      {walls.map((wall) => {
        const isSelected = selectedId === wall.id;
        const length = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);
        return (
          <g key={wall.id}>
            {/* Hit area */}
            <line
              data-id={wall.id} data-type="wall"
              x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
              stroke="transparent" strokeWidth={wall.thickness + 10}
              className="cursor-move"
            />
            <line
              x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
              stroke={isSelected ? '#2563eb' : wall.color}
              strokeWidth={wall.thickness}
              strokeLinecap="butt"
              className="pointer-events-none"
            />
            {isSelected && (
              <>
                <circle cx={wall.x1} cy={wall.y1} r={4} fill="#2563eb" stroke="white" strokeWidth={1.5} />
                <circle cx={wall.x2} cy={wall.y2} r={4} fill="#2563eb" stroke="white" strokeWidth={1.5} />
              </>
            )}
            {showDimensions && length > 20 && (
              <DimensionLabel x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} />
            )}
          </g>
        );
      })}
    </g>
  );

  const renderDoors = () => (
    <g>
      {doors.map((door) => {
        const isSelected = selectedId === door.id;
        const r = door.width / 2;
        return (
          <g key={door.id} transform={`translate(${door.x}, ${door.y}) rotate(${door.rotation})`}>
            {/* Door panel */}
            <line
              data-id={door.id} data-type="door"
              x1={-r} y1={0} x2={r} y2={0}
              stroke={isSelected ? '#2563eb' : '#374151'}
              strokeWidth={6}
              className="cursor-move"
            />
            {/* Arc swing */}
            <path
              d={`M ${r} 0 A ${r} ${r} 0 0 0 0 ${-r}`}
              fill="none"
              stroke={isSelected ? '#2563eb' : '#6b7280'}
              strokeWidth={1.5}
              strokeDasharray="4,3"
              className="pointer-events-none"
            />
            {/* Pivot */}
            <circle cx={-r} cy={0} r={3} fill={isSelected ? '#2563eb' : '#374151'} className="pointer-events-none" />
            {showDimensions && (
              <text x={0} y={-r - 8} textAnchor="middle" fontSize={9} fill="#6b7280" fontFamily="monospace"
                className="pointer-events-none">
                P
              </text>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderWindows = () => (
    <g>
      {windows.map((win) => {
        const isSelected = selectedId === win.id;
        const hw = win.width / 2;
        return (
          <g key={win.id} transform={`translate(${win.x}, ${win.y}) rotate(${win.rotation})`}>
            {/* Window frame */}
            <rect
              data-id={win.id} data-type="window"
              x={-hw} y={-5} width={win.width} height={10}
              fill="white" stroke={isSelected ? '#2563eb' : '#374151'}
              strokeWidth={2} className="cursor-move"
            />
            {/* Glass panes */}
            <line x1={0} y1={-5} x2={0} y2={5} stroke={isSelected ? '#2563eb' : '#374151'} strokeWidth={1.5} className="pointer-events-none" />
            {/* Inner lines */}
            <line x1={-hw + 2} y1={0} x2={-2} y2={0} stroke="#93c5fd" strokeWidth={1} className="pointer-events-none" />
            <line x1={2} y1={0} x2={hw - 2} y2={0} stroke="#93c5fd" strokeWidth={1} className="pointer-events-none" />
            {showDimensions && (
              <text x={0} y={-12} textAnchor="middle" fontSize={9} fill="#6b7280" fontFamily="monospace"
                className="pointer-events-none">
                J
              </text>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderOpenings = () => (
    <g>
      {openings.map((op) => {
        const isSelected = selectedId === op.id;
        const hw = op.width / 2;
        return (
          <g key={op.id} transform={`translate(${op.x}, ${op.y}) rotate(${op.rotation})`}>
            <line
              data-id={op.id} data-type="opening"
              x1={-hw} y1={0} x2={hw} y2={0}
              stroke={isSelected ? '#2563eb' : '#9ca3af'}
              strokeWidth={4} strokeDasharray="8,6"
              className="cursor-move"
            />
          </g>
        );
      })}
    </g>
  );

  const renderDrawingPreview = () => {
    if (!dragStart) return null;
    const point = mousePos;

    if (activeTool === 'wall') {
      return (
        <line
          x1={dragStart.x} y1={dragStart.y}
          x2={snapToGrid(point.x)} y2={snapToGrid(point.y)}
          stroke="#2563eb" strokeWidth={WALL_THICKNESS}
          strokeLinecap="butt" strokeDasharray="10,5" opacity={0.6}
        />
      );
    }

    if (['room', 'land', 'garden', 'road', 'carport'].includes(activeTool)) {
      const width = snapToGrid(point.x) - dragStart.x;
      const height = snapToGrid(point.y) - dragStart.y;
      const x = width > 0 ? dragStart.x : dragStart.x + width;
      const y = height > 0 ? dragStart.y : dragStart.y + height;
      const fills = { room: '#eff6ff', land: 'transparent', garden: '#dcfce7', road: '#f3f4f6', carport: '#f9fafb' };
      return (
        <rect
          x={x} y={y} width={Math.abs(width)} height={Math.abs(height)}
          fill={fills[activeTool] || '#f3f4f6'}
          stroke="#2563eb" strokeWidth={2} strokeDasharray="6,4" opacity={0.7}
        />
      );
    }

    return null;
  };

  const renderUploadedImage = () => {
    if (!uploadedImage) return null;
    return (
      <image href={uploadedImage} x={0} y={0} width={800} height={600}
        opacity={0.3} preserveAspectRatio="xMidYMid meet" />
    );
  };

  // Get selected item screen position for floating actions
  const getSelectedScreenPos = () => {
    if (!selectedId) return null;
    let cx, cy;
    if (selectedType === 'room') {
      const room = rooms.find(r => r.id === selectedId);
      if (!room) return null;
      cx = room.x + room.width / 2;
      cy = room.y;
    } else if (selectedType === 'wall') {
      const wall = walls.find(w => w.id === selectedId);
      if (!wall) return null;
      cx = (wall.x1 + wall.x2) / 2;
      cy = Math.min(wall.y1, wall.y2);
    } else if (selectedType === 'door') {
      const door = doors.find(d => d.id === selectedId);
      if (!door) return null;
      cx = door.x; cy = door.y;
    } else if (selectedType === 'window') {
      const win = windows.find(w => w.id === selectedId);
      if (!win) return null;
      cx = win.x; cy = win.y;
    } else if (selectedType === 'opening') {
      const op = openings.find(o => o.id === selectedId);
      if (!op) return null;
      cx = op.x; cy = op.y;
    } else if (selectedType === 'outdoor') {
      const el = outdoorElements.find(e => e.id === selectedId);
      if (!el) return null;
      cx = el.x + el.width / 2; cy = el.y;
    } else if (selectedType === 'land-boundary' && landBoundary) {
      cx = landBoundary.x + landBoundary.width / 2; cy = landBoundary.y;
    } else return null;

    return getScreenPoint(cx, cy);
  };

  const floatingPos = getSelectedScreenPos();

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'select') return 'default';
    return 'crosshair';
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: '#f8fafc', cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="smallGrid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <rect width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
          </pattern>
          <pattern id="grid" width={GRID_SIZE * 5} height={GRID_SIZE * 5} patternUnits="userSpaceOnUse">
            <rect width={GRID_SIZE * 5} height={GRID_SIZE * 5} fill="url(#smallGrid)" />
            <path d={`M ${GRID_SIZE * 5} 0 L 0 0 0 ${GRID_SIZE * 5}`} fill="none" stroke="#cbd5e1" strokeWidth={0.8} />
          </pattern>
        </defs>

        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
          {gridVisible && <rect x={-3000} y={-3000} width={6000} height={6000} fill="url(#grid)" />}
          {renderUploadedImage()}
          {renderLandBoundary()}
          {renderOutdoorElements()}
          {renderRooms()}
          {renderWalls()}
          {renderOpenings()}
          {renderDoors()}
          {renderWindows()}
          {renderDrawingPreview()}
        </g>
      </svg>

      {/* Floating action panel */}
      {selectedId && floatingPos && (
        <FloatingActions
          x={floatingPos.x}
          y={floatingPos.y - 50}
          selectedId={selectedId}
        />
      )}
    </div>
  );
};

export default FloorPlanCanvas;
