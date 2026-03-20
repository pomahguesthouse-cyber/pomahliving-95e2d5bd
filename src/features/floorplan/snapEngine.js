import { distanceBetweenPoints, midpoint } from './lineGeometry';

const addSegmentTargets = (targets, p1, p2) => {
  targets.endpoints.push({ x: p1.x, y: p1.y, type: 'endpoint' });
  targets.endpoints.push({ x: p2.x, y: p2.y, type: 'endpoint' });
  targets.midpoints.push({ ...midpoint(p1, p2), type: 'midpoint' });
};

const collectTargets = ({ walls = [], areas = [], currentPoints = [] }) => {
  const targets = { endpoints: [], midpoints: [] };

  walls.forEach((wall) => addSegmentTargets(targets, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }));

  areas.forEach((area) => {
    const points = Array.isArray(area.points) ? area.points : [];
    if (points.length < 2) return;

    for (let index = 0; index < points.length; index += 1) {
      const p1 = points[index];
      const p2 = points[(index + 1) % points.length];
      addSegmentTargets(targets, p1, p2);
    }
  });

  for (let index = 0; index < currentPoints.length - 1; index += 1) {
    addSegmentTargets(targets, currentPoints[index], currentPoints[index + 1]);
  }

  currentPoints.forEach((point, index) => {
    targets.endpoints.push({ x: point.x, y: point.y, type: index === 0 ? 'startpoint' : 'endpoint' });
  });

  return targets;
};

const findNearest = (point, candidates, threshold) => {
  let winner = null;

  candidates.forEach((candidate) => {
    const distance = distanceBetweenPoints(point, candidate);
    if (distance > threshold) return;
    if (!winner || distance < winner.distance) {
      winner = { ...candidate, distance };
    }
  });

  return winner;
};

export const getSnappedPoint = ({
  point,
  gridSize,
  snapEnabled,
  walls,
  areas,
  currentPoints,
  zoom = 1,
  snapStrength = 14,
}) => {
  if (!snapEnabled) {
    return { point, indicator: null };
  }

  const threshold = snapStrength / Math.max(zoom, 0.25);
  const targets = collectTargets({ walls, areas, currentPoints });

  const endpointHit = findNearest(point, targets.endpoints, threshold);
  if (endpointHit) {
    return {
      point: { x: endpointHit.x, y: endpointHit.y },
      indicator: { x: endpointHit.x, y: endpointHit.y, type: endpointHit.type },
    };
  }

  const midpointHit = findNearest(point, targets.midpoints, threshold);
  if (midpointHit) {
    return {
      point: { x: midpointHit.x, y: midpointHit.y },
      indicator: { x: midpointHit.x, y: midpointHit.y, type: midpointHit.type },
    };
  }

  const gridPoint = {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };

  const gridMoved = gridPoint.x !== point.x || gridPoint.y !== point.y;
  return {
    point: gridPoint,
    indicator: gridMoved ? { x: gridPoint.x, y: gridPoint.y, type: 'grid' } : null,
  };
};
