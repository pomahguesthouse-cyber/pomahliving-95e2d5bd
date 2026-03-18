import { create } from 'zustand';

const GRID_SIZE = 20;
const WALL_THICKNESS = 24;
const METERS_TO_PIXELS = GRID_SIZE;

const useFloorPlanStore = create((set, get) => ({
  walls: [],
  rooms: [],
  openings: [],
  selectedId: null,
  selectedType: null,
  activeTool: 'select',
  gridVisible: true,
  zoom: 1,
  panOffset: { x: 50, y: 50 },
  history: [],
  historyIndex: -1,
  measurementUnit: 'm',
  snapEnabled: true,
  showDimensions: true,
  showLabels: true,

  pushHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({
      walls: JSON.parse(JSON.stringify(state.walls)),
      rooms: JSON.parse(JSON.stringify(state.rooms)),
      openings: JSON.parse(JSON.stringify(state.openings)),
    });
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const snapshot = state.history[newIndex];
      set({
        walls: JSON.parse(JSON.stringify(snapshot.walls)),
        rooms: JSON.parse(JSON.stringify(snapshot.rooms)),
        openings: JSON.parse(JSON.stringify(snapshot.openings)),
        historyIndex: newIndex,
        selectedId: null,
        selectedType: null,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const snapshot = state.history[newIndex];
      set({
        walls: JSON.parse(JSON.stringify(snapshot.walls)),
        rooms: JSON.parse(JSON.stringify(snapshot.rooms)),
        openings: JSON.parse(JSON.stringify(snapshot.openings)),
        historyIndex: newIndex,
        selectedId: null,
        selectedType: null,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  setActiveTool: (tool) => set({ activeTool: tool, selectedId: null, selectedType: null }),
  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  setShowDimensions: (show) => set({ showDimensions: show }),
  setShowLabels: (show) => set({ showLabels: show }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setMeasurementUnit: (unit) => set({ measurementUnit: unit }),
  
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  snapToGrid: (value) => {
    if (!get().snapEnabled) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  },

  pixelsToMeters: (pixels) => {
    return pixels / METERS_TO_PIXELS;
  },

  metersToPixels: (meters) => {
    return meters * METERS_TO_PIXELS;
  },

  addRoom: (x, y, width, height, name = 'Ruangan') => {
    const id = `room-${Date.now()}`;
    const snappedX = get().snapToGrid(x);
    const snappedY = get().snapToGrid(y);
    const snappedW = get().snapToGrid(width);
    const snappedH = get().snapToGrid(height);
    
    const room = {
      id,
      x: snappedX,
      y: snappedY,
      width: snappedW,
      height: snappedH,
      name,
      fill: '#f1f5f9',
      stroke: '#94a3b8',
      showLabel: true,
    };

    const walls = get().createWallsFromRoom(room);
    
    get().pushHistory();
    set((state) => ({ 
      rooms: [...state.rooms, room],
      walls: [...state.walls, ...walls],
    }));
    return id;
  },

  createWallsFromRoom: (room) => {
    const t = WALL_THICKNESS;
    return [
      { id: `wall-${Date.now()}-1`, x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y, thickness: t, roomId: room.id },
      { id: `wall-${Date.now()}-2`, x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height, thickness: t, roomId: room.id },
      { id: `wall-${Date.now()}-3`, x1: room.x + room.width, y1: room.y + room.height, x2: room.x, y2: room.y + room.height, thickness: t, roomId: room.id },
      { id: `wall-${Date.now()}-4`, x1: room.x, y1: room.y + room.height, x2: room.x, y2: room.y, thickness: t, roomId: room.id },
    ];
  },

  addWall: (x1, y1, x2, y2) => {
    const id = `wall-${Date.now()}`;
    const wall = {
      id,
      x1: get().snapToGrid(x1),
      y1: get().snapToGrid(y1),
      x2: get().snapToGrid(x2),
      y2: get().snapToGrid(y2),
      thickness: WALL_THICKNESS,
      roomId: null,
    };

    get().pushHistory();
    set((state) => ({ walls: [...state.walls, wall] }));
    return id;
  },

  addOpening: (type, wallId, offset) => {
    const id = `opening-${Date.now()}`;
    const opening = {
      id,
      type,
      wallId,
      offset: offset || 0.5,
      width: type === 'door' ? 90 : 120,
    };

    get().pushHistory();
    set((state) => ({ openings: [...state.openings, opening] }));
    return id;
  },

  updateRoom: (id, updates) => {
    const state = get();
    const room = state.rooms.find((r) => r.id === id);
    if (!room) return;

    const oldWidth = room.width;
    const oldHeight = room.height;
    const newWidth = updates.width !== undefined ? updates.width : oldWidth;
    const newHeight = updates.height !== undefined ? updates.height : oldHeight;

    get().pushHistory();
    set((state) => ({
      rooms: state.rooms.map((r) => {
        if (r.id !== id) return r;
        return { ...r, ...updates };
      }),
      walls: state.walls.map((w) => {
        if (w.roomId !== id) return w;
        
        if (w.x1 === room.x && w.y1 === room.y && w.x2 === room.x + oldWidth && w.y2 === room.y) {
          return { ...w, x2: room.x + newWidth };
        }
        if (w.x1 === room.x + oldWidth && w.y1 === room.y && w.x2 === room.x + oldWidth && w.y2 === room.y + oldHeight) {
          return { ...w, y1: room.y + newHeight, x1: room.x + newWidth };
        }
        if (w.x1 === room.x + oldWidth && w.y1 === room.y + oldHeight && w.x2 === room.x && w.y2 === room.y + oldHeight) {
          return { ...w, x1: room.x + newWidth, x2: room.x };
        }
        if (w.x1 === room.x && w.y1 === room.y + oldHeight && w.x2 === room.x && w.y2 === room.y) {
          return { ...w, y1: room.y + newHeight };
        }
        return w;
      }),
    }));
  },

  updateWall: (id, updates) => {
    get().pushHistory();
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  },

  updateOpening: (id, updates) => {
    get().pushHistory();
    set((state) => ({
      openings: state.openings.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  },

  deleteItem: (id) => {
    get().pushHistory();
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== id && w.roomId !== id),
      rooms: state.rooms.filter((r) => r.id !== id),
      openings: state.openings.filter((o) => o.id !== id && o.wallId !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedType: state.selectedId === id ? null : state.selectedType,
    }));
  },

  moveRoom: (id, dx, dy) => {
    const state = get();
    const room = state.rooms.find((r) => r.id === id);
    if (!room) return;

    const snappedDx = state.snapToGrid(dx);
    const snappedDy = state.snapToGrid(dy);

    get().pushHistory();
    set((state) => ({
      rooms: state.rooms.map((r) => 
        r.id === id ? { ...r, x: r.x + snappedDx, y: r.y + snappedDy } : r
      ),
      walls: state.walls.map((w) =>
        w.roomId === id 
          ? { ...w, x1: w.x1 + snappedDx, y1: w.y1 + snappedDy, x2: w.x2 + snappedDx, y2: w.y2 + snappedDy }
          : w
      ),
    }));
  },

  moveOpening: (id, newOffset) => {
    const state = get();
    const opening = state.openings.find((o) => o.id === id);
    if (!opening) return;

    const clampedOffset = Math.max(0.1, Math.min(0.9, newOffset));
    state.updateOpening(id, { offset: clampedOffset });
  },

  getWallById: (id) => get().walls.find((w) => w.id === id),
  getRoomById: (id) => get().rooms.find((r) => r.id === id),
  getOpeningById: (id) => get().openings.find((o) => o.id === id),

  getWallLength: (wall) => {
    return Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
  },

  getRoomArea: (room) => {
    const widthM = room.width / METERS_TO_PIXELS;
    const heightM = room.height / METERS_TO_PIXELS;
    return (widthM * heightM).toFixed(2);
  },

  clearAll: () => {
    get().pushHistory();
    set({
      walls: [],
      rooms: [],
      openings: [],
      selectedId: null,
      selectedType: null,
    });
  },

  exportToJSON: () => {
    const state = get();
    return JSON.stringify({
      walls: state.walls,
      rooms: state.rooms,
      openings: state.openings,
      gridSize: GRID_SIZE,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },

  importFromJSON: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      set({
        walls: data.walls || [],
        rooms: data.rooms || [],
        openings: data.openings || [],
        selectedId: null,
        selectedType: null,
      });
      return true;
    } catch (e) {
      console.error('Failed to import JSON:', e);
      return false;
    }
  },
}));

export default useFloorPlanStore;
export { GRID_SIZE, WALL_THICKNESS };
