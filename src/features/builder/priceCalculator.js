export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateModulePrice = (module) => {
  const area = module.w * module.l;
  const basePrice = module.price;
  return basePrice;
};

export const calculateTotalPrice = (modules) => {
  return modules.reduce((total, module) => {
    return total + calculateModulePrice(module);
  }, 0);
};

export const calculateTotalArea = (modules) => {
  return modules.reduce((total, module) => {
    return total + (module.w * module.l);
  }, 0);
};

export const getPriceBreakdown = (modules) => {
  return modules.map((module) => ({
    id: module.id,
    label: module.label,
    size: `${module.w}m x ${module.l}m`,
    area: module.w * module.l,
    price: calculateModulePrice(module),
  }));
};
