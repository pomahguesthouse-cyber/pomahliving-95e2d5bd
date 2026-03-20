import { distanceBetweenPoints, quantizeAnglePoint } from './lineGeometry';

export const EPSILON = 0.35;

export const normalizeAngle = (angleDeg) => {
  let angle = angleDeg % 360;
  if (angle < -180) angle += 360;
  if (angle > 180) angle -= 360;
  return angle;
};

export const stabilizePoint = (previousPoint, nextPoint, epsilon = EPSILON) => {
  if (!previousPoint) return nextPoint;
  return distanceBetweenPoints(previousPoint, nextPoint) <= epsilon ? previousPoint : nextPoint;
};

export const applyAngleConstraint = ({
  basePoint,
  rawPoint,
  shiftLock = false,
  autoOrthoThreshold = 6,
}) => {
  if (!basePoint) {
    return { point: rawPoint, angleDeg: 0, mode: null };
  }

  const dx = rawPoint.x - basePoint.x;
  const dy = rawPoint.y - basePoint.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (shiftLock) {
    const locked = quantizeAnglePoint(basePoint, rawPoint, 45);
    return {
      point: { x: locked.x, y: locked.y },
      angleDeg: normalizeAngle(locked.angleDeg),
      mode: 'shift-lock',
    };
  }

  if (absDx <= autoOrthoThreshold || absDy <= autoOrthoThreshold) {
    if (absDx > absDy) {
      return {
        point: { x: rawPoint.x, y: basePoint.y },
        angleDeg: 0,
        mode: 'auto-ortho',
      };
    }

    return {
      point: { x: basePoint.x, y: rawPoint.y },
      angleDeg: 90,
      mode: 'auto-ortho',
    };
  }

  return {
    point: rawPoint,
    angleDeg: normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI),
    mode: null,
  };
};
