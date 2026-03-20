import { useState, useRef, useCallback, useEffect } from 'react';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';
import FloatingToolbar from './ui/FloatingToolbar';
import GridLayer from './canvas/GridLayer';
import FilledAreaLayer from './canvas/FilledAreaLayer';
import RoomLayer from './canvas/RoomLayer';
import AreaLayer from './canvas/AreaLayer';
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
  const [wallPointDragIndex, setWallPointDragIndex] = useState(null);

  const {
    walls, rooms, doors, windows, openings, landBoundary, outdoorElements, filledAreas,
    selectedId, selectedType, activeTool, gridVisible, zoom, panOffset,
    uploadedImage, showText, showDimensions, showLandDimensions,
    snapEnabled, gridSize,
    setGridVisible, setSnapEnabled,
    setActiveTool, setSelected, addRoom, addDoor, addWindow,
    addOpening, setLandBoundary, addOutdoorElement, updateLandBoundary,
    moveItem, deleteItem, setZoom, setPanOffset, updateRoom, updateWallLength,
    isDrawingWall, currentWallPoints, previewWallPoints,
    startWallDrawing, addWallPoint, updateWallPoint, updateWallPreview, finishWallDrawing, cancelWallDrawing,
  } = useFloorPlanStore();

  const snapToGrid = useCallback((value) => {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapEnabled, gridSize]);

  const constrainWallPoint = useCallback((x, y, lockAxis = false) => {
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    if (!lockAxis || !currentWallPoints || currentWallPoints.length === 0) {
      return { x: snappedX, y: snappedY };
    }

    const last = currentWallPoints[currentWallPoints.length - 1];
    const dx = Math.abs(snappedX - last.x);
    const dy = Math.abs(snappedY - last.y);

    if (dx >= dy) {
      return { x: snappedX, y: last.y };
    }

    return { x: last.x, y: snappedY };
  }, [snapToGrid, currentWallPoints]);

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

  const cancelCurrentAction = useCallback(() => {
    setDragStart(null);
    setResizingId(null);
    setResizingType(null);
    setResizeHandle(null);
    setResizeStart(null);
    setWallPointDragIndex(null);
    setEditingRoomId(null);
    if (isDrawingWall) {
      cancelWallDrawing();
    } else {
      setSelected(null, null);
      setActiveTool('select');
    }
  }, [setSelected, setActiveTool, isDrawingWall, cancelWallDrawing]);

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setIsPanning(true);
      return;
    }

    const point = getCanvasPoint(e);

    // Freehand wall drawing
    if (activeTool === 'wall') {
      const constrained = constrainWallPoint(point.x, point.y, e.shiftKey);
      const snappedX = constrained.x;
      const snappedY = constrained.y;
      const isDoubleClick = e.detail === 2;

      if (isDrawingWall) {
        const pointIndexAttr = e.target.getAttribute('data-wall-point-index');
        if (pointIndexAttr != null) {
          setWallPointDragIndex(Number(pointIndexAttr));
          return;
        }

        // Prevent adding a point when the second click of a double-click occurs;
        // the double-click handler will either insert a vertex or finish drawing.
        if (isDoubleClick) {
          return;
        }

        // Close only when user clicks near the first point; otherwise keep adding vertices.
        if (currentWallPoints && currentWallPoints.length >= 3) {
          const first = currentWallPoints[0];
          const closeThreshold = Math.max(gridSize, 12);
          const distToFirst = Math.hypot(snappedX - first.x, snappedY - first.y);

          if (distToFirst <= closeThreshold) {
            const newAreaId = finishWallDrawing({ forceClose: true });
            if (newAreaId) setSelected(newAreaId, 'area');
            return;
          }
        }

        addWallPoint(snappedX, snappedY);
        return;
      }

      startWallDrawing(snappedX, snappedY);
      return;
    }

    if (['land', 'room', 'garden', 'road', 'carport'].includes(activeTool)) {
      setDragStart({ x: snapToGrid(point.x), y: snapToGrid(point.y) });
      return;
    }
    
    if (activeTool === 'door') {
      const id = addDoor(point.x, point.y);
      setSelected(id, 'door');
      setActiveTool('select');
      return;
    }
    
    if (activeTool === 'window') {
      const id = addWindow(point.x, point.y);
      setSelected(id, 'window');
      setActiveTool('select');
      return;
    }
    
    if (activeTool === 'opening') {
      const id = addOpening(point.x, point.y);
      setSelected(id, 'opening');
      setActiveTool('select');
      return;
    }
    
    if (activeTool === 'select') {
      const target = e.target;
      const id = target.getAttribute('data-id');
      const type = target.getAttribute('data-type');
      const handle = target.getAttribute('data-handle');

      if (handle && id) {
        e.stopPropagation();
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

    if (wallPointDragIndex !== null) {
      const snappedX = snapToGrid(point.x);
      const snappedY = snapToGrid(point.y);
      updateWallPoint(wallPointDragIndex, snappedX, snappedY);
      return;
    }

    // Update wall preview
    if (activeTool === 'wall' && isDrawingWall) {
      const constrained = constrainWallPoint(point.x, point.y, e.shiftKey);
      updateWallPreview(constrained.x, constrained.y);
      return;
    }

    if (resizingId && resizeHandle && resizeStart) {
      const snappedX = snapToGrid(point.x);
      const snappedY = snapToGrid(point.y);
      const minSize = gridSize;

      if (resizingType === 'room' || resizingType === 'land-boundary' || resizingType === 'area' || resizingType === 'outdoor') {
        let item;
        if (resizingType === 'room') item = rooms.find((r) => r.id === resizingId);
        else if (resizingType === 'land-boundary') item = landBoundary;
        else if (resizingType === 'area') item = filledAreas.find((a) => a.id === resizingId);
        else item = outdoorElements.find((o) => o.id === resizingId);
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
          updateRoom(resizingId, { x: newX, y: newY, width: newWidth, height: newHeight }, false);
        } else if (resizingType === 'land-boundary') {
          updateLandBoundary({ x: newX, y: newY, width: newWidth, height: newHeight }, false);
        } else if (resizingType === 'area') {
          useFloorPlanStore.getState().updateFilledArea(resizingId, { x: newX, y: newY, width: newWidth, height: newHeight }, false);
        } else {
          // outdoor (carport, garden, road)
          useFloorPlanStore.getState().updateOutdoorElement(resizingId, { x: newX, y: newY, width: newWidth, height: newHeight }, false);
        }
        setResizeStart({ x: snappedX, y: snappedY });
      }
      return;
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

    if (wallPointDragIndex !== null) {
      setWallPointDragIndex(null);
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

    if (activeTool === 'room' && dragStart) {
      const width = snapToGrid(point.x) - dragStart.x;
      const height = snapToGrid(point.y) - dragStart.y;
      if (Math.abs(width) > gridSize && Math.abs(height) > gridSize) {
        const x = width > 0 ? dragStart.x : dragStart.x + width;
        const y = height > 0 ? dragStart.y : dragStart.y + height;
        const id = addRoom(x, y, Math.abs(width), Math.abs(height));
        setSelected(id, 'room');
      }
      setActiveTool('select');
      setDragStart(null);
      return;
    }
    
    if (activeTool === 'land' && dragStart) {
      const width = snapToGrid(point.x) - dragStart.x;
      const height = snapToGrid(point.y) - dragStart.y;
      if (Math.abs(width) > gridSize && Math.abs(height) > gridSize) {
        const x = width > 0 ? dragStart.x : dragStart.x + width;
        const y = height > 0 ? dragStart.y : dragStart.y + height;
        setLandBoundary(x, y, Math.abs(width), Math.abs(height));
      }
      setActiveTool('select');
      setDragStart(null);
      return;
    }
    
    if (['garden', 'road', 'carport'].includes(activeTool) && dragStart) {
      const width = snapToGrid(point.x) - dragStart.x;
      const height = snapToGrid(point.y) - dragStart.y;
      if (Math.abs(width) > gridSize && Math.abs(height) > gridSize) {
        const x = width > 0 ? dragStart.x : dragStart.x + width;
        const y = height > 0 ? dragStart.y : dragStart.y + height;
        const typeMap = { garden: 'garden', road: 'road', carport: 'carport' };
        const id = addOutdoorElement(typeMap[activeTool], x, y, Math.abs(width), Math.abs(height));
        setSelected(id, 'outdoor');
      }
      setActiveTool('select');
      setDragStart(null);
      return;
    }

    if (dragStart && selectedId) {
      useFloorPlanStore.getState()._pushHistory();
    }
    setDragStart(null);
  };

  const handleDoubleClick = () => {
    if (activeTool !== 'wall' || !isDrawingWall || wallPointDragIndex !== null) return;

    try {
      const shouldForceClose = currentWallPoints && currentWallPoints.length >= 3;
      const newAreaId = finishWallDrawing({ forceClose: shouldForceClose });
      if (newAreaId) setSelected(newAreaId, 'area');
    } catch (error) {
      console.error('Error finishing wall drawing (double click):', error);
      setActiveTool('select');
    }
  };

  const handleContextMenu = (e) => {
    if (activeTool !== 'wall') return;

    e.preventDefault();
    if (!isDrawingWall) return;

    const shouldForceClose = currentWallPoints && currentWallPoints.length >= 3;
    const newAreaId = finishWallDrawing({ forceClose: shouldForceClose });
    if (newAreaId) setSelected(newAreaId, 'area');
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
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        useFloorPlanStore.getState().redo();
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelCurrentAction();
        return;
      }
      
      if (e.key === 'Enter') {
        if (isDrawingWall) {
          e.preventDefault();
          const shouldForceClose = currentWallPoints && currentWallPoints.length >= 3;
          const newAreaId = finishWallDrawing({ forceClose: shouldForceClose });
          if (newAreaId) setSelected(newAreaId, 'area');
          return;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) deleteItem(selectedId);
        return;
      }
      
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'q' || e.key === 'Q') setActiveTool('room');
      if (e.key === 'r' || e.key === 'R') setActiveTool('room');
      if (e.key === 'w' || e.key === 'W') setActiveTool('wall');
      if (e.key === 'd' || e.key === 'D') setActiveTool('door');
      if (e.key === 'n' || e.key === 'N') setActiveTool('window');
      if (e.key === 'o' || e.key === 'O') setActiveTool('opening');
      if (e.key === 'g' || e.key === 'G') setGridVisible(!gridVisible);
      if (e.key === 's' || e.key === 'S') setSnapEnabled(!snapEnabled);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteItem, setSelected, setActiveTool, cancelCurrentAction, isDrawingWall, finishWallDrawing, currentWallPoints, setGridVisible, gridVisible, setSnapEnabled, snapEnabled]);

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'select') return 'default';
    if (activeTool === 'wall') return 'crosshair';
    return 'crosshair';
  };

  const getPolygonCentroid = (points) => {
    if (!points || points.length === 0) return { x: 0, y: 0 };
    const n = points.length;
    let area = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < n; i += 1) {
      const { x: x0, y: y0 } = points[i];
      const { x: x1, y: y1 } = points[(i + 1) % n];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }

    area *= 0.5;
    if (area === 0) {
      const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      return { x: sum.x / n, y: sum.y / n };
    }

    return {
      x: cx / (6 * area),
      y: cy / (6 * area),
    };
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
    } else if (selectedType === 'area') {
      const area = filledAreas.find((a) => a.id === selectedId);
      if (!area) return null;
      const centroid = getPolygonCentroid(area.points);
      cx = centroid.x;
      cy = centroid.y;
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

  const renderDrawingPreview = () => {
    if (!dragStart) return null;
    const point = mousePos;

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
        data-floorplan-canvas="true"
        className="w-full h-full"
        style={{ background: '#f8fafc', cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <GridLayer visible={gridVisible} />

        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
          <rect x={-3000} y={-3000} width={6000} height={6000} fill={gridVisible ? "url(#grid)" : 'none'} />

          {uploadedImage && (
            <image href={uploadedImage} x={0} y={0} width={800} height={600} opacity={0.3} preserveAspectRatio="xMidYMid meet" />
          )}

          <FilledAreaLayer
            areas={filledAreas}
            selectedId={selectedId}
            onAreaClick={(id) => setSelected(id, 'area')}
            showText={showText}
            showDimensions={showDimensions}
          />

          <SelectionLayer
            landBoundary={landBoundary}
            outdoorElements={outdoorElements}
            selectedId={selectedId}
            showText={showText}
            showDimensions={showDimensions}
            showLandDimensions={showLandDimensions}
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
            onEditingRoomNameChange={setEditingRoomName}
            onRoomUpdate={(id, updates) => {
              updateRoom(id, updates);
            }}
          />

          <AreaLayer
            walls={walls}
            areas={filledAreas}
            selectedId={selectedId}
            onWallClick={(id) => setSelected(id, 'wall')}
            wallDrawingPoints={currentWallPoints}
            wallPreviewEnd={previewWallPoints.length > 0 ? previewWallPoints[previewWallPoints.length - 1] : null}
            isDrawingWall={isDrawingWall}
          />

          <OpeningLayer
            doors={doors}
            windows={windows}
            openings={openings}
            selectedId={selectedId}
            showDimensions={showDimensions}
            onDoorClick={(id) => setSelected(id, 'door')}
            onWindowClick={(id) => setSelected(id, 'window')}
            onOpeningClick={(id) => setSelected(id, 'opening')}
          />

          {renderDrawingPreview()}
        </g>
      </svg>

      {selectedId && floatingPos && (
        <FloatingToolbar
          x={floatingPos.x}
          y={floatingPos.y - 50}
          selectedId={selectedId}
          selectedType={selectedType}
        />
      )}
    </div>
  );
};

export default FloorCanvas;
