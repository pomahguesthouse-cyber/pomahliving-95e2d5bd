import { useState, useRef, useCallback, useEffect } from 'react';
import useFloorPlanStore, { METERS_PER_GRID } from '@/features/floorplan/floorPlanStore';
import { getLineAngleDeg } from '@/features/floorplan/lineGeometry';
import { getSnappedPoint } from '@/features/floorplan/snapEngine';
import { applyAngleConstraint, stabilizePoint } from '@/features/floorplan/constraintEngine';
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
  const [wallHandleDrag, setWallHandleDrag] = useState(null);
  const [hoveredWallId, setHoveredWallId] = useState(null);
  const [snapIndicator, setSnapIndicator] = useState(null);
  const [angleLabel, setAngleLabel] = useState(null);
  const [previewLengthLabel, setPreviewLengthLabel] = useState(null);
  const pointerFrameRef = useRef(null);
  const pendingPointerRef = useRef(null);
  const stickySnapRef = useRef(null);
  const previewPointRef = useRef(null);

  const {
    walls, rooms, doors, windows, openings, landBoundary, outdoorElements, filledAreas,
    selectedId, selectedType, activeTool, gridVisible, zoom, panOffset,
    uploadedImage, showText, showDimensions, showLandDimensions,
    snapEnabled, snapStrength, snapMask, gridSize,
    setGridVisible, setSnapEnabled,
    setActiveTool, setSelected, addRoom, addDoor, addWindow,
    addOpening, setLandBoundary, addOutdoorElement, updateLandBoundary,
    moveItem, deleteItem, setZoom, setPanOffset, updateRoom, updateWall, updateWallLength,
    isDrawingWall, currentWallPoints, previewWallPoints,
    startWallDrawing, addWallPoint, updateWallPoint, updateWallPreview, finishWallDrawing, cancelWallDrawing, stepBackWallDrawing,
  } = useFloorPlanStore();

  const snapToGrid = useCallback((value) => {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapEnabled, gridSize]);

  const getAssistedPoint = useCallback((rawPoint, options = {}) => {
    const {
      basePoint = null,
      currentPoints = [],
      lockAngle = false,
    } = options;

    const constrained = applyAngleConstraint({
      basePoint,
      rawPoint,
      shiftLock: lockAngle,
      autoOrthoThreshold: gridSize * 0.35,
    });

    const snapped = getSnappedPoint({
      point: constrained.point,
      gridSize,
      snapEnabled,
      walls,
      areas: filledAreas,
      currentPoints,
      zoom,
      snapStrength,
      snapMask,
      stickyTarget: stickySnapRef.current,
    });

    stickySnapRef.current = snapped.activeTarget;

    const stablePoint = stabilizePoint(previewPointRef.current, snapped.point);
    previewPointRef.current = stablePoint;

    const computedAngle = basePoint
      ? getLineAngleDeg({ x1: basePoint.x, y1: basePoint.y, x2: stablePoint.x, y2: stablePoint.y })
      : constrained.angleDeg;

    return {
      point: stablePoint,
      indicator: snapped.indicator,
      angleDeg: computedAngle,
      constraintMode: constrained.mode,
    };
  }, [filledAreas, gridSize, snapEnabled, snapMask, snapStrength, walls, zoom]);

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
    setWallHandleDrag(null);
    setEditingRoomId(null);
    setSnapIndicator(null);
    setAngleLabel(null);
    setPreviewLengthLabel(null);
    stickySnapRef.current = null;
    previewPointRef.current = null;
    if (isDrawingWall) {
      cancelWallDrawing();
    } else {
      setSelected(null, null);
      setActiveTool('select');
    }
  }, [setSelected, setActiveTool, isDrawingWall, cancelWallDrawing]);

  const flushPointerFrame = useCallback(() => {
    pointerFrameRef.current = null;
    const payload = pendingPointerRef.current;
    if (!payload) return;

    const { point, shiftKey } = payload;

    if (wallHandleDrag) {
      const wall = walls.find((item) => item.id === wallHandleDrag.wallId);
      if (!wall) return;

      const assisted = getAssistedPoint(point, {
        basePoint: wallHandleDrag.handle === 'start' ? { x: wall.x2, y: wall.y2 } : { x: wall.x1, y: wall.y1 },
        currentPoints: [],
        lockAngle: shiftKey,
      });

      setSnapIndicator(assisted.indicator);
      setAngleLabel(assisted.angleDeg != null ? `${Math.round(assisted.angleDeg)}°` : null);
      setPreviewLengthLabel(null);

      updateWall(
        wall.id,
        wallHandleDrag.handle === 'start'
          ? { x1: assisted.point.x, y1: assisted.point.y }
          : { x2: assisted.point.x, y2: assisted.point.y },
        false
      );
      return;
    }

    if (wallPointDragIndex !== null) {
      const previousPoint = currentWallPoints[wallPointDragIndex - 1] || null;
      const assisted = getAssistedPoint(point, {
        basePoint: previousPoint,
        currentPoints: currentWallPoints,
        lockAngle: shiftKey,
      });
      setSnapIndicator(assisted.indicator);
      setAngleLabel(assisted.angleDeg != null ? `${Math.round(assisted.angleDeg)}°` : null);
      setPreviewLengthLabel(null);
      updateWallPoint(wallPointDragIndex, assisted.point.x, assisted.point.y);
      return;
    }

    if (activeTool === 'wall' && isDrawingWall) {
      const basePoint = currentWallPoints.length > 0 ? currentWallPoints[currentWallPoints.length - 1] : null;
      const assisted = getAssistedPoint(point, {
        basePoint,
        currentPoints: currentWallPoints,
        lockAngle: shiftKey,
      });
      setSnapIndicator(assisted.indicator);
      setAngleLabel(assisted.angleDeg != null ? `${Math.round(assisted.angleDeg)}°` : null);
      if (basePoint) {
        const lengthMeters = Math.hypot(assisted.point.x - basePoint.x, assisted.point.y - basePoint.y) / gridSize * METERS_PER_GRID;
        setPreviewLengthLabel(`${lengthMeters.toFixed(2)}m`);
      } else {
        setPreviewLengthLabel(null);
      }
      updateWallPreview(assisted.point.x, assisted.point.y);
      return;
    }

    stickySnapRef.current = null;
    previewPointRef.current = null;
    setSnapIndicator(null);
    setAngleLabel(null);
    setPreviewLengthLabel(null);
  }, [activeTool, currentWallPoints, getAssistedPoint, isDrawingWall, updateWall, updateWallPoint, updateWallPreview, wallHandleDrag, wallPointDragIndex, walls]);

  const schedulePointerFrame = useCallback(() => {
    if (pointerFrameRef.current !== null) return;
    pointerFrameRef.current = window.requestAnimationFrame(flushPointerFrame);
  }, [flushPointerFrame]);

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setIsPanning(true);
      return;
    }

    const point = getCanvasPoint(e);

    // Freehand wall drawing
    if (activeTool === 'wall') {
      const basePoint = currentWallPoints.length > 0 ? currentWallPoints[currentWallPoints.length - 1] : null;
      const assisted = getAssistedPoint(point, {
        basePoint,
        currentPoints: currentWallPoints,
        lockAngle: e.shiftKey,
      });
      const snappedX = assisted.point.x;
      const snappedY = assisted.point.y;
      const isDoubleClick = e.detail === 2;

      setSnapIndicator(assisted.indicator);
      setAngleLabel(assisted.angleDeg != null ? `${Math.round(assisted.angleDeg)}°` : null);
      setPreviewLengthLabel(null);

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
            setPreviewLengthLabel(null);
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
      const wallHandle = target.getAttribute('data-wall-handle');

      if (wallHandle && id) {
        setSelected(id, 'wall');
        setWallHandleDrag({ wallId: id, handle: wallHandle });
        return;
      }

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

    const hoverType = e.target.getAttribute?.('data-type');
    const hoverId = hoverType === 'wall' ? e.target.getAttribute('data-id') : null;
    setHoveredWallId(hoverId);

    if (isPanning && panStart) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (wallHandleDrag || wallPointDragIndex !== null || (activeTool === 'wall' && isDrawingWall)) {
      pendingPointerRef.current = { point, shiftKey: e.shiftKey };
      schedulePointerFrame();
      return;
    }

    setSnapIndicator(null);
    setAngleLabel(null);
    stickySnapRef.current = null;
    previewPointRef.current = null;

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
      setSnapIndicator(null);
      setAngleLabel(null);
      useFloorPlanStore.getState()._pushHistory();
      return;
    }

    if (wallHandleDrag) {
      setWallHandleDrag(null);
      setSnapIndicator(null);
      setAngleLabel(null);
      useFloorPlanStore.getState()._pushHistory();
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
      setSnapIndicator(null);
      setAngleLabel(null);
      setPreviewLengthLabel(null);
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
    setSnapIndicator(null);
    setAngleLabel(null);
    setPreviewLengthLabel(null);
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
        if (isDrawingWall) {
          stepBackWallDrawing();
          stickySnapRef.current = null;
          previewPointRef.current = null;
          setSnapIndicator(null);
          setAngleLabel(null);
          setPreviewLengthLabel(null);
        } else {
          cancelCurrentAction();
        }
        return;
      }
      
      if (e.key === 'Enter') {
        if (isDrawingWall) {
          e.preventDefault();
          const shouldForceClose = currentWallPoints && currentWallPoints.length >= 3;
          const newAreaId = finishWallDrawing({ forceClose: shouldForceClose });
          setSnapIndicator(null);
          setAngleLabel(null);
          setPreviewLengthLabel(null);
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
  }, [selectedId, deleteItem, setSelected, setActiveTool, cancelCurrentAction, isDrawingWall, finishWallDrawing, currentWallPoints, setGridVisible, gridVisible, setSnapEnabled, snapEnabled, stepBackWallDrawing]);

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'select') return 'default';
    if (activeTool === 'wall') return 'none';
    return 'crosshair';
  };

  const getWallCursor = () => {
    const screenPos = getScreenPoint(mousePos.x, mousePos.y);
    let angleDeg = 35;

    if (isDrawingWall && currentWallPoints.length > 0 && previewWallPoints.length > 0) {
      const lastPoint = currentWallPoints[currentWallPoints.length - 1];
      const previewEnd = previewWallPoints[previewWallPoints.length - 1];
      const dx = previewEnd.x - lastPoint.x;
      const dy = previewEnd.y - lastPoint.y;
      if (dx !== 0 || dy !== 0) {
        angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
      }
    }

    return { x: screenPos.x, y: screenPos.y, angleDeg };
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
  const wallCursor = activeTool === 'wall' ? getWallCursor() : null;

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
        onMouseLeave={(event) => {
          setHoveredWallId(null);
          setSnapIndicator(null);
          setAngleLabel(null);
          setPreviewLengthLabel(null);
          handleMouseUp(event);
        }}
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
            hoveredWallId={hoveredWallId}
            showDimensions={showDimensions}
            onWallClick={(id) => setSelected(id, 'wall')}
            onDimensionEdit={(id, value) => updateWallLength(id, value)}
            wallDrawingPoints={currentWallPoints}
            wallPreviewEnd={previewWallPoints.length > 0 ? previewWallPoints[previewWallPoints.length - 1] : null}
            isDrawingWall={isDrawingWall}
            snapIndicator={snapIndicator}
            angleLabel={angleLabel}
            previewLengthLabel={previewLengthLabel}
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

      {wallCursor && (
        <div
          className="absolute pointer-events-none z-40"
          style={{
            left: wallCursor.x,
            top: wallCursor.y,
            transform: `translate(-2px, -10px) rotate(${wallCursor.angleDeg}deg)`,
            transformOrigin: '2px 10px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <line x1="4" y1="20" x2="17" y2="7" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
            <line x1="4" y1="20" x2="17" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            <line x1="2.6" y1="21.4" x2="5.4" y2="18.6" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      )}

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
