export const isOverlapping = (a, b) => {
  if (a.id === b.id) return false;
  
  const aLeft = a.x;
  const aRight = a.x + a.w;
  const aTop = a.z;
  const aBottom = a.z + a.l;
  
  const bLeft = b.x;
  const bRight = b.x + b.w;
  const bTop = b.z;
  const bBottom = b.z + b.l;
  
  return !(aRight <= bLeft || bRight <= aLeft || aBottom <= bTop || bBottom <= aTop);
};

export const checkCollisions = (module, allModules) => {
  return allModules.some((other) => isOverlapping(module, other));
};

export const isInsideLand = (module, landSize) => {
  const halfW = module.w / 2;
  const halfL = module.l / 2;
  
  const left = module.x - halfW;
  const right = module.x + halfW;
  const top = module.z - halfL;
  const bottom = module.z + halfL;
  
  return (
    left >= 0 &&
    right <= landSize.w &&
    top >= 0 &&
    bottom <= landSize.l
  );
};

export const canPlaceModule = (module, allModules, landSize) => {
  if (!isInsideLand(module, landSize)) return false;
  if (checkCollisions(module, allModules)) return false;
  return true;
};
