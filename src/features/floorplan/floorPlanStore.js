import { create } from 'zustand';
import { nanoid } from 'nanoid';

const GRID_SIZE = 20;
// Each grid cell represents this many meters.
// Small grid = 0.5m, large grid = 1m.
const METERS_PER_GRID = 0.5;
const WALL_THICKNESS = 10;
const WALL_HEIGHT = 280;
const MAX_HISTORY = 50;

const getBoundingBox = (points) => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

const useFloorPlanStore = create((set, get) => ({
  walls: [],
  rooms: [],
  doors: [],
  windows: [],
  openings: [],
  landBoundary: null,
  outdoorElements: [],
  filledAreas: [],
  selectedId: null,
  selectedType: null,
  activeTool: 'select',
  gridVisible: true,
  snapEnabled: true,
  gridSize: GRID_SIZE,
  gridSizeOptions: [2, 4, 20],
  showText: true,
  showDimensions: true,
  showLandDimensions: true,
  zoom: 1,
  panOffset: { x: 100, y: 100 },
  uploadedImage: null,
  history: [],
  historyIndex: -1,
  snap: (value) => {
    const { snapEnabled, gridSize } = get();
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  },
  
  // Freehand wall drawing state
  isDrawingWall: false,
  currentWallPoints: [],
  previewWallPoints: [],

  _pushHistory: () => {
    const state = get();
    const snapshot = {
      walls: JSON.parse(JSON.stringify(state.walls)),
      rooms: JSON.parse(JSON.stringify(state.rooms)),
      doors: JSON.parse(JSON.stringify(state.doors)),
      windows: JSON.parse(JSON.stringify(state.windows)),
      openings: JSON.parse(JSON.stringify(state.openings)),
      landBoundary: state.landBoundary ? JSON.parse(JSON.stringify(state.landBoundary)) : null,
      outdoorElements: JSON.parse(JSON.stringify(state.outdoorElements)),
      filledAreas: JSON.parse(JSON.stringify(state.filledAreas)),
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
    set({ ...prev, historyIndex: historyIndex - 1, selectedId: null, selectedType: null });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set({ ...next, historyIndex: historyIndex + 1, selectedId: null, selectedType: null });
  },

  setActiveTool: (tool) => {
    set({ 
      activeTool: tool, 
      selectedId: null, 
      selectedType: null,
      isDrawingWall: false,
      currentWallPoints: [],
      previewWallPoints: [],
    });
  },
  
  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setShowText: (v) => set({ showText: v }),
  setShowDimensions: (v) => set({ showDimensions: v }),
  setShowLandDimensions: (v) => set({ showLandDimensions: v }),

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  // Freehand wall drawing
  startWallDrawing: (x, y) => {
    const snap = get().snap;
    const snappedX = snap(x);
    const snappedY = snap(y);
    set({
      isDrawingWall: true,
      currentWallPoints: [{ x: snappedX, y: snappedY }],
      previewWallPoints: [{ x: snappedX, y: snappedY }],
    });
  },

  addWallPoint: (x, y) => {
    const snap = get().snap;
    const snappedX = snap(x);
    const snappedY = snap(y);
    set((state) => ({
      currentWallPoints: [...state.currentWallPoints, { x: snappedX, y: snappedY }],
      previewWallPoints: [...state.previewWallPoints, { x: snappedX, y: snappedY }],
    }));
  },

  updateWallPreview: (x, y) => {
    const snap = get().snap;
    const snappedX = snap(x);
    const snappedY = snap(y);
    set({ previewWallPoints: [...get().currentWallPoints, { x: snappedX, y: snappedY }] });
  },

  finishWallDrawing: () => {
    try {
      const { currentWallPoints } = get();
      if (currentWallPoints.length < 2) {
        set({ isDrawingWall: false, currentWallPoints: [], previewWallPoints: [] });
        return null;
      }

      const firstPoint = currentWallPoints[0];
      const lastPoint = currentWallPoints[currentWallPoints.length - 1];
      const distToFirst = Math.hypot(lastPoint.x - firstPoint.x, lastPoint.y - firstPoint.y);
      const { gridSize } = get();
      const isClosedLoop = currentWallPoints.length >= 3 && distToFirst <= gridSize;

      // If the curve closes, snap the last point to the first to ensure a perfect loop.
      const points = isClosedLoop
        ? [...currentWallPoints.slice(0, -1), { x: firstPoint.x, y: firstPoint.y }]
        : currentWallPoints;

      const newWalls = [];
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (Math.abs(dx) >= gridSize || Math.abs(dy) >= gridSize) {
          newWalls.push({
            id: nanoid(),
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            thickness: WALL_THICKNESS,
            height: WALL_HEIGHT,
            color: '#374151',
          });
        }
      }

      let filledAreaPoints = null;
      let areaBounds = null;
      if (isClosedLoop) {
        filledAreaPoints = points.slice(0, -1).map((p) => ({ x: p.x, y: p.y }));
        if (filledAreaPoints.length >= 3) {
          areaBounds = getBoundingBox(filledAreaPoints);
        }
      }

      const newAreaId = isClosedLoop ? nanoid() : null;

      if (newWalls.length > 0 || (isClosedLoop && areaBounds)) {
        set((state) => ({
          walls: isClosedLoop ? state.walls : [...state.walls, ...newWalls],
          filledAreas: isClosedLoop && areaBounds
            ? [
                ...state.filledAreas,
                {
                  id: newAreaId,
                  points: filledAreaPoints,
                  ...areaBounds,
                  // Use the same styling as rooms (light gray fill + gray stroke)
                  fill: '#f3f4f6',
                  stroke: '#9ca3af',
                },
              ]
            : state.filledAreas,
          isDrawingWall: false,
          currentWallPoints: [],
          previewWallPoints: [],
          activeTool: 'select',
        }));
        get()._pushHistory();
        return newAreaId;
      }

      set({ isDrawingWall: false, currentWallPoints: [], previewWallPoints: [] });
      return null;
    } catch (error) {
      console.error('Error finishing wall drawing:', error);
      set({ isDrawingWall: false, currentWallPoints: [], previewWallPoints: [], activeTool: 'select' });
      return null;
    }
  },

  cancelWallDrawing: () => {
    set({
      isDrawingWall: false,
      currentWallPoints: [],
      previewWallPoints: [],
      activeTool: 'wall',
    });
  },

  updateWallPoint: (index, x, y) => {
    set((state) => {
      if (!state.isDrawingWall) return {};
      const points = [...state.currentWallPoints];
      if (index < 0 || index >= points.length) return {};
      points[index] = { x, y };
      return { currentWallPoints: points, previewWallPoints: [...points] };
    });
  },

  insertWallPoint: (index, x, y) => {
    set((state) => {
      if (!state.isDrawingWall) return {};
      const points = [...state.currentWallPoints];
      const insertIndex = Math.max(0, Math.min(points.length, index));
      points.splice(insertIndex, 0, { x, y });
      return { currentWallPoints: points, previewWallPoints: [...points] };
    });
  },

  addWall: (x1, y1, x2, y2) => {
    const id = nanoid();
    const snap = get().snap;
    const wall = {
      id,
      x1: snap(x1),
      y1: snap(y1),
      x2: snap(x2),
      y2: snap(y2),
      thickness: WALL_THICKNESS,
      height: WALL_HEIGHT,
      color: '#374151',
    };
    set((state) => ({ walls: [...state.walls, wall] }));
    get()._pushHistory();
    return id;
  },

  updateWallLength: (id, newLengthMeters) => {
    const { walls } = get();
    const wall = walls.find((w) => w.id === id);
    if (!wall) return;
    
    const lengthPx = newLengthMeters * 20;
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const currentLength = Math.sqrt(dx * dx + dy * dy);
    
    if (currentLength === 0) return;
    
    const normalizedDx = dx / currentLength;
    const normalizedDy = dy / currentLength;
    
    const newX2 = wall.x1 + normalizedDx * lengthPx;
    const newY2 = wall.y1 + normalizedDy * lengthPx;
    
    set((state) => ({
      walls: state.walls.map((w) =>
        w.id === id ? { ...w, x2: newX2, y2: newY2 } : w
      ),
    }));
    get()._pushHistory();
  },

  addRoom: (x, y, width, height, name) => {
    const id = nanoid();
    const snap = get().snap;
    const room = {
      id,
      name: name || 'Ruangan',
      x: snap(x),
      y: snap(y),
      width: snap(width),
      height: snap(height),
      roomHeight: 3.2,
      fill: '#f3f4f6',
      stroke: '#9ca3af',
    };
    set((state) => ({ rooms: [...state.rooms, room] }));
    get()._pushHistory();
    return id;
  },

  addDoor: (x, y, rotation = 0) => {
    const id = nanoid();
    const snap = get().snap;
    const door = {
      id,
      x: snap(x),
      y: snap(y),
      width: 90,
      rotation,
      type: 'door',
    };
    set((state) => ({ doors: [...state.doors, door] }));
    get()._pushHistory();
    return id;
  },

  addWindow: (x, y, rotation = 0) => {
    const id = nanoid();
    const snap = get().snap;
    const win = {
      id,
      x: snap(x),
      y: snap(y),
      width: 120,
      rotation,
      type: 'window',
    };
    set((state) => ({ windows: [...state.windows, win] }));
    get()._pushHistory();
    return id;
  },

  addOpening: (x, y, rotation = 0) => {
    const id = nanoid();
    const snap = get().snap;
    const opening = {
      id,
      x: snap(x),
      y: snap(y),
      width: 100,
      rotation,
      type: 'opening',
    };
    set((state) => ({ openings: [...state.openings, opening] }));
    get()._pushHistory();
    return id;
  },

  setLandBoundary: (x, y, width, height) => {
    const snap = get().snap;
    const boundary = {
      id: 'land-boundary',
      x: snap(x),
      y: snap(y),
      width: snap(width),
      height: snap(height),
    };
    set({ landBoundary: boundary });
    get()._pushHistory();
  },

  updateLandBoundary: (updates) => {
    set((state) => ({
      landBoundary: state.landBoundary ? { ...state.landBoundary, ...updates } : null,
    }));
  },

  addOutdoorElement: (type, x, y, width, height) => {
    const id = nanoid();
    const snap = get().snap;
    const colors = {
      garden: { fill: '#dcfce7', stroke: '#86efac', label: 'Taman' },
      road: { fill: '#e5e7eb', stroke: '#9ca3af', label: 'Jalan' },
      carport: { fill: '#f3f4f6', stroke: '#d1d5db', label: 'Car Porch' },
    };
    const config = colors[type] || colors.garden;
    const element = {
      id,
      type,
      label: config.label,
      x: snap(x),
      y: snap(y),
      width: snap(width),
      height: snap(height),
      fill: config.fill,
      stroke: config.stroke,
    };
    set((state) => ({ outdoorElements: [...state.outdoorElements, element] }));
    get()._pushHistory();
    return id;
  },

  addFilledArea: (points, options = {}) => {
    const id = nanoid();
    const snap = get().snap;
    const area = {
      id,
      points: points.map((p) => ({ x: snap(p.x), y: snap(p.y) })),
      fill: options.fill || 'rgba(59,130,246,0.12)',
      stroke: options.stroke || '#2563eb',
    };
    set((state) => ({ filledAreas: [...state.filledAreas, area] }));
    get()._pushHistory();
    return id;
  },

  updateWall: (id, updates) => {
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
    get()._pushHistory();
  },

  updateRoom: (id, updates) => {
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    get()._pushHistory();
  },

  updateFilledArea: (id, updates) => {
    set((state) => ({
      filledAreas: state.filledAreas.map((a) => {
        if (a.id !== id) return a;
        const merged = { ...a, ...updates };

        // If the bounding box changes, regenerate the polygon points as a rectangle.
        if (
          'x' in updates ||
          'y' in updates ||
          'width' in updates ||
          'height' in updates
        ) {
          const x = merged.x ?? a.x;
          const y = merged.y ?? a.y;
          const width = merged.width ?? a.width;
          const height = merged.height ?? a.height;

          merged.points = [
            { x, y },
            { x: x + width, y },
            { x: x + width, y: y + height },
            { x, y: y + height },
          ];
        }

        return merged;
      }),
    }));
    get()._pushHistory();
  },

  updateDoor: (id, updates) => {
    set((state) => ({
      doors: state.doors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
    get()._pushHistory();
  },

  updateWindow: (id, updates) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
    get()._pushHistory();
  },

  updateOpening: (id, updates) => {
    set((state) => ({
      openings: state.openings.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
    get()._pushHistory();
  },

  updateOutdoorElement: (id, updates) => {
    set((state) => ({
      outdoorElements: state.outdoorElements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    get()._pushHistory();
  },

  deleteItem: (id) => {
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== id),
      rooms: state.rooms.filter((r) => r.id !== id),
      doors: state.doors.filter((d) => d.id !== id),
      windows: state.windows.filter((w) => w.id !== id),
      openings: state.openings.filter((o) => o.id !== id),
      filledAreas: state.filledAreas.filter((f) => f.id !== id),
      outdoorElements: state.outdoorElements.filter((e) => e.id !== id),
      landBoundary: state.landBoundary?.id === id ? null : state.landBoundary,
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedType: state.selectedId === id ? null : state.selectedType,
    }));
    get()._pushHistory();
  },

  moveItem: (id, type, dx, dy) => {
    const state = get();
    const snap = get().snap;

    if (type === 'wall') {
      const wall = state.walls.find((w) => w.id === id);
      if (wall) {
        get().updateWall(id, {
          x1: snap(wall.x1 + dx),
          y1: snap(wall.y1 + dy),
          x2: snap(wall.x2 + dx),
          y2: snap(wall.y2 + dy),
        }, false);
      }
    } else if (type === 'room') {
      const room = state.rooms.find((r) => r.id === id);
      if (room) {
        get().updateRoom(id, { x: snap(room.x + dx), y: snap(room.y + dy) }, false);
      }
    } else if (type === 'door') {
      const door = state.doors.find((d) => d.id === id);
      if (door) {
        get().updateDoor(id, { x: snap(door.x + dx), y: snap(door.y + dy) }, false);
      }
    } else if (type === 'window') {
      const win = state.windows.find((w) => w.id === id);
      if (win) {
        get().updateWindow(id, { x: snap(win.x + dx), y: snap(win.y + dy) }, false);
      }
    } else if (type === 'opening') {
      const op = state.openings.find((o) => o.id === id);
      if (op) {
        get().updateOpening(id, { x: snap(op.x + dx), y: snap(op.y + dy) }, false);
      }
    } else if (type === 'outdoor') {
      const el = state.outdoorElements.find((e) => e.id === id);
      if (el) {
        get().updateOutdoorElement(id, { x: snap(el.x + dx), y: snap(el.y + dy) }, false);
      }
    } else if (type === 'area') {
      const area = state.filledAreas.find((a) => a.id === id);
      if (area) {
        const movedPoints = area.points.map((p) => ({ x: snap(p.x + dx), y: snap(p.y + dy) }));
        get().updateFilledArea(id, {
          points: movedPoints,
          x: snap(area.x + dx),
          y: snap(area.y + dy),
        });
      }
    } else if (type === 'land-boundary') {
      const lb = state.landBoundary;
      if (lb) {
        get().updateLandBoundary({ x: snap(lb.x + dx), y: snap(lb.y + dy) });
      }
    }
  },

  setUploadedImage: (image) => set({ uploadedImage: image }),
  clearUploadedImage: () => set({ uploadedImage: null }),

  clearAll: () => {
    set({
      walls: [],
      rooms: [],
      doors: [],
      windows: [],
      openings: [],
      filledAreas: [],
      landBoundary: null,
      outdoorElements: [],
      selectedId: null,
      selectedType: null,
      isDrawingWall: false,
      currentWallPoints: [],
      previewWallPoints: [],
    });
    get()._pushHistory();
  },

  getWallLength: (wall) => {
    return Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
  },

  getRoomArea: (room) => {
    const { gridSize } = get();
    return ((room.width / gridSize) * (room.height / gridSize)).toFixed(2);
  },

  exportJSON: () => {
    const { walls, rooms, doors, windows, openings, landBoundary, outdoorElements, filledAreas } = get();
    return JSON.stringify({ walls, rooms, doors, windows, openings, landBoundary, outdoorElements, filledAreas }, null, 2);
  },
}));

export default useFloorPlanStore;
export { GRID_SIZE, METERS_PER_GRID, WALL_THICKNESS };
