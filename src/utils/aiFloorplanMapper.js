import { METERS_PER_GRID } from '@/features/floorplan/floorPlanStore';

const DEFAULT_ORIGIN = { x: 120, y: 120 };

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getPixelsPerMeter = (gridSize) => gridSize / METERS_PER_GRID;

export const metersToPixels = (valueMeters, gridSize) => toNumber(valueMeters) * getPixelsPerMeter(gridSize);

export const mapMetersPointToCanvas = (point, gridSize, origin = DEFAULT_ORIGIN) => ({
  x: origin.x + metersToPixels(point.x, gridSize),
  y: origin.y + metersToPixels(point.y, gridSize),
});

const mapBoundary = (boundary, gridSize, origin) => {
  const widthMeters = clamp(toNumber(boundary?.width, 10), 4, 60);
  const heightMeters = clamp(toNumber(boundary?.height, 12), 4, 60);

  return {
    x: origin.x,
    y: origin.y,
    width: metersToPixels(widthMeters, gridSize),
    height: metersToPixels(heightMeters, gridSize),
    widthMeters,
    heightMeters,
  };
};

const mapRooms = (rooms, gridSize, origin, boundaryMeters) => (
  (rooms || []).map((room, index) => {
    const xMeters = clamp(toNumber(room?.x, 0), 0, boundaryMeters.width - 1);
    const yMeters = clamp(toNumber(room?.y, 0), 0, boundaryMeters.height - 1);
    const widthMeters = clamp(toNumber(room?.width, 3), 1.5, boundaryMeters.width);
    const heightMeters = clamp(toNumber(room?.height, 3), 1.5, boundaryMeters.height);

    return {
      id: room?.id,
      name: room?.name || `Ruangan ${index + 1}`,
      x: origin.x + metersToPixels(xMeters, gridSize),
      y: origin.y + metersToPixels(yMeters, gridSize),
      width: metersToPixels(widthMeters, gridSize),
      height: metersToPixels(heightMeters, gridSize),
      widthMeters,
      heightMeters,
      confidence: toNumber(room?.confidence, 0.75),
    };
  })
);

const mapWalls = (walls, gridSize, origin) => (
  (walls || []).map((wall) => {
    const p1 = mapMetersPointToCanvas({ x: wall?.x1, y: wall?.y1 }, gridSize, origin);
    const p2 = mapMetersPointToCanvas({ x: wall?.x2, y: wall?.y2 }, gridSize, origin);

    return {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      thickness: toNumber(wall?.thickness, 10),
      confidence: toNumber(wall?.confidence, 0.75),
    };
  })
);

const mapOpenings = (openings, gridSize, origin) => {
  const mapItems = (items) => (items || []).map((item) => {
    const point = mapMetersPointToCanvas({ x: item?.x, y: item?.y }, gridSize, origin);
    return {
      x: point.x,
      y: point.y,
      rotation: toNumber(item?.rotation, 0),
      confidence: toNumber(item?.confidence, 0.7),
    };
  });

  return {
    doors: mapItems(openings?.doors),
    windows: mapItems(openings?.windows),
    openings: mapItems(openings?.openings),
  };
};

export const mapAIFloorplanToCanvas = (aiResult, options = {}) => {
  const gridSize = toNumber(options.gridSize, 20);
  const origin = options.origin || DEFAULT_ORIGIN;
  const boundary = mapBoundary(aiResult?.boundary, gridSize, origin);
  const boundaryMeters = { width: boundary.widthMeters, height: boundary.heightMeters };

  return {
    boundary,
    rooms: mapRooms(aiResult?.rooms, gridSize, origin, boundaryMeters),
    walls: mapWalls(aiResult?.walls, gridSize, origin),
    openings: mapOpenings(aiResult?.openings, gridSize, origin),
    meta: {
      warnings: aiResult?.warnings || [],
      confidence: toNumber(aiResult?.confidence, 0.75),
      source: aiResult?.source || 'ai',
      backend: aiResult?.metadata || null,
    },
  };
};
