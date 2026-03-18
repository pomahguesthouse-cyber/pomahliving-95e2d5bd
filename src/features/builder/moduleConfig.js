export const MODULES = [
  {
    type: 'bedroom',
    label: 'Kamar Tidur',
    defaultW: 3,
    defaultL: 3,
    price: 25000000,
    color: '#22c55e',
    icon: '🛏️',
  },
  {
    type: 'bathroom',
    label: 'Kamar Mandi',
    defaultW: 2,
    defaultL: 1.5,
    price: 15000000,
    color: '#22d3ee',
    icon: '🚿',
  },
  {
    type: 'kitchen',
    label: 'Dapur',
    defaultW: 3,
    defaultL: 2,
    price: 20000000,
    color: '#f97316',
    icon: '🍳',
  },
  {
    type: 'living',
    label: 'Ruang Tamu',
    defaultW: 4,
    defaultL: 3,
    price: 35000000,
    color: '#6366f1',
    icon: '🛋️',
  },
  {
    type: 'garage',
    label: 'Garasi',
    defaultW: 3,
    defaultL: 5,
    price: 30000000,
    color: '#a855f7',
    icon: '🚗',
  },
  {
    type: 'garden',
    label: 'Taman',
    defaultW: 2,
    defaultL: 2,
    price: 10000000,
    color: '#84cc16',
    icon: '🌿',
  },
  {
    type: 'dining',
    label: 'Ruang Makan',
    defaultW: 3,
    defaultL: 3,
    price: 28000000,
    color: '#ec4899',
    icon: '🍽️',
  },
  {
    type: 'office',
    label: 'Ruang Kerja',
    defaultW: 2.5,
    defaultL: 2.5,
    price: 22000000,
    color: '#14b8a6',
    icon: '💼',
  },
];

export const getModuleByType = (type) => MODULES.find((m) => m.type === type);

export const detectRoomType = (area, aspectRatio) => {
  if (area < 3) return 'bathroom';
  if (area < 8) return 'bathroom';
  if (area > 20 && aspectRatio > 1.2) return 'living';
  if (aspectRatio < 1.5 && area < 12) return 'bedroom';
  if (aspectRatio > 1.5) return 'living';
  return 'room';
};
