export const GRID_SIZE = 20;
export const METERS_PER_GRID = 0.1;

export const getPolygonArea = (points) => {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  area = Math.abs(area) / 2;
  return area * METERS_PER_GRID * METERS_PER_GRID;
};

export const getCentroid = (points) => {
  if (points.length === 0) return { x: 0, y: 0 };
  
  let cx = 0;
  let cy = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    cx += points[i].x;
    cy += points[i].y;
  }
  
  return {
    x: cx / n,
    y: cy / n
  };
};

export const snapToGrid = (x, y, gridSize = GRID_SIZE) => ({
  x: Math.round(x / gridSize) * gridSize,
  y: Math.round(y / gridSize) * gridSize
});

export const isPolygonClosed = (points, threshold = GRID_SIZE) => {
  if (points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  const distance = Math.sqrt(
    Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
  );
  return distance <= threshold;
};

export const distanceToPoint = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getPointAtDistance = (from, to, distance) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return from;
  
  const ratio = distance / length;
  return {
    x: from.x + dx * ratio,
    y: from.y + dy * ratio
  };
};

export const formatArea = (area) => {
  if (area >= 1000) {
    return `${(area / 1000).toFixed(2)} m²`;
  }
  return `${area.toFixed(2)} m²`;
};

export const formatDimension = (gridUnits) => {
  const meters = gridUnits * METERS_PER_GRID;
  return `${meters.toFixed(2)}m`;
};

export const AREA_COLORS = {
  default: { fill: '#e0f2fe', stroke: '#0ea5e9' },
  bedroom: { fill: '#fce7f3', stroke: '#ec4899' },
  bathroom: { fill: '#dbeafe', stroke: '#3b82f6' },
  kitchen: { fill: '#fef3c7', stroke: '#f59e0b' },
  living: { fill: '#d1fae5', stroke: '#10b981' },
  dining: { fill: '#fee2e2', stroke: '#ef4444' },
  office: { fill: '#e9d5ff', stroke: '#8b5cf6' },
  garage: { fill: '#f3f4f6', stroke: '#6b7280' },
  garden: { fill: '#dcfce7', stroke: '#22c55e' },
  terrace: { fill: '#ffedd5', stroke: '#fb923c' },
};

export const getAreaColor = (label) => {
  const lowerLabel = label.toLowerCase();
  for (const [key, value] of Object.entries(AREA_COLORS)) {
    if (lowerLabel.includes(key)) {
      return value;
    }
  }
  return AREA_COLORS.default;
};
