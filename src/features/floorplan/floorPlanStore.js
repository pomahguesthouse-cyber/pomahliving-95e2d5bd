import { create } from 'zustand';
import { nanoid } from 'nanoid';

const GRID_SIZE = 20;
const WALL_THICKNESS = 24;
const WALL_HEIGHT = 280;

const useFloorPlanStore = create((set, get) => ({
  walls: [],
  rooms: [],
  doors: [],
  windows: [],
  selectedId: null,
  selectedType: null,
  activeTool: 'select',
  gridVisible: true,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  isDrawing: false,
  drawingStart: null,
  uploadedImage: null,

  setActiveTool: (tool) => set({ activeTool: tool, selectedId: null, selectedType: null }),
  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  addWall: (x1, y1, x2, y2) => {
    const id = nanoid();
    const wall = {
      id,
      x1: Math.round(x1 / GRID_SIZE) * GRID_SIZE,
      y1: Math.round(y1 / GRID_SIZE) * GRID_SIZE,
      x2: Math.round(x2 / GRID_SIZE) * GRID_SIZE,
      y2: Math.round(y2 / GRID_SIZE) * GRID_SIZE,
      thickness: WALL_THICKNESS,
      height: WALL_HEIGHT,
      color: '#374151',
    };
    set((state) => ({ walls: [...state.walls, wall] }));
    return id;
  },

  addRoom: (x, y, width, height) => {
    const id = nanoid();
    const room = {
      id,
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
      width: Math.round(width / GRID_SIZE) * GRID_SIZE,
      height: Math.round(height / GRID_SIZE) * GRID_SIZE,
      fill: '#f3f4f6',
      stroke: '#9ca3af',
    };
    set((state) => ({ rooms: [...state.rooms, room] }));
    return id;
  },

  addDoor: (x, y, rotation = 0) => {
    const id = nanoid();
    const door = {
      id,
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
      width: 90,
      rotation,
      type: 'door',
    };
    set((state) => ({ doors: [...state.doors, door] }));
    return id;
  },

  addWindow: (x, y, rotation = 0) => {
    const id = nanoid();
    const window = {
      id,
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
      width: 120,
      rotation,
      type: 'window',
    };
    set((state) => ({ windows: [...state.windows, window] }));
    return id;
  },

  updateWall: (id, updates) => {
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  },

  updateRoom: (id, updates) => {
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },

  updateDoor: (id, updates) => {
    set((state) => ({
      doors: state.doors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  },

  updateWindow: (id, updates) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  },

  deleteItem: (id) => {
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== id),
      rooms: state.rooms.filter((r) => r.id !== id),
      doors: state.doors.filter((d) => d.id !== id),
      windows: state.windows.filter((w) => w.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedType: state.selectedId === id ? null : state.selectedType,
    }));
  },

  moveItem: (id, type, dx, dy) => {
    const state = get();
    const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

    if (type === 'wall') {
      const wall = state.walls.find((w) => w.id === id);
      if (wall) {
        get().updateWall(id, {
          x1: snap(wall.x1 + dx),
          y1: snap(wall.y1 + dy),
          x2: snap(wall.x2 + dx),
          y2: snap(wall.y2 + dy),
        });
      }
    } else if (type === 'room') {
      const room = state.rooms.find((r) => r.id === id);
      if (room) {
        get().updateRoom(id, {
          x: snap(room.x + dx),
          y: snap(room.y + dy),
        });
      }
    } else if (type === 'door') {
      const door = state.doors.find((d) => d.id === id);
      if (door) {
        get().updateDoor(id, {
          x: snap(door.x + dx),
          y: snap(door.y + dy),
        });
      }
    } else if (type === 'window') {
      const win = state.windows.find((w) => w.id === id);
      if (win) {
        get().updateWindow(id, {
          x: snap(win.x + dx),
          y: snap(win.y + dy),
        });
      }
    }
  },

  setUploadedImage: (image) => set({ uploadedImage: image }),
  clearUploadedImage: () => set({ uploadedImage: null }),

  clearAll: () => set({
    walls: [],
    rooms: [],
    doors: [],
    windows: [],
    selectedId: null,
    selectedType: null,
  }),

  getWallLength: (wall) => {
    return Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
  },

  getRoomArea: (room) => {
    return ((room.width / GRID_SIZE) * (room.height / GRID_SIZE)).toFixed(1);
  },
}));

export default useFloorPlanStore;
export { GRID_SIZE };
