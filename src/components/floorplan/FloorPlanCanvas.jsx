import { useState, useRef, useCallback, useEffect } from 'react';
import useFloorPlanStore, { GRID_SIZE } from '@/features/floorplan/floorPlanStore';

const FloorPlanCanvas = () => {
  const svgRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [panStart, setPanStart] = useState(null);
  
  const {
    walls,
    rooms,
    doors,
    windows,
    selectedId,
    selectedType,
    activeTool,
    gridVisible,
    zoom,
    panOffset,
    uploadedImage,
    isDrawing,
    drawingStart,
    setActiveTool,
    setSelected,
    addWall,
    addRoom,
    addDoor,
    addWindow,
    updateWall,
    updateRoom,
    updateDoor,
    updateWindow,
    moveItem,
    deleteItem,
    setZoom,
    setPanOffset,
  } = useFloorPlanStore();

  const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const getCanvasPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;
    
    return { x, y };
  }, [zoom, panOffset]);

  const handleMouseDown = (e) => {
    if (e.button === 1) {
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    const point = getCanvasPoint(e);

    if (activeTool === 'wall') {
      setDragStart({ x: snapToGrid(point.x), y: snapToGrid(point.y), type: 'start' });
    } else if (activeTool === 'room') {
      setDragStart({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
    } else if (activeTool === 'door') {
      const id = addDoor(point.x, point.y);
      setSelected(id, 'door');
      setActiveTool('select');
    } else if (activeTool === 'window') {
      const id = addWindow(point.x, point.y);
      setSelected(id, 'window');
      setActiveTool('select');
    } else if (activeTool === 'select') {
      const target = e.target;
      const id = target.getAttribute('data-id');
      const type = target.getAttribute('data-type');
      
      if (id && type) {
        setSelected(id, type);
        setIsDragging(true);
        setDragStart({ x: point.x, y: point.y });
      } else {
        setSelected(null, null);
      }
    }
  };

  const handleMouseMove = (e) => {
    const point = getCanvasPoint(e);
    setMousePos(point);

    if (panStart) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
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

    if (panStart) {
      setPanStart(null);
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
    }

    setIsDragging(false);
    setDragStart(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          deleteItem(selectedId);
        }
      }
      if (e.key === 'Escape') {
        setSelected(null, null);
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteItem, setSelected, setActiveTool]);

  const renderGrid = () => {
    if (!gridVisible) return null;
    
    const gridLines = [];
    const size = 4000;
    const start = -2000;
    
    for (let i = start; i <= size; i += GRID_SIZE) {
      const isMajor = i % (GRID_SIZE * 5) === 0;
      gridLines.push(
        <line
          key={`v-${i}`}
          x1={i}
          y1={start}
          x2={i}
          y2={size}
          stroke={isMajor ? '#d1d5db' : '#e5e7eb'}
          strokeWidth={isMajor ? 1 : 0.5}
        />
      );
      gridLines.push(
        <line
          key={`h-${i}`}
          x1={start}
          y1={i}
          x2={size}
          y2={i}
          stroke={isMajor ? '#d1d5db' : '#e5e7eb'}
          strokeWidth={isMajor ? 1 : 0.5}
        />
      );
    }
    
    return <g className="grid">{gridLines}</g>;
  };

  const renderWalls = () => (
    <g className="walls">
      {walls.map((wall) => {
        const isSelected = selectedId === wall.id;
        const length = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
        const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
        
        return (
          <g key={wall.id}>
            <line
              data-id={wall.id}
              data-type="wall"
              x1={wall.x1}
              y1={wall.y1}
              x2={wall.x2}
              y2={wall.y2}
              stroke={isSelected ? '#06b6d4' : wall.color}
              strokeWidth={wall.thickness}
              strokeLinecap="round"
              className="cursor-move"
              style={{ cursor: activeTool === 'select' ? 'move' : 'default' }}
            />
            {isSelected && (
              <>
                <circle cx={wall.x1} cy={wall.y1} r={8} fill="#06b6d4" />
                <circle cx={wall.x2} cy={wall.y2} r={8} fill="#06b6d4" />
              </>
            )}
            {length > 30 && (
              <text
                x={(wall.x1 + wall.x2) / 2}
                y={(wall.y1 + wall.y2) / 2 - 15}
                textAnchor="middle"
                className="text-xs fill-gray-500 select-none pointer-events-none"
              >
                {(length / GRID_SIZE).toFixed(1)}m
              </text>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderRooms = () => (
    <g className="rooms">
      {rooms.map((room) => {
        const isSelected = selectedId === room.id;
        return (
          <g key={room.id}>
            <rect
              data-id={room.id}
              data-type="room"
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              fill={room.fill}
              stroke={isSelected ? '#06b6d4' : room.stroke}
              strokeWidth={isSelected ? 3 : 1}
              strokeDasharray={isSelected ? 'none' : '5,5'}
              className="cursor-move"
              style={{ cursor: activeTool === 'select' ? 'move' : 'default' }}
            />
            <text
              x={room.x + room.width / 2}
              y={room.y + room.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm fill-gray-400 select-none pointer-events-none"
            >
              {(room.width / GRID_SIZE).toFixed(1)} x {(room.height / GRID_SIZE).toFixed(1)}m
            </text>
          </g>
        );
      })}
    </g>
  );

  const renderDoors = () => (
    <g className="doors">
      {doors.map((door) => {
        const isSelected = selectedId === door.id;
        return (
          <g key={door.id} transform={`translate(${door.x}, ${door.y}) rotate(${door.rotation})`}>
            <rect
              data-id={door.id}
              data-type="door"
              x={-door.width / 2}
              y={-8}
              width={door.width}
              height={16}
              fill="#8b5cf6"
              stroke={isSelected ? '#06b6d4' : '#7c3aed'}
              strokeWidth={isSelected ? 2 : 1}
              rx={2}
              className="cursor-move"
            />
            <path
              d={`M ${-door.width / 2} 0 A ${door.width / 2} ${door.width / 2} 0 0 1 ${door.width / 2} 0`}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          </g>
        );
      })}
    </g>
  );

  const renderWindows = () => (
    <g className="windows">
      {windows.map((win) => {
        const isSelected = selectedId === win.id;
        return (
          <g key={win.id} transform={`translate(${win.x}, ${win.y}) rotate(${win.rotation})`}>
            <rect
              data-id={win.id}
              data-type="window"
              x={-win.width / 2}
              y={-6}
              width={win.width}
              height={12}
              fill="#22d3ee"
              stroke={isSelected ? '#06b6d4' : '#0891b2'}
              strokeWidth={isSelected ? 2 : 1}
              rx={2}
              className="cursor-move"
            />
            <line x1={-win.width / 4} y1={-6} x2={-win.width / 4} y2={6} stroke="white" strokeWidth={1} />
            <line x1={win.width / 4} y1={-6} x2={win.width / 4} y2={6} stroke="white" strokeWidth={1} />
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
          x1={dragStart.x}
          y1={dragStart.y}
          x2={snapToGrid(point.x)}
          y2={snapToGrid(point.y)}
          stroke="#06b6d4"
          strokeWidth={WALL_THICKNESS}
          strokeLinecap="round"
          strokeDasharray="10,5"
          opacity={0.7}
        />
      );
    }
    
    if (activeTool === 'room') {
      const width = snapToGrid(point.x) - dragStart.x;
      const height = snapToGrid(point.y) - dragStart.y;
      const x = width > 0 ? dragStart.x : dragStart.x + width;
      const y = height > 0 ? dragStart.y : dragStart.y + height;
      
      return (
        <rect
          x={x}
          y={y}
          width={Math.abs(width)}
          height={Math.abs(height)}
          fill="#f3f4f6"
          stroke="#06b6d4"
          strokeWidth={2}
          strokeDasharray="5,5"
          opacity={0.7}
        />
      );
    }
    
    return null;
  };

  const renderUploadedImage = () => {
    if (!uploadedImage) return null;
    
    return (
      <image
        href={uploadedImage}
        x={0}
        y={0}
        width={800}
        height={600}
        opacity={0.3}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  };

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-white"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: panStart ? 'grabbing' : activeTool === 'select' ? 'default' : 'crosshair' }}
    >
      <defs>
        <pattern id="smallGrid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
          <rect width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke="#e5e7eb" strokeWidth={0.5} />
        </pattern>
        <pattern id="grid" width={GRID_SIZE * 5} height={GRID_SIZE * 5} patternUnits="userSpaceOnUse">
          <rect width={GRID_SIZE * 5} height={GRID_SIZE * 5} fill="url(#smallGrid)" />
          <path d={`M ${GRID_SIZE * 5} 0 L 0 0 0 ${GRID_SIZE * 5}`} fill="none" stroke="#d1d5db" strokeWidth={1} />
        </pattern>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
        </marker>
      </defs>
      
      <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
        <rect x={-2000} y={-2000} width={4000} height={4000} fill="url(#grid)" />
        
        {renderUploadedImage()}
        {renderRooms()}
        {renderWalls()}
        {renderDoors()}
        {renderWindows()}
        {renderDrawingPreview()}
      </g>
    </svg>
  );
};

export default FloorPlanCanvas;
