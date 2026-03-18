import { create } from "zustand";

const MAX_HISTORY = 50;

export const useFloorPlanStore = create((set, get) => ({
  zoom: 1,
  panOffset: { x: 50, y: 50 },
  tool: "select",
  walls: [],
  rooms: [],
  openings: [],
  selectedId: null,
  selectedType: null,
  history: [],
  historyIndex: -1,

  saveHistory: () => {
    const { walls, rooms, openings, history, historyIndex } = get();
    const state = { walls: [...walls], rooms: [...rooms], openings: [...openings] };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({
        walls: prevState.walls,
        rooms: prevState.rooms,
        openings: prevState.openings,
        historyIndex: historyIndex - 1,
        selectedId: null,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        walls: nextState.walls,
        rooms: nextState.rooms,
        openings: nextState.openings,
        historyIndex: historyIndex + 1,
        selectedId: null,
      });
    }
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (pan) => set({ panOffset: pan }),
  setTool: (tool) => set({ tool, selectedId: null }),

  addWall: (wall) => {
    get().saveHistory();
    set((state) => ({ walls: [...state.walls, wall] }));
  },

  addRoom: (room) => {
    get().saveHistory();
    set((state) => ({ rooms: [...state.rooms, room] }));
  },

  addOpening: (opening) => {
    get().saveHistory();
    set((state) => ({ openings: [...state.openings, opening] }));
  },

  setSelected: (id, type = null) => set({ selectedId: id, selectedType: type }),

  updateWall: (id, data) => {
    get().saveHistory();
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...data } : w)),
    }));
  },

  updateRoom: (id, data, silent = false) => {
    if (!silent) get().saveHistory();
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
  },

  updateOpening: (id, data) => {
    get().saveHistory();
    set((state) => ({
      openings: state.openings.map((o) => (o.id === id ? { ...o, ...data } : o)),
    }));
  },

  deleteItem: () => {
    get().saveHistory();
    const { selectedId } = get();
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== selectedId),
      rooms: state.rooms.filter((r) => r.id !== selectedId),
      openings: state.openings.filter((o) => o.id !== selectedId && o.wallId !== selectedId),
      selectedId: null,
      selectedType: null,
    }));
  },

  clearAll: () => {
    get().saveHistory();
    set({ walls: [], rooms: [], openings: [], selectedId: null, selectedType: null });
  },

  generateWallsFromRooms: () => {
    get().saveHistory();
    const { rooms } = get();
    const newWalls = [];
    rooms.forEach((room) => {
      const t = 6;
      const x = room.x;
      const y = room.y;
      const w = room.width;
      const h = room.height;
      newWalls.push(
        { id: `wall-${room.id}-1`, x1: x, y1: y, x2: x + w, y2: y, thickness: t, roomId: room.id },
        { id: `wall-${room.id}-2`, x1: x + w, y1: y, x2: x + w, y2: y + h, thickness: t, roomId: room.id },
        { id: `wall-${room.id}-3`, x1: x, y1: y + h, x2: x + w, y2: y + h, thickness: t, roomId: room.id },
        { id: `wall-${room.id}-4`, x1: x, y1: y, x2: x, y2: y + h, thickness: t, roomId: room.id }
      );
    });
    set({ walls: newWalls });
  },

  updateRoomWithWalls: (roomId, data) => {
    get().saveHistory();
    set((state) => {
      const updatedRooms = state.rooms.map((r) => (r.id === roomId ? { ...r, ...data } : r));
      const room = updatedRooms.find((r) => r.id === roomId);
      if (!room) return { rooms: updatedRooms };
      const updatedWalls = state.walls.map((w) => {
        if (w.roomId !== roomId) return w;
        const x = room.x;
        const y = room.y;
        const w2 = room.width;
        const h = room.height;
        if (w.id.endsWith("-1")) return { ...w, x1: x, y1: y, x2: x + w2, y2: y };
        if (w.id.endsWith("-2")) return { ...w, x1: x + w2, y1: y, x2: x + w2, y2: y + h };
        if (w.id.endsWith("-3")) return { ...w, x1: x, y1: y + h, x2: x + w2, y2: y + h };
        if (w.id.endsWith("-4")) return { ...w, x1: x, y1: y, x2: x, y2: y + h };
        return w;
      });
      return { rooms: updatedRooms, walls: updatedWalls };
    });
  },
}));
