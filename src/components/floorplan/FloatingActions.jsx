import { Type, Ruler, Trash2 } from 'lucide-react';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const FloatingActions = ({ x, y, selectedId }) => {
  const { deleteItem, showText, setShowText, showDimensions, setShowDimensions } = useFloorPlanStore();

  return (
    <div
      className="absolute z-50 flex items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-200 px-2 py-1.5 pointer-events-auto"
      style={{ left: x, top: Math.max(8, y), transform: 'translateX(-50%)' }}
    >
      <button
        onClick={() => setShowText(!showText)}
        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${showText ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
        title="Toggle Text"
      >
        <Type size={14} />
        <span className="text-[10px] font-medium">Toggle Text</span>
      </button>
      <button
        onClick={() => setShowDimensions(!showDimensions)}
        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${showDimensions ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
        title="Toggle Ukuran"
      >
        <Ruler size={14} />
        <span className="text-[10px] font-medium">Toggle Ukuran</span>
      </button>
      <div className="w-px h-5 bg-gray-200" />
      <button
        onClick={() => deleteItem(selectedId)}
        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 flex items-center gap-1 transition-colors"
        title="Hapus Item"
      >
        <Trash2 size={14} />
        <span className="text-[10px] font-medium">Hapus Item</span>
      </button>
    </div>
  );
};

export default FloatingActions;
