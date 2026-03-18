export const snapToGrid = (value, gridSize = 1) => {
  return Math.round(value / gridSize) * gridSize;
};

export const clampToGrid = (value, min, max, gridSize = 1) => {
  const snapped = snapToGrid(value, gridSize);
  return Math.max(min, Math.min(max, snapped));
};

export const positionToGrid = (x, z, module, landSize) => {
  const halfW = module.w / 2;
  const halfL = module.l / 2;
  
  const minX = halfW;
  const maxX = landSize.w - halfW;
  const minZ = halfL;
  const maxZ = landSize.l - halfL;
  
  const snappedX = snapToGrid(x);
  const snappedZ = snapToGrid(z);
  
  return {
    x: clampToGrid(snappedX, minX, maxX),
    z: clampToGrid(snappedZ, minZ, maxZ),
  };
};
