import { useState, useRef, useCallback, useEffect } from 'react';
import useFloorPlanStore, { GRID_SIZE, WALL_THICKNESS } from '@/features/floorplan/floorPlanStore';

const FloorPlanCanvas = ({ svgRef }) => {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [panStart, setPanStart] = useState(null);
  const [previewEnd, setPreviewEnd] = useState(null);
  
  const {
    walls,
    rooms,
    openings,
    selectedId,
    selectedType,
    activeTool,
    gridVisible,
    zoom,
    panOffset,
    showDimensions,
    showLabels,
    setSelected,
    addRoom,
    addWall,
    addOpening,
    updateRoom,
    deleteItem,
    moveRoom,
    snapToGrid,
    getWallLength,
    getRoomArea,
    deleteItem: removeItem,
  } = useFloorPlanStore();

  const getCanvasPoint = useCallback((e) => {
    const svg = svgRef?.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;
    
    return { x, y };
  }, [zoom, panOffset, svgRef]);

  const handleMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    const point = getCanvasPoint(e);
    const snappedX = snapToGrid(point.x);
    const snappedY = snapToGrid(point.y);

    if (activeTool === 'room') {
      setDragStart({ x: snappedX, y: snappedY });
    } else if (activeTool === 'wall') {
      setDragStart({ x: snappedX, y: snappedY });
    } else if (activeTool === 'door') {
      const nearestWall = findNearestWall(point);
      if (nearestWall) {
        const offset = getOffsetOnWall(nearestWall, point);
        const id = addOpening('door', nearestWall.id, offset);
        setSelected(id, 'opening');
      }
    } else if (activeTool === 'window') {
      const nearestWall = findNearestWall(point);
      if (nearestWall) {
        const offset = getOffsetOnWall(nearestWall, point);
        const id = addOpening('window', nearestWall.id, offset);
        setSelected(id, 'opening');
      }
    } else if (activeTool === 'select') {
      const target = e.target;
      const id = target.getAttribute('data-id');
      const type = target.getAttribute('data-type');
      
      if (id && type) {
        setSelected(id, type);
        setDragStart({ x: point.x, y: point.y, id, type });
      } else {
        setSelected(null, null);
      }
    }
  };

  const handleMouseMove = (e) => {
    const point = getCanvasPoint(e);
    setMousePos(point);

    if (panStart) {
      useFloorPlanStore.setState({
        panOffset: {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        }
      });
      return;
    }

    if (activeTool === 'wall' && dragStart) {
      setPreviewEnd({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
    } else if (activeTool === 'room' && dragStart) {
      setPreviewEnd({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
    }

    if (dragStart && dragStart.id && activeTool === 'select') {
      const dx = snapToGrid(point.x - dragStart.x);
      const dy = snapToGrid(point.y - dragStart.y);
      
      if (dx !== 0 || dy !== 0) {
        if (dragStart.type === 'room') {
          moveRoom(dragStart.id, dx, dy);
        }
        setDragStart({ ...dragStart, x: point.x, y: point.y });
      }
    }
  };

  const handleMouseUp = (e) => {
    const point = getCanvasPoint(e);

    if (panStart) {
      setPanStart(null);
      return;
    }

    if (activeTool === 'wall' && dragStart && previewEnd) {
      const length = Math.sqrt(
        Math.pow(previewEnd.x - dragStart.x, 2) + Math.pow(previewEnd.y - dragStart.y, 2)
      );
      if (length > GRID_SIZE) {
        const id = addWall(dragStart.x, dragStart.y, previewEnd.x, previewEnd.y);
        setSelected(id, 'wall');
      }
      setDragStart(null);
      setPreviewEnd(null);
    } else if (activeTool === 'room' && dragStart && previewEnd) {
      const width = previewEnd.x - dragStart.x;
      const height = previewEnd.y - dragStart.y;
      
      if (Math.abs(width) > GRID_SIZE && Math.abs(height) > GRID_SIZE) {
        const x = width > 0 ? dragStart.x : dragStart.x + width;
        const y = height > 0 ? dragStart.y : dragStart.y + height;
        const id = addRoom(x, y, Math.abs(width), Math.abs(height));
        setSelected(id, 'room');
      }
      setDragStart(null);
      setPreviewEnd(null);
    }

    setDragStart(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    useFloorPlanStore.setState((state) => ({
      zoom: Math.max(0.25, Math.min(4, state.zoom + delta))
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = useFloorPlanStore.getState();
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedId) {
          deleteItem(state.selectedId);
        }
      }
      if (e.key === 'Escape') {
        setSelected(null, null);
        useFloorPlanStore.setState({ activeTool: 'select' });
      }
      if (e.key === 'v') useFloorPlanStore.setState({ activeTool: 'select' });
      if (e.key === 'r') useFloorPlanStore.setState({ activeTool: 'room' });
      if (e.key === 'w') useFloorPlanStore.setState({ activeTool: 'wall' });
      if (e.key === 'd') useFloorPlanStore.setState({ activeTool: 'door' });
      if (e.key === 'n') useFloorPlanStore.setState({ activeTool: 'window' });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteItem, setSelected]);

  const findNearestWall = (point) => {
    let nearest = null;
    let minDist = 50;

    walls.forEach((wall) => {
      const dist = pointToLineDistance(point, wall);
      if (dist < minDist) {
        minDist = dist;
        nearest = wall;
      }
    });

    return nearest;
  };

  const getOffsetOnWall = (wall, point) => {
    const wallLength = getWallLength(wall);
    const dot = ((point.x - wall.x1) * (wall.x2 - wall.x1) + (point.y - wall.y1) * (wall.y2 - wall.y1)) / (wallLength * wallLength);
    return Math.max(0.1, Math.min(0.9, dot));
  };

  const pointToLineDistance = (point, wall) => {
    const A = point.x - wall.x1;
    const B = point.y - wall.y1;
    const C = wall.x2 - wall.x1;
    const D = wall.y2 - wall.y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = wall.x1;
      yy = wall.y1;
    } else if (param > 1) {
      xx = wall.x2;
      yy = wall.y2;
    } else {
      xx = wall.x1 + param * C;
      yy = wall.y1 + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const renderGrid = () => {
    if (!gridVisible) return null;
    
    const lines = [];
    const size = 4000;
    const start = -2000;
    const majorEvery = GRID_SIZE * 5;
    
    for (let i = start; i <= size; i += GRID_SIZE) {
      const isMajor = i % majorEvery === 0;
      lines.push(
        <line key={`v${i}`} x1={i} y1={start} x2={i} y2={size}
          stroke={isMajor ? '#cbd5e1' : '#e2e8f0'} strokeWidth={isMajor ? 1 : 0.5} />
      );
      lines.push(
        <line key={`h${i}`} x1={start} y1={i} x2={size} y2={i}
          stroke={isMajor ? '#cbd5e1' : '#e2e8f0'} strokeWidth={isMajor ? 1 : 0.5} />
      );
    }
    
    return <g className="grid">{lines}</g>;
  };

  const renderRooms = () => (
    <g className="rooms">
      {rooms.map((room) => {
        const isSelected = selectedId === room.id;
        const area = getRoomArea(room);
        const widthM = (room.width / GRID_SIZE).toFixed(1);
        const heightM = (room.height / GRID_SIZE).toFixed(1);

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
              strokeWidth={isSelected ? 3 : 1.5}
              strokeDasharray={isSelected ? 'none' : '8,4'}
              className="cursor-move transition-all duration-150"
              style={{ cursor: activeTool === 'select' ? 'move' : 'default' }}
            />
            
            {showLabels && (
              <g className="pointer-events-none select-none">
                <rect
                  x={room.x + room.width / 2 - 40}
                  y={room.y + room.height / 2 - 24}
                  width={80}
                  height={48}
                  fill="white"
                  opacity={0.9}
                  rx={4}
                />
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 - 6}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-700"
                >
                  {room.name}
                </text>
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 + 10}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-500"
                >
                  {widthM} × {heightM}m
                </text>
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2 + 24}
                  textAnchor="middle"
                  className="text-[10px] font-medium fill-cyan-600"
                >
                  {area} m²
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderWalls = () => (
    <g className="walls">
      {walls.map((wall) => {
        const isSelected = selectedId === wall.id;
        const length = getWallLength(wall);
        const lengthM = (length / GRID_SIZE).toFixed(2);
        
        const midX = (wall.x1 + wall.x2) / 2;
        const midY = (wall.y1 + wall.y2) / 2;
        const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
        const labelOffset = 20;

        return (
          <g key={wall.id}>
            <line
              data-id={wall.id}
              data-type="wall"
              x1={wall.x1}
              y1={wall.y1}
              x2={wall.x2}
              y2={wall.y2}
              stroke={isSelected ? '#06b6d4' : '#475569'}
              strokeWidth={wall.thickness}
              strokeLinecap="round"
              className="transition-all duration-150"
              style={{ cursor: activeTool === 'select' ? 'move' : 'default' }}
            />
            
            {isSelected && (
              <>
                <circle cx={wall.x1} cy={wall.y1} r={6} fill="#06b6d4" className="cursor-move" />
                <circle cx={wall.x2} cy={wall.y2} r={6} fill="#06b6d4" className="cursor-move" />
              </>
            )}
            
            {showDimensions && length > 40 && (
              <g transform={`translate(${midX}, ${midY}) rotate(${angle * 180 / Math.PI})`}>
                <rect
                  x={-24}
                  y={-10}
                  width={48}
                  height={20}
                  fill="white"
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  rx={4}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  className="text-[11px] font-medium fill-gray-600"
                >
                  {lengthM}m
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderOpenings = () => (
    <g className="openings">
      {openings.map((opening) => {
        const wall = walls.find((w) => w.id === opening.wallId);
        if (!wall) return null;

        const isSelected = selectedId === opening.id;
        const length = getWallLength(wall);
        
        const startX = wall.x1 + (wall.x2 - wall.x1) * opening.offset;
        const startY = wall.y1 + (wall.y2 - wall.y1) * opening.offset;
        
        const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
        const perpAngle = angle + Math.PI / 2;
        
        const halfWidth = opening.width / 2;
        const offsetX = Math.cos(angle) * halfWidth;
        const offsetY = Math.sin(angle) * halfWidth;
        
        const color = opening.type === 'door' ? '#8b5cf6' : '#0891b2';
        const darkColor = opening.type === 'door' ? '#7c3aed' : '#0e7490';

        return (
          <g 
            key={opening.id}
            transform={`translate(${startX}, ${startY}) rotate(${angle * 180 / Math.PI})`}
          >
            <rect
              data-id={opening.id}
              data-type="opening"
              x={-halfWidth}
              y={-8}
              width={opening.width}
              height={16}
              fill={color}
              stroke={isSelected ? '#06b6d4' : darkColor}
              strokeWidth={isSelected ? 2 : 1}
              rx={3}
              className="cursor-move transition-all duration-150"
            />
            
            {opening.type === 'door' && (
              <path
                d={`M ${-halfWidth} 0 A ${halfWidth} ${halfWidth} 0 0 1 ${halfWidth} 0`}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray="4,3"
                opacity={0.7}
              />
            )}
            
            {opening.type === 'window' && (
              <>
                <line x1={-halfWidth * 0.6} y1={-6} x2={-halfWidth * 0.6} y2={6} stroke="white" strokeWidth={1.5} />
                <line x1={halfWidth * 0.6} y1={-6} x2={halfWidth * 0.6} y2={6} stroke="white" strokeWidth={1.5} />
              </>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderPreview = () => {
    if (!dragStart || !previewEnd) return null;
    
    if (activeTool === 'wall') {
      const length = Math.sqrt(
        Math.pow(previewEnd.x - dragStart.x, 2) + Math.pow(previewEnd.y - dragStart.y, 2)
      );
      const lengthM = (length / GRID_SIZE).toFixed(2);
      
      return (
        <g>
          <line
            x1={dragStart.x}
            y1={dragStart.y}
            x2={previewEnd.x}
            y2={previewEnd.y}
            stroke="#06b6d4"
            strokeWidth={WALL_THICKNESS}
            strokeLinecap="round"
            strokeDasharray="12,6"
            opacity={0.8}
          />
          <circle cx={dragStart.x} cy={dragStart.y} r={6} fill="#06b6d4" />
          <circle cx={previewEnd.x} cy={previewEnd.y} r={6} fill="#06b6d4" />
          <rect
            x={(dragStart.x + previewEnd.x) / 2 - 24}
            y={(dragStart.y + previewEnd.y) / 2 - 10}
            width={48}
            height={20}
            fill="white"
            stroke="#06b6d4"
            strokeWidth={1}
            rx={4}
          />
          <text
            x={(dragStart.x + previewEnd.x) / 2}
            y={(dragStart.y + previewEnd.y) / 2 + 4}
            textAnchor="middle"
            className="text-xs font-medium fill-cyan-600"
          >
            {lengthM}m
          </text>
        </g>
      );
    }
    
    if (activeTool === 'room') {
      const width = previewEnd.x - dragStart.x;
      const height = previewEnd.y - dragStart.y;
      const x = width > 0 ? dragStart.x : dragStart.x + width;
      const y = height > 0 ? dragStart.y : dragStart.y + height;
      const w = Math.abs(width);
      const h = Math.abs(height);
      
      return (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="#f1f5f9"
          stroke="#06b6d4"
          strokeWidth={2}
          strokeDasharray="8,4"
          opacity={0.7}
          rx={2}
        />
      );
    }
    
    return null;
  };

  const renderCursor = () => {
    const x = snapToGrid(mousePos.x);
    const y = snapToGrid(mousePos.y);
    
    return (
      <g className="cursor-indicator pointer-events-none">
        <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke="#06b6d4" strokeWidth={1} opacity={0.5} />
        <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke="#06b6d4" strokeWidth={1} opacity={0.5} />
      </g>
    );
  };

  return (
    <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
      <rect x={-2000} y={-2000} width={4000} height={4000} fill="#f8fafc" />
      {renderGrid()}
      {renderRooms()}
      {renderWalls()}
      {renderOpenings()}
      {renderPreview()}
      {activeTool === 'select' && renderCursor()}
    </g>
  );
};

export default FloorPlanCanvas;
