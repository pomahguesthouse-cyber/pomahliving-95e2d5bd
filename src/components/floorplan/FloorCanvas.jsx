import { useState, useRef, useCallback, useEffect } from 'react';
import useFloorPlanStore, { GRID_SIZE } from '@/features/floorplan/floorPlanStore';
import FloatingToolbar from './ui/FloatingToolbar';
import GridLayer from './canvas/GridLayer';
import RoomLayer from './canvas/RoomLayer';
import WallLayer from './canvas/WallLayer';
import OpeningLayer from './canvas/OpeningLayer';
import SelectionLayer from './canvas/SelectionLayer';

const FloorCanvas = () => {
  const svgRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [panStart, setPanStart] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [resizingId, setResizingId] = useState(null);
  const [resizingType, setResizingType] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);

  const {
    walls, rooms, doors, windows, openings, landBoundary, outdoorElements,
    selectedId, selectedType, activeTool, gridVisible, zoom, panOffset,
    uploadedImage, showText, showDimensions,
    setActiveTool, setSelected, addWall, addRoom, addDoor, addWindow,
    addOpening, setLandBoundary, addOutdoorElement, updateLandBoundary,
    moveItem, deleteItem, setZoom, setPanOffset, updateRoom,
  } = useFloorPlanStore();

  const snapToGrid = useCallback((value) => Math.round(value / GRID_SIZE) * GRID_SIZE, []);

  const getCanvasPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    };
  }, [zoom, panOffset]);

  const getScreenPoint = useCallback((canvasX, canvasY) => ({
    x: canvasX * zoom + panOffset.x,
    y: canvasY * zoom + panOffset.y,
  }), [zoom, panOffset]);

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setIsPanning(true);
      return;
    }

    const point = getCanvasPoint(e);

    if (['wall', 'land', 'room', 'garden', 'road', 'carport'].includes(activeTool)) {
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
        setResizingId(id);
        setResizingType(type);
        setResizeHandle(handle);
        setResizeStart({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
      } else if (id && type) {
        if (editingRoomId) {
          updateRoom(editingRoomId, { name: editingRoomName });
          setEditingRoomId(null);
        }
        setSelected(id, type);
        setDragStart({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
      } else {
        if (editingRoomId) {
          updateRoom(editingRoomId, { name: editingRoomName });
          setEditingRoomId(null);
        }
        setSelected(null, null);
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

    if (resizingId && resizeHandle && resizeStart) {
      const snappedX = snapToGrid(point.x);
      const snappedY = snapToGrid(point.y);
      const minSize = GRID_SIZE;

      if (resizingType === 'room' || resizingType === 'land-boundary') {
        const item = resizingType === 'room' 
          ? rooms.find((r) => r.id === resizingId)
          : landBoundary;
        if (!item) return;

        let newX = item.x, newY = item.y, newWidth = item.width, newHeight = item.height;

        if (resizeHandle === 'nw') {
          const dx = snappedX - resizeStart.x;
          const dy = snappedY - resizeStart.y;
          newWidth = Math.max(minSize, item.width - dx);
          newHeight = Math.max(minSize, item.height - dy);
          newX = item.x + item.width - newWidth;
          newY = item.y + item.height - newHeight;
        } else if (resizeHandle === 'ne') {
          const dy = snappedY - resizeStart.y;
          newWidth = Math.max(minSize, item.width + (snappedX - resizeStart.x));
          newY = item.y + item.height - Math.max(minSize, item.height - dy);
          newHeight = Math.max(minSize, item.height - dy);
        } else if (resizeHandle === 'sw') {
          const dx = snappedX - resizeStart.x;
          newWidth = Math.max(minSize, item.width - dx);
          newX = item.x + item.width - newWidth;
          newHeight = Math.max(minSize, item.height + (snappedY - resizeStart.y));
        } else if (resizeHandle === 'se') {
          newWidth = Math.max(minSize, item.width + (snappedX - resizeStart.x));
          newHeight = Math.max(minSize, item.height + (snappedY - resizeStart.y));
        } else if (resizeHandle === 'n') {
          newY = item.y + (snappedY - resizeStart.y);
          newHeight = Math.max(minSize, item.height - (snappedY - resizeStart.y));
        } else if (resizeHandle === 's') {
          newHeight = Math.max(minSize, item.height + (snappedY - resizeStart.y));
        } else if (resizeHandle === 'w') {
          newX = item.x + (snappedX - resizeStart.x);
          newWidth = Math.max(minSize, item.width - (snappedX - resizeStart.x));
        } else if (resizeHandle === 'e') {
          newWidth = Math.max(minSize, item.width + (snappedX - resizeStart.x));
        }

        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
        newWidth = snapToGrid(newWidth);
        newHeight = snapToGrid(newHeight);

        if (resizingType === 'room') {
          updateRoom(resizingId, { x: newX, y: newY, width: newWidth, height: newHeight });
        } else {
          updateLandBoundary({ x: newX, y: newY, width: newWidth, height: newHeight });
        }
        setResizeStart({ x: snappedX, y: snappedY });
        return;
      }
    }

    if (dragStart && selectedId) {
      const dx = snapToGrid(point.x) - snapToGrid(dragStart.x);
      const dy = snapToGrid(point.y) - snapToGrid(dragStart.y);
      if (dx !== 0 || dy !== 0) {
        moveItem(selectedId, selectedType, dx, dy);
        setDragStart({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
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

    if (resizingId) {
      useFloorPlanStore.getState()._pushHistory();
      setResizingId(null);
      setResizingType(null);
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

    if (dragStart && selectedId) {
      useFloorPlanStore.getState()._pushHistory();
    }
    setDragStart(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) useFloorPlanStore.getState().redo();
        else useFloorPlanStore.getState().undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) deleteItem(selectedId);
      }
      if (e.key === 'Escape') {
        setSelected(null, null);
        setEditingRoomId(null);
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

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'select') return 'default';
    return 'crosshair';
  };

  const getSelectedScreenPos = () => {
    if (!selectedId) return null;
    let cx = 0, cy = 0;

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
    } else {
      return null;
    }

    return getScreenPoint(cx, cy);
  };

  const floatingPos = getSelectedScreenPos();
  const selectedRoom = selectedType === 'room' ? rooms.find(r => r.id === selectedId) : null;

  const renderDrawingPreview = () => {
    if (!dragStart) return null;
    const point = mousePos;

    if (activeTool === 'wall') {
      return (
        <line
          x1={dragStart.x} y1={dragStart.y}
          x2={snapToGrid(point.x)} y2={snapToGrid(point.y)}
          stroke="#2563eb" strokeWidth={10}
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
        <GridLayer visible={gridVisible} />

        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
          <rect x={-3000} y={-3000} width={6000} height={6000} fill={gridVisible ? "url(#grid)" : 'none'} />

          {uploadedImage && (
            <image href={uploadedImage} x={0} y={0} width={800} height={600} opacity={0.3} preserveAspectRatio="xMidYMid meet" />
          )}

          <SelectionLayer
            landBoundary={landBoundary}
            outdoorElements={outdoorElements}
            selectedId={selectedId}
            showText={showText}
            showDimensions={showDimensions}
          />

          <RoomLayer
            rooms={rooms}
            selectedId={selectedId}
            editingRoomId={editingRoomId}
            editingRoomName={editingRoomName}
            showText={showText}
            showDimensions={showDimensions}
            onRoomClick={(id) => {
              if (editingRoomId) {
                updateRoom(editingRoomId, { name: editingRoomName });
                setEditingRoomId(null);
              }
              setSelected(id, 'room');
            }}
            onRoomDoubleClick={(id, name) => {
              setSelected(id, 'room');
              setDragStart(null);
            }}
            onNameDoubleClick={(id, name) => {
              setEditingRoomId(id);
              setEditingRoomName(name);
            }}
          />

          <WallLayer
            walls={walls}
            selectedId={selectedId}
            showDimensions={showDimensions}
            onWallClick={(id) => setSelected(id, 'wall')}
          />

          <OpeningLayer
            doors={doors}
            windows={windows}
            openings={openings}
            selectedId={selectedId}
            showDimensions={showDimensions}
            onDoorClick={(id) => setSelected(id, 'door')}
            onWindowClick={(id) => setSelected(id, 'window')}
          />

          {renderDrawingPreview()}
        </g>
      </svg>

      {selectedId && floatingPos && (
        <FloatingToolbar
          x={floatingPos.x}
          y={floatingPos.y - 50}
          selectedId={selectedId}
        />
      )}
    </div>
  );
};

export default FloorCanvas;
