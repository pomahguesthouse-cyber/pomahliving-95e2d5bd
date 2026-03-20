export const getLineLengthPx = ({ x1, y1, x2, y2 }) => Math.hypot(x2 - x1, y2 - y1);

export const getLineAngleDeg = ({ x1, y1, x2, y2 }) => {
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  return Number(angle.toFixed(2));
};

export const buildLineRecord = (line) => ({
  ...line,
  length: getLineLengthPx(line),
  angle: getLineAngleDeg(line),
  type: line.type || 'area-line',
});

export const quantizeAnglePoint = (origin, point, angleStepDeg = 45) => {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const radius = Math.hypot(dx, dy);

  if (radius === 0) {
    return { x: origin.x, y: origin.y, angleDeg: 0 };
  }

  const angleRad = Math.atan2(dy, dx);
  const stepRad = (angleStepDeg * Math.PI) / 180;
  const lockedRad = Math.round(angleRad / stepRad) * stepRad;

  return {
    x: origin.x + Math.cos(lockedRad) * radius,
    y: origin.y + Math.sin(lockedRad) * radius,
    angleDeg: (lockedRad * 180) / Math.PI,
  };
};

export const midpoint = (p1, p2) => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
});

export const distanceBetweenPoints = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);
