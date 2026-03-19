import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { GRID_SIZE, METERS_PER_GRID, getPolygonArea, getCentroid, snapToGrid as snapPoint } from './geometryUtils';

const MAX_HISTORY = 50;

const createArea = (points, label = 'Area') => {
  const areaSize = getPolygonArea(points);
  const centroid = getCentroid(points);
  return {
    id: nanoid(),
    points,
    label,
    color: '#0ea5e9',
    fillColor: '#e0f2fe',
    areaSize,
    centroid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

const useAreaPlanStore = create((set, get) => ({
  areas: [],
  selectedAreaId: null,
  editingAreaId: null,
  hoveredAreaId: null,
  
  drawingPoints: [],
  isDrawing: false,
  previewPoint: null,
  
  snapToGrid: true,
  gridVisible: true,
  gridSize: GRID_SIZE,
  
  zoom: 1,
  panOffset: { x: 100, y: 100 },
  
  history: [],
  historyIndex: -1,

  _pushHistory: () => {
    const state = get();
    const snapshot = {
      areas: JSON.parse(JSON.stringify(state.areas)),
    };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    set({ 
      ...prev, 
      historyIndex: historyIndex - 1, 
      selectedAreaId: null, 
      editingAreaId: null,
      isDrawing: false,
      drawingPoints: [],
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set({ 
      ...next, 
      historyIndex: historyIndex + 1, 
      selectedAreaId: null, 
      editingAreaId: null,
      isDrawing: false,
      drawingPoints: [],
    });
  },

  startDrawing: () => {
    set({ isDrawing: true, drawingPoints: [], selectedAreaId: null, editingAreaId: null });
  },

  cancelDrawing: () => {
    set({ isDrawing: false, drawingPoints: [], previewPoint: null });
  },

  addPoint: (x, y) => {
    const { snapToGrid: shouldSnap, drawingPoints } = get();
    const point = shouldSnap ? snapPoint(x, y, GRID_SIZE) : { x, y };
    
    if (drawingPoints.length > 0) {
      const first = drawingPoints[0];
      const distance = Math.sqrt(
        Math.pow(point.x - first.x, 2) + Math.pow(point.y - first.y, 2)
      );
      
      if (distance <= GRID_SIZE && drawingPoints.length >= 3) {
        const newArea = createArea([...drawingPoints, first], 'Area');
        set((state) => ({
          areas: [...state.areas, newArea],
          isDrawing: false,
          drawingPoints: [],
          previewPoint: null,
          selectedAreaId: newArea.id,
        }));
        get()._pushHistory();
        return;
      }
    }
    
    set((state) => ({
      drawingPoints: [...state.drawingPoints, point],
    }));
  },

  updatePreviewPoint: (x, y) => {
    const { snapToGrid: shouldSnap, drawingPoints } = get();
    const point = shouldSnap ? snapPoint(x, y, GRID_SIZE) : { x, y };
    
    if (drawingPoints.length > 0) {
      const first = drawingPoints[0];
      const distance = Math.sqrt(
        Math.pow(point.x - first.x, 2) + Math.pow(point.y - first.y, 2)
      );
      
      if (distance <= GRID_SIZE && drawingPoints.length >= 3) {
        set({ previewPoint: { ...first, isClosing: true } });
        return;
      }
    }
    
    set({ previewPoint: point });
  },

  finishDrawing: () => {
    const { drawingPoints } = get();
    if (drawingPoints.length < 3) {
      set({ isDrawing: false, drawingPoints: [], previewPoint: null });
      return;
    }

    const newArea = createArea(drawingPoints, 'Area');
    set((state) => ({
      areas: [...state.areas, newArea],
      isDrawing: false,
      drawingPoints: [],
      previewPoint: null,
      selectedAreaId: newArea.id,
    }));
    get()._pushHistory();
  },

  selectArea: (id) => {
    set({ selectedAreaId: id, editingAreaId: null });
  },

  deselectArea: () => {
    set({ selectedAreaId: null, editingAreaId: null });
  },

  startEditingArea: (id) => {
    set({ editingAreaId: id, selectedAreaId: id });
  },

  stopEditingArea: () => {
    set({ editingAreaId: null });
  },

  setHoveredArea: (id) => {
    set({ hoveredAreaId: id });
  },

  updateAreaLabel: (id, label) => {
    set((state) => ({
      areas: state.areas.map((area) =>
        area.id === id ? { ...area, label, updatedAt: Date.now() } : area
      ),
    }));
    get()._pushHistory();
  },

  updateAreaColor: (id, fillColor, strokeColor) => {
    set((state) => ({
      areas: state.areas.map((area) =>
        area.id === id ? { ...area, fillColor, color: strokeColor, updatedAt: Date.now() } : area
      ),
    }));
    get()._pushHistory();
  },

  updateAreaPoint: (areaId, pointIndex, newPoint) => {
    const { snapToGrid: shouldSnap } = get();
    const point = shouldSnap ? snapPoint(newPoint.x, newPoint.y, GRID_SIZE) : newPoint;
    
    set((state) => ({
      areas: state.areas.map((area) => {
        if (area.id !== areaId) return area;
        const newPoints = [...area.points];
        newPoints[pointIndex] = point;
        const areaSize = getPolygonArea(newPoints);
        const centroid = getCentroid(newPoints);
        return { ...area, points: newPoints, areaSize, centroid, updatedAt: Date.now() };
      }),
    }));
  },

  addAreaPoint: (areaId, afterIndex) => {
    const { areas, snapToGrid: shouldSnap } = get();
    const area = areas.find((a) => a.id === areaId);
    if (!area) return;

    const newPoints = [...area.points];
    const p1 = area.points[afterIndex];
    const p2 = area.points[(afterIndex + 1) % area.points.length];
    
    let midPoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
    
    if (shouldSnap) {
      midPoint = snapPoint(midPoint.x, midPoint.y, GRID_SIZE);
    }
    
    newPoints.splice(afterIndex + 1, 0, midPoint);
    
    const areaSize = getPolygonArea(newPoints);
    const centroid = getCentroid(newPoints);
    
    set((state) => ({
      areas: state.areas.map((a) =>
        a.id === areaId
          ? { ...a, points: newPoints, areaSize, centroid, updatedAt: Date.now() }
          : a
      ),
    }));
    get()._pushHistory();
  },

  removeAreaPoint: (areaId, pointIndex) => {
    const { areas } = get();
    const area = areas.find((a) => a.id === areaId);
    if (!area || area.points.length <= 3) return;

    const newPoints = area.points.filter((_, i) => i !== pointIndex);
    const areaSize = getPolygonArea(newPoints);
    const centroid = getCentroid(newPoints);

    set((state) => ({
      areas: state.areas.map((a) =>
        a.id === areaId
          ? { ...a, points: newPoints, areaSize, centroid, updatedAt: Date.now() }
          : a
      ),
    }));
    get()._pushHistory();
  },

  deleteArea: (id) => {
    set((state) => ({
      areas: state.areas.filter((area) => area.id !== id),
      selectedAreaId: state.selectedAreaId === id ? null : state.selectedAreaId,
      editingAreaId: state.editingAreaId === id ? null : state.editingAreaId,
    }));
    get()._pushHistory();
  },

  duplicateArea: (id) => {
    const { areas } = get();
    const area = areas.find((a) => a.id === id);
    if (!area) return;

    const offset = GRID_SIZE * 2;
    const newPoints = area.points.map((p) => ({ x: p.x + offset, y: p.y + offset }));
    const newArea = createArea(newPoints, `${area.label} (Copy)`);
    
    set((state) => ({
      areas: [...state.areas, newArea],
      selectedAreaId: newArea.id,
    }));
    get()._pushHistory();
  },

  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  setGridSize: (size) => set({ gridSize: size }),

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  exportJSON: () => {
    const { areas } = get();
    return JSON.stringify({ areas }, null, 2);
  },

  importJSON: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.areas && Array.isArray(data.areas)) {
        set({ areas: data.areas, selectedAreaId: null, editingAreaId: null });
        get()._pushHistory();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  clearAll: () => {
    set({
      areas: [],
      selectedAreaId: null,
      editingAreaId: null,
      isDrawing: false,
      drawingPoints: [],
      previewPoint: null,
    });
    get()._pushHistory();
  },
}));

export default useAreaPlanStore;
export { GRID_SIZE, METERS_PER_GRID };
