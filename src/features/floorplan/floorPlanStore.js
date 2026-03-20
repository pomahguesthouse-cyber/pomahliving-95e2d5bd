import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { buildLineRecord, getLineLengthPx } from './lineGeometry';

const GRID_SIZE = 20;
// Each grid cell represents this many meters.
// Small grid = 0.5m, large grid = 1m.
const METERS_PER_GRID = 0.5;
const WALL_THICKNESS = 10;
const WALL_HEIGHT = 280;
const MAX_HISTORY = 50;
const VERTEX_EPSILON = 0.001;

const cloneVertices = (vertices) => vertices.map((vertex) => ({
  ...vertex,
  connectedLines: [...(vertex.connectedLines || [])],
}));

const findVertexById = (vertices, id) => vertices.find((vertex) => vertex.id === id);

const findVertexByPosition = (vertices, x, y) => vertices.find(
  (vertex) => Math.abs(vertex.x - x) <= VERTEX_EPSILON && Math.abs(vertex.y - y) <= VERTEX_EPSILON
);

const upsertVertex = (vertices, x, y) => {
  const existing = findVertexByPosition(vertices, x, y);
  if (existing) return existing;

  const vertex = {
    id: nanoid(),
    x,
    y,
    connectedLines: [],
  };
  vertices.push(vertex);
  return vertex;
};

const connectLineToVertex = (vertex, lineId) => {
  if (!vertex.connectedLines.includes(lineId)) {
    vertex.connectedLines.push(lineId);
  }
};

const disconnectLineFromVertex = (vertex, lineId) => {
  vertex.connectedLines = vertex.connectedLines.filter((connectedId) => connectedId !== lineId);
};

const hydrateWallFromVertices = (wall, vertices) => {
  if (!wall.startVertexId || !wall.endVertexId) {
    return buildLineRecord(wall);
  }

  const startVertex = findVertexById(vertices, wall.startVertexId);
  const endVertex = findVertexById(vertices, wall.endVertexId);

  if (!startVertex || !endVertex) {
    return buildLineRecord(wall);
  }

  return buildLineRecord({
    ...wall,
    x1: startVertex.x,
    y1: startVertex.y,
    x2: endVertex.x,
    y2: endVertex.y,
  });
};

const cleanupOrphanVertices = (vertices) => vertices.filter((vertex) => vertex.connectedLines.length > 0);

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

const getEdgeKey = (p1, p2) => {
  const a = `${p1.x},${p1.y}`;
  const b = `${p2.x},${p2.y}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
};

const getRectanglePoints = ({ x, y, width, height }) => ([
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
]);

const useFloorPlanStore = create((set, get) => ({
  vertices: [],
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
  snapStrength: 14,
  snapMask: {
    point: true,
    midpoint: true,
    intersection: true,
    segment: true,
    grid: true,
  },
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
  
  // Freehand boundary drawing state
  isDrawingBoundary: false,
  currentBoundaryPoints: [],
  previewBoundaryPoints: [],

  // SketchUp-style continuous line drawing state
  isDrawingWall: false,
  currentWallPoints: [],
  previewWallPoints: [],
  wallDrawingMode: 'waiting', // 'waiting' | 'drawing'
  lastSnapTarget: null, // sticky snap memory

  _pushHistory: () => {
    const state = get();
    const snapshot = {
      vertices: JSON.parse(JSON.stringify(state.vertices)),
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
      isDrawingBoundary: false,
      currentBoundaryPoints: [],
      previewBoundaryPoints: [],
      isDrawingWall: false,
      currentWallPoints: [],
      previewWallPoints: [],
    });
  },
  
  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  setSnapStrength: (value) => set({ snapStrength: Math.max(4, Math.min(40, value)) }),
  toggleSnapMask: (key) => {
    set((state) => ({
      snapMask: {
        ...state.snapMask,
        [key]: !state.snapMask?.[key],
      },
    }));
  },
  setShowText: (v) => set({ showText: v }),
  setShowDimensions: (v) => set({ showDimensions: v }),
  setShowLandDimensions: (v) => set({ showLandDimensions: v }),

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  // Freehand wall drawing
  startBoundaryDrawing: (x, y) => {
    const snap = get().snap;
    const snappedX = snap(x);
    const snappedY = snap(y);
    set({
      isDrawingBoundary: true,
      currentBoundaryPoints: [{ x: snappedX, y: snappedY }],
      previewBoundaryPoints: [{ x: snappedX, y: snappedY }],
    });
  },

  addBoundaryPoint: (x, y) => {
    const snap = get().snap;
    const snappedX = snap(x);
    const snappedY = snap(y);
    set((state) => ({
      currentBoundaryPoints: [...state.currentBoundaryPoints, { x: snappedX, y: snappedY }],
      previewBoundaryPoints: [...state.previewBoundaryPoints, { x: snappedX, y: snappedY }],
    }));
  },

  updateBoundaryPreview: (x, y) => {
    const snap = get().snap;
    const snappedX = snap(x);
    const snappedY = snap(y);
    set({ previewBoundaryPoints: [...get().currentBoundaryPoints, { x: snappedX, y: snappedY }] });
  },

  finishBoundaryDrawing: () => {
    try {
      const { currentBoundaryPoints } = get();
      if (currentBoundaryPoints.length < 2) {
        set({ isDrawingBoundary: false, currentBoundaryPoints: [], previewBoundaryPoints: [] });
        return null;
      }

      const firstPoint = currentBoundaryPoints[0];
      const lastPoint = currentBoundaryPoints[currentBoundaryPoints.length - 1];
      const distToFirst = Math.hypot(lastPoint.x - firstPoint.x, lastPoint.y - firstPoint.y);
      const { gridSize } = get();
      const isClosedLoop = currentBoundaryPoints.length >= 3 && distToFirst <= gridSize;

      // If the curve closes, snap the last point to the first to ensure a perfect loop.
      const points = isClosedLoop
        ? [...currentBoundaryPoints.slice(0, -1), { x: firstPoint.x, y: firstPoint.y }]
        : currentBoundaryPoints;

      const newBoundaries = [];
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (Math.abs(dx) >= gridSize || Math.abs(dy) >= gridSize) {
          newBoundaries.push(buildLineRecord({
            id: nanoid(),
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            thickness: WALL_THICKNESS,
            height: WALL_HEIGHT,
            color: '#374151',
            type: 'area-line',
          }));
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

      if (newBoundaries.length > 0 || (isClosedLoop && areaBounds)) {
        set((state) => ({
          vertices: state.vertices,
          walls: isClosedLoop ? state.walls : [...state.walls, ...newBoundaries],
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
          isDrawingBoundary: false,
          currentBoundaryPoints: [],
          previewBoundaryPoints: [],
          activeTool: 'select',
        }));
        get()._pushHistory();
        return newAreaId;
      }

      set({ isDrawingBoundary: false, currentBoundaryPoints: [], previewBoundaryPoints: [] });
      return null;
    } catch (error) {
      console.error('Error finishing boundary drawing:', error);
      set({ isDrawingBoundary: false, currentBoundaryPoints: [], previewBoundaryPoints: [], activeTool: 'select' });
      return null;
    }
  },

  cancelBoundaryDrawing: () => {
    set({
      isDrawingBoundary: false,
      currentBoundaryPoints: [],
      previewBoundaryPoints: [],
      activeTool: 'wall',
    });
  },

  // Freehand wall drawing
  startWallDrawing: (x, y) => {
    set({
      isDrawingWall: true,
      wallDrawingMode: 'drawing',
      currentWallPoints: [{ x, y }],
      previewWallPoints: [{ x, y }],
      selectedId: null,
      selectedType: null,
    });
  },

  addWallPoint: (x, y) => {
    set((state) => ({
      currentWallPoints: [...state.currentWallPoints, { x, y }],
      previewWallPoints: [...state.currentWallPoints, { x, y }],
    }));
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

  updateWallPreview: (x, y) => {
    set((state) => ({ previewWallPoints: [...state.currentWallPoints, { x, y }] }));
  },

  finishWallDrawing: (options = {}) => {
    const { forceClose = false } = options;
    const { currentWallPoints, gridSize } = get();
    try {
      if (!currentWallPoints || currentWallPoints.length < 2) {
        set({ isDrawingWall: false, currentWallPoints: [], previewWallPoints: [], activeTool: 'wall' });
        return null;
      }

      const firstPoint = currentWallPoints[0];
      const lastPoint = currentWallPoints[currentWallPoints.length - 1];
      const distToFirst = Math.hypot(lastPoint.x - firstPoint.x, lastPoint.y - firstPoint.y);
      const isClosedLoop = currentWallPoints.length >= 3 && (forceClose || distToFirst <= gridSize);

      const alreadyClosed =
        currentWallPoints.length >= 2 &&
        currentWallPoints[0].x === currentWallPoints[currentWallPoints.length - 1].x &&
        currentWallPoints[0].y === currentWallPoints[currentWallPoints.length - 1].y;

      const points = isClosedLoop
        ? [
            ...(alreadyClosed ? currentWallPoints.slice(0, -1) : currentWallPoints),
            { x: firstPoint.x, y: firstPoint.y },
          ]
        : currentWallPoints;

      const newWalls = [];
      const nextVertices = cloneVertices(get().vertices);

      for (let i = 0; i < points.length - 1; i += 1) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const lineId = nanoid();
        const startVertex = upsertVertex(nextVertices, p1.x, p1.y);
        const endVertex = upsertVertex(nextVertices, p2.x, p2.y);
        connectLineToVertex(startVertex, lineId);
        connectLineToVertex(endVertex, lineId);

        newWalls.push(hydrateWallFromVertices({
          id: lineId,
          startVertexId: startVertex.id,
          endVertexId: endVertex.id,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          thickness: WALL_THICKNESS,
          height: WALL_HEIGHT,
          color: '#374151',
          type: 'area-line',
        }, nextVertices));
      }

      const newAreaId = isClosedLoop ? nanoid() : null;
      const area = isClosedLoop
        ? {
            id: newAreaId,
            points: points.slice(0, -1),
            ...getBoundingBox(points.slice(0, -1)),
            fill: '#f3f4f6',
            stroke: '#9ca3af',
          }
        : null;

      set((state) => ({
        vertices: nextVertices,
        walls: [...state.walls, ...newWalls],
        filledAreas: area ? [...state.filledAreas, area] : state.filledAreas,
        isDrawingWall: false,
        currentWallPoints: [],
        previewWallPoints: [],
        activeTool: 'wall',
      }));

      get()._pushHistory();
      return newAreaId;
    } catch (error) {
      console.error('Error finishing wall drawing:', error);
      set({ isDrawingWall: false, currentWallPoints: [], previewWallPoints: [], activeTool: 'wall' });
      return null;
    }
  },

  cancelWallDrawing: () => {
    set({
      isDrawingWall: false,
      wallDrawingMode: 'waiting',
      currentWallPoints: [],
      previewWallPoints: [],
      lastSnapTarget: null,
      activeTool: 'wall',
    });
  },

  stepBackWallDrawing: () => {
    set((state) => {
      if (!state.isDrawingWall || state.currentWallPoints.length === 0) {
        return {};
      }

      if (state.currentWallPoints.length === 1) {
        return {
          isDrawingWall: false,
          currentWallPoints: [],
          previewWallPoints: [],
          activeTool: 'wall',
        };
      }

      const nextPoints = state.currentWallPoints.slice(0, -1);
      return {
        currentWallPoints: nextPoints,
        previewWallPoints: [...nextPoints],
      };
    });
  },

  updateBoundaryPoint: (index, x, y) => {
    set((state) => {
      if (!state.isDrawingBoundary) return {};
      const points = [...state.currentBoundaryPoints];
      if (index < 0 || index >= points.length) return {};
      points[index] = { x, y };
      return { currentBoundaryPoints: points, previewBoundaryPoints: [...points] };
    });
  },

  insertBoundaryPoint: (index, x, y) => {
    set((state) => {
      if (!state.isDrawingBoundary) return {};
      const points = [...state.currentBoundaryPoints];
      const insertIndex = Math.max(0, Math.min(points.length, index));
      points.splice(insertIndex, 0, { x, y });
      return { currentBoundaryPoints: points, previewBoundaryPoints: [...points] };
    });
  },

  addWall: (x1, y1, x2, y2) => {
    const id = nanoid();
    const snap = get().snap;
    const wall = {
      id,
      startVertexId: null,
      endVertexId: null,
      x1: snap(x1),
      y1: snap(y1),
      x2: snap(x2),
      y2: snap(y2),
      thickness: WALL_THICKNESS,
      height: WALL_HEIGHT,
      color: '#374151',
      type: 'area-line',
    };
    set((state) => {
      const vertices = cloneVertices(state.vertices);
      const startVertex = upsertVertex(vertices, wall.x1, wall.y1);
      const endVertex = upsertVertex(vertices, wall.x2, wall.y2);
      connectLineToVertex(startVertex, id);
      connectLineToVertex(endVertex, id);
      return {
        vertices,
        walls: [
          ...state.walls,
          hydrateWallFromVertices({
            ...wall,
            startVertexId: startVertex.id,
            endVertexId: endVertex.id,
          }, vertices),
        ],
      };
    });
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
    const currentLength = getLineLengthPx(wall);
    
    if (currentLength === 0) return;
    
    const normalizedDx = dx / currentLength;
    const normalizedDy = dy / currentLength;
    
    const newX2 = wall.x1 + normalizedDx * lengthPx;
    const newY2 = wall.y1 + normalizedDy * lengthPx;
    
    set((state) => ({
      walls: state.walls.map((w) =>
        w.id === id ? buildLineRecord({ ...w, x2: newX2, y2: newY2 }) : w
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

  updateLandBoundary: (updates, pushHistory = true) => {
    set((state) => ({
      landBoundary: state.landBoundary ? { ...state.landBoundary, ...updates } : null,
    }));
    if (pushHistory) get()._pushHistory();
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

  updateWall: (id, updates, pushHistory = true) => {
    set((state) => {
      const vertices = cloneVertices(state.vertices);
      let walls = state.walls.map((wall) => (wall.id === id ? { ...wall, ...updates } : wall));
      const targetWall = walls.find((wall) => wall.id === id);

      if (targetWall?.startVertexId || targetWall?.endVertexId) {
        const startVertex = targetWall?.startVertexId ? findVertexById(vertices, targetWall.startVertexId) : null;
        const endVertex = targetWall?.endVertexId ? findVertexById(vertices, targetWall.endVertexId) : null;

        if (startVertex) {
          if ('x1' in updates) startVertex.x = updates.x1;
          if ('y1' in updates) startVertex.y = updates.y1;
        }

        if (endVertex) {
          if ('x2' in updates) endVertex.x = updates.x2;
          if ('y2' in updates) endVertex.y = updates.y2;
        }

        walls = walls.map((wall) => hydrateWallFromVertices(wall, vertices));
      } else {
        walls = walls.map((wall) => buildLineRecord(wall));
      }

      return { vertices, walls };
    });
    if (pushHistory) get()._pushHistory();
  },

  updateRoom: (id, updates, pushHistory = true) => {
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    if (pushHistory) get()._pushHistory();
  },

  updateFilledArea: (id, updates, pushHistory = true) => {
    set((state) => {
      const area = state.filledAreas.find((item) => item.id === id);
      if (!area) return {};

      let nextArea = { ...area, ...updates };
      if ('x' in updates || 'y' in updates || 'width' in updates || 'height' in updates) {
        const x = nextArea.x ?? area.x;
        const y = nextArea.y ?? area.y;
        const width = nextArea.width ?? area.width;
        const height = nextArea.height ?? area.height;
        nextArea.points = getRectanglePoints({ x, y, width, height });
      }

      const nextPoints = Array.isArray(nextArea.points) ? nextArea.points : area.points;
      const nextBounds = nextPoints?.length >= 3 ? getBoundingBox(nextPoints) : {
        x: nextArea.x ?? area.x,
        y: nextArea.y ?? area.y,
        width: nextArea.width ?? area.width,
        height: nextArea.height ?? area.height,
      };

      nextArea = {
        ...nextArea,
        points: nextPoints,
        ...nextBounds,
      };

      let vertices = state.vertices;
      let walls = state.walls;
      const oldPoints = Array.isArray(area.points) ? area.points : [];

      if (oldPoints.length >= 3 && nextPoints?.length === oldPoints.length) {
        const nextVertices = cloneVertices(state.vertices);
        const movedVertexIds = new Set();

        oldPoints.forEach((oldPoint, index) => {
          const vertex = findVertexByPosition(nextVertices, oldPoint.x, oldPoint.y);
          const nextPoint = nextPoints[index];
          if (!vertex || !nextPoint || movedVertexIds.has(vertex.id)) return;

          vertex.x = nextPoint.x;
          vertex.y = nextPoint.y;
          movedVertexIds.add(vertex.id);
        });

        const boundaryEdgeKeys = new Set(
          oldPoints.map((point, index) => getEdgeKey(point, oldPoints[(index + 1) % oldPoints.length]))
        );

        walls = state.walls.map((wall) => {
          const wallEdgeKey = getEdgeKey(
            { x: wall.x1, y: wall.y1 },
            { x: wall.x2, y: wall.y2 }
          );

          if (!boundaryEdgeKeys.has(wallEdgeKey)) return wall;

          if (wall.startVertexId || wall.endVertexId) {
            return hydrateWallFromVertices(wall, nextVertices);
          }

          const startIndex = oldPoints.findIndex((point) => point.x === wall.x1 && point.y === wall.y1);
          const endIndex = oldPoints.findIndex((point) => point.x === wall.x2 && point.y === wall.y2);
          if (startIndex === -1 || endIndex === -1) return wall;

          return buildLineRecord({
            ...wall,
            x1: nextPoints[startIndex].x,
            y1: nextPoints[startIndex].y,
            x2: nextPoints[endIndex].x,
            y2: nextPoints[endIndex].y,
          });
        });

        vertices = nextVertices;
      }

      return {
        vertices,
        walls,
        filledAreas: state.filledAreas.map((item) => (item.id === id ? nextArea : item)),
      };
    });
    if (pushHistory) get()._pushHistory();
  },

  updateDoor: (id, updates, pushHistory = true) => {
    set((state) => ({
      doors: state.doors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
    if (pushHistory) get()._pushHistory();
  },

  updateWindow: (id, updates, pushHistory = true) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
    if (pushHistory) get()._pushHistory();
  },

  updateOpening: (id, updates, pushHistory = true) => {
    set((state) => ({
      openings: state.openings.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
    if (pushHistory) get()._pushHistory();
  },

  updateOutdoorElement: (id, updates, pushHistory = true) => {
    set((state) => ({
      outdoorElements: state.outdoorElements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    if (pushHistory) get()._pushHistory();
  },

  deleteItem: (id) => {
    set((state) => {
      const vertices = cloneVertices(state.vertices);
      const deletedWall = state.walls.find((wall) => wall.id === id);

      if (deletedWall?.startVertexId) {
        const startVertex = findVertexById(vertices, deletedWall.startVertexId);
        if (startVertex) disconnectLineFromVertex(startVertex, id);
      }

      if (deletedWall?.endVertexId) {
        const endVertex = findVertexById(vertices, deletedWall.endVertexId);
        if (endVertex) disconnectLineFromVertex(endVertex, id);
      }

      return {
      vertices: cleanupOrphanVertices(vertices),
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
    };
    });
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
        set((currentState) => {
          const vertices = cloneVertices(currentState.vertices);
          const areaPointKeys = new Set(
            (Array.isArray(area.points) ? area.points : []).map((point) => `${point.x},${point.y}`)
          );

          const movedVertexIds = new Set();
          vertices.forEach((vertex) => {
            const key = `${vertex.x},${vertex.y}`;
            if (!areaPointKeys.has(key) || movedVertexIds.has(vertex.id)) return;

            vertex.x = snap(vertex.x + dx);
            vertex.y = snap(vertex.y + dy);
            movedVertexIds.add(vertex.id);
          });

          const walls = currentState.walls.map((wall) => {
            const isBoundaryWall = area.points.some((point, index) => {
              const nextPoint = area.points[(index + 1) % area.points.length];
              const forwardMatch =
                wall.x1 === point.x &&
                wall.y1 === point.y &&
                wall.x2 === nextPoint.x &&
                wall.y2 === nextPoint.y;
              const reverseMatch =
                wall.x1 === nextPoint.x &&
                wall.y1 === nextPoint.y &&
                wall.x2 === point.x &&
                wall.y2 === point.y;
              return forwardMatch || reverseMatch;
            });

            if (!isBoundaryWall) return wall;
            return hydrateWallFromVertices(wall, vertices);
          });

          const movedPoints = area.points.map((point) => ({
            x: snap(point.x + dx),
            y: snap(point.y + dy),
          }));

          return {
            vertices,
            walls,
            filledAreas: currentState.filledAreas.map((filledArea) => (
              filledArea.id !== id
                ? filledArea
                : {
                    ...filledArea,
                    points: movedPoints,
                    x: snap((filledArea.x ?? 0) + dx),
                    y: snap((filledArea.y ?? 0) + dy),
                  }
            )),
          };
        });
      }
    } else if (type === 'land-boundary') {
      const lb = state.landBoundary;
      if (lb) {
        get().updateLandBoundary({ x: snap(lb.x + dx), y: snap(lb.y + dy) }, false);
      }
    }
  },

  setUploadedImage: (image) => set({ uploadedImage: image }),
  clearUploadedImage: () => set({ uploadedImage: null }),

  clearAll: () => {
    set({
      vertices: [],
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
      isDrawingBoundary: false,
      currentBoundaryPoints: [],
      previewBoundaryPoints: [],
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
    const { vertices, walls, rooms, doors, windows, openings, landBoundary, outdoorElements, filledAreas } = get();
    return JSON.stringify({ vertices, walls, rooms, doors, windows, openings, landBoundary, outdoorElements, filledAreas }, null, 2);
  },
}));

export default useFloorPlanStore;
export { GRID_SIZE, METERS_PER_GRID, WALL_THICKNESS };
