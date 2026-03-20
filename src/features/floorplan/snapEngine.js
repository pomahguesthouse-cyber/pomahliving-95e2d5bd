import { distanceBetweenPoints, midpoint } from './lineGeometry';

const addSegmentTargets = (targets, p1, p2) => {
  targets.endpoints.push({ x: p1.x, y: p1.y, type: 'endpoint' });
  targets.endpoints.push({ x: p2.x, y: p2.y, type: 'endpoint' });
  targets.midpoints.push({ ...midpoint(p1, p2), type: 'midpoint' });
  targets.segments.push({ p1, p2 });
};

const getBucketKey = (x, y, cellSize) => `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;

const buildPointBucketIndex = (points, cellSize) => {
  const buckets = new Map();

  points.forEach((point) => {
    const key = getBucketKey(point.x, point.y, cellSize);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(point);
  });

  return buckets;
};

const buildSegmentBucketIndex = (segments, cellSize) => {
  const buckets = new Map();

  segments.forEach((segment) => {
    const minX = Math.min(segment.p1.x, segment.p2.x);
    const maxX = Math.max(segment.p1.x, segment.p2.x);
    const minY = Math.min(segment.p1.y, segment.p2.y);
    const maxY = Math.max(segment.p1.y, segment.p2.y);

    for (let gx = Math.floor(minX / cellSize); gx <= Math.floor(maxX / cellSize); gx += 1) {
      for (let gy = Math.floor(minY / cellSize); gy <= Math.floor(maxY / cellSize); gy += 1) {
        const key = `${gx}:${gy}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(segment);
      }
    }
  });

  return buckets;
};

const queryPointBuckets = (bucketMap, point, radius, cellSize) => {
  const minX = Math.floor((point.x - radius) / cellSize);
  const maxX = Math.floor((point.x + radius) / cellSize);
  const minY = Math.floor((point.y - radius) / cellSize);
  const maxY = Math.floor((point.y + radius) / cellSize);
  const results = [];

  for (let gx = minX; gx <= maxX; gx += 1) {
    for (let gy = minY; gy <= maxY; gy += 1) {
      const key = `${gx}:${gy}`;
      const bucket = bucketMap.get(key);
      if (bucket) results.push(...bucket);
    }
  }

  return results;
};

const lineIntersection = (a, b) => {
  const x1 = a.p1.x;
  const y1 = a.p1.y;
  const x2 = a.p2.x;
  const y2 = a.p2.y;
  const x3 = b.p1.x;
  const y3 = b.p1.y;
  const x4 = b.p2.x;
  const y4 = b.p2.y;
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denominator) < 1e-6) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denominator;

  if (t < 0 || t > 1 || u < 0 || u > 1) return null;

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
    type: 'intersection',
  };
};

const projectPointOnSegment = (point, segment) => {
  const dx = segment.p2.x - segment.p1.x;
  const dy = segment.p2.y - segment.p1.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 1e-6) return null;

  const t = Math.max(0, Math.min(1, ((point.x - segment.p1.x) * dx + (point.y - segment.p1.y) * dy) / lengthSq));
  return {
    x: segment.p1.x + t * dx,
    y: segment.p1.y + t * dy,
  };
};

const collectTargets = ({ walls = [], areas = [], currentPoints = [] }) => {
  const targets = { endpoints: [], midpoints: [], segments: [] };

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
  stickyTarget = null,
  snapMask = {
    point: true,
    midpoint: true,
    intersection: true,
    segment: true,
    grid: true,
  },
}) => {
  if (!snapEnabled) {
    return { point, indicator: null };
  }

  const threshold = snapStrength / Math.max(zoom, 0.25);
  const stickyReleaseRadius = threshold * 1.6;
  const targets = collectTargets({ walls, areas, currentPoints });
  const cellSize = Math.max(threshold * 2, gridSize);

  if (stickyTarget) {
    const stickyDistance = distanceBetweenPoints(point, stickyTarget);
    if (stickyDistance <= stickyReleaseRadius) {
      return {
        point: { x: stickyTarget.x, y: stickyTarget.y },
        indicator: { x: stickyTarget.x, y: stickyTarget.y, type: stickyTarget.type },
        activeTarget: stickyTarget,
      };
    }
  }

  const endpointIndex = buildPointBucketIndex(targets.endpoints, cellSize);
  const midpointIndex = buildPointBucketIndex(targets.midpoints, cellSize);
  const segmentIndex = buildSegmentBucketIndex(targets.segments, cellSize);

  if (snapMask.point) {
    const endpointHit = findNearest(point, queryPointBuckets(endpointIndex, point, threshold, cellSize), threshold);
    if (endpointHit) {
      return {
        point: { x: endpointHit.x, y: endpointHit.y },
        indicator: { x: endpointHit.x, y: endpointHit.y, type: endpointHit.type },
        activeTarget: { x: endpointHit.x, y: endpointHit.y, type: endpointHit.type },
      };
    }
  }

  const nearbySegments = queryPointBuckets(segmentIndex, point, threshold, cellSize);

  if (snapMask.intersection) {
    let intersectionHit = null;
    for (let index = 0; index < nearbySegments.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < nearbySegments.length; compareIndex += 1) {
        const hit = lineIntersection(nearbySegments[index], nearbySegments[compareIndex]);
        if (!hit) continue;
        const distance = distanceBetweenPoints(point, hit);
        if (distance > threshold) continue;
        if (!intersectionHit || distance < intersectionHit.distance) {
          intersectionHit = { ...hit, distance };
        }
      }
    }

    if (intersectionHit) {
      return {
        point: { x: intersectionHit.x, y: intersectionHit.y },
        indicator: { x: intersectionHit.x, y: intersectionHit.y, type: intersectionHit.type },
        activeTarget: { x: intersectionHit.x, y: intersectionHit.y, type: intersectionHit.type },
      };
    }
  }

  if (snapMask.midpoint) {
    const midpointHit = findNearest(point, queryPointBuckets(midpointIndex, point, threshold, cellSize), threshold);
    if (midpointHit) {
      return {
        point: { x: midpointHit.x, y: midpointHit.y },
        indicator: { x: midpointHit.x, y: midpointHit.y, type: midpointHit.type },
        activeTarget: { x: midpointHit.x, y: midpointHit.y, type: midpointHit.type },
      };
    }
  }

  if (snapMask.segment) {
    let segmentHit = null;
    nearbySegments.forEach((segment) => {
      const projected = projectPointOnSegment(point, segment);
      if (!projected) return;
      const distance = distanceBetweenPoints(point, projected);
      if (distance > threshold) return;
      if (!segmentHit || distance < segmentHit.distance) {
        segmentHit = {
          x: projected.x,
          y: projected.y,
          distance,
          x1: segment.p1.x,
          y1: segment.p1.y,
          x2: segment.p2.x,
          y2: segment.p2.y,
          type: 'line-segment',
        };
      }
    });

    if (segmentHit) {
      return {
        point: { x: segmentHit.x, y: segmentHit.y },
        indicator: {
          x: segmentHit.x,
          y: segmentHit.y,
          x1: segmentHit.x1,
          y1: segmentHit.y1,
          x2: segmentHit.x2,
          y2: segmentHit.y2,
          type: segmentHit.type,
        },
        activeTarget: {
          x: segmentHit.x,
          y: segmentHit.y,
          type: segmentHit.type,
        },
      };
    }
  }

  const gridPoint = {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };

  const gridMoved = snapMask.grid && (gridPoint.x !== point.x || gridPoint.y !== point.y);
  return {
    point: gridMoved ? gridPoint : point,
    indicator: gridMoved ? { x: gridPoint.x, y: gridPoint.y, type: 'grid' } : null,
    activeTarget: gridMoved ? { x: gridPoint.x, y: gridPoint.y, type: 'grid' } : null,
  };
};
