import { useState, useRef, useCallback, useEffect } from 'react';
import useAreaPlanStore from '@/features/areaPlan/areaPlanStore';
import { GRID_SIZE } from '@/features/areaPlan/geometryUtils';
import GridLayer from './GridLayer';
import AreaLayer from './AreaLayer';
import DrawingPreviewLayer from './DrawingPreviewLayer';

const AreaPlanCanvas = () => {
  const svgRef = useRef(null);
  const [panStart, setPanStart] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [pointDragStart, setPointDragStart] = useState(null);
  
  const {
    areas,
    selectedAreaId,
    editingAreaId,
    hoveredAreaId,
    drawingPoints,
    isDrawing,
    previewPoint,
    snapToGrid,
    gridVisible,
    zoom,
    panOffset,
    startDrawing,
    cancelDrawing,
    addPoint,
    updatePreviewPoint,
    finishDrawing,
    selectArea,
    deselectArea,
    setHoveredArea,
    updateAreaPoint,
    updateAreaLabel,
    setZoom,
    setPanOffset,
    undo,
    redo,
    deleteArea,
    _pushHistory,
  } = useAreaPlanStore();
  
  const getCanvasPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    };
  }, [zoom, panOffset]);
  
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setIsPanning(true);
      return;
    }
    
    const point = getCanvasPoint(e);
    
    if (isDrawing) {
      addPoint(point.x, point.y);
      return;
    }
    
    const target = e.target;
    const isAreaClick = target.tagName === 'polygon' || target.closest('[data-area-id]');
    
    if (!isAreaClick) {
      deselectArea();
    }
  }, [isDrawing, getCanvasPoint, addPoint, deselectArea, panOffset]);
  
  const handleMouseMove = useCallback((e) => {
    if (isPanning && panStart) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    
    if (isDrawing) {
      const point = getCanvasPoint(e);
      updatePreviewPoint(point.x, point.y);
    }
  }, [isPanning, panStart, isDrawing, getCanvasPoint, updatePreviewPoint, setPanOffset]);
  
  const handleMouseUp = useCallback((e) => {
    if (isPanning) {
      setPanStart(null);
      setIsPanning(false);
    }
  }, [isPanning]);
  
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);
  
  const handlePointDrag = useCallback((areaId, pointIndex, newPoint) => {
    updateAreaPoint(areaId, pointIndex, newPoint);
  }, [updateAreaPoint]);
  
  const handlePointDragEnd = useCallback(() => {
    _pushHistory();
  }, [_pushHistory]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isDrawing) {
          cancelDrawing();
        } else {
          deselectArea();
        }
        return;
      }
      
      if (e.key === 'Enter' && isDrawing) {
        e.preventDefault();
        finishDrawing();
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAreaId) {
          e.preventDefault();
          deleteArea(selectedAreaId);
        }
        return;
      }
      
      if (e.key === 'd' || e.key === 'D') {
        if (selectedAreaId && e.ctrlKey) {
          e.preventDefault();
          useAreaPlanStore.getState().duplicateArea(selectedAreaId);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, selectedAreaId, undo, redo, cancelDrawing, deselectArea, finishDrawing, deleteArea]);
  
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (isDrawing) return 'crosshair';
    if (hoveredAreaId) return 'move';
    return 'default';
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
        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
          <rect x={-3000} y={-3000} width={6000} height={6000} fill="transparent" />
          
          <GridLayer visible={gridVisible} />
          
          <AreaLayer
            areas={areas}
            selectedAreaId={selectedAreaId}
            hoveredAreaId={hoveredAreaId}
            editingAreaId={editingAreaId}
            onSelect={selectArea}
            onHover={setHoveredArea}
            onPointDrag={handlePointDrag}
            onPointDragEnd={handlePointDragEnd}
            onLabelEdit={updateAreaLabel}
          />
          
          <DrawingPreviewLayer
            drawingPoints={drawingPoints}
            previewPoint={previewPoint}
            isDrawing={isDrawing}
          />
        </g>
      </svg>
      
      {isDrawing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          <span className="mr-2">Click to add points</span>
          <span className="mx-2 text-blue-200">|</span>
          <span className="mr-2">Enter to finish</span>
          <span className="mx-2 text-blue-200">|</span>
          <span>Esc to cancel</span>
        </div>
      )}
    </div>
  );
};

export default AreaPlanCanvas;
