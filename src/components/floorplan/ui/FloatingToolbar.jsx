import { memo } from 'react';
import { Type, Ruler, Trash2, MapPin } from 'lucide-react';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const FloatingToolbar = memo(({ x, y, selectedId, selectedType }) => {
  const { deleteItem, showText, setShowText, showDimensions, setShowDimensions, showLandDimensions, setShowLandDimensions } = useFloorPlanStore();

  return (
    <div
      className="absolute z-50 flex items-center gap-0.5 bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 p-1 pointer-events-auto"
      style={{ left: x, top: Math.max(8, y), transform: 'translateX(-50%)' }}
    >
      <button
        onClick={() => setShowText(!showText)}
        className={`p-1.5 rounded transition-colors ${showText ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
        title="Toggle Text"
      >
        <Type size={13} />
      </button>
      <button
        onClick={() => setShowDimensions(!showDimensions)}
        className={`p-1.5 rounded transition-colors ${showDimensions ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
        title="Toggle Dimension"
      >
        <Ruler size={13} />
      </button>
      {selectedType === 'land-boundary' && (
        <button
          onClick={() => setShowLandDimensions(!showLandDimensions)}
          className={`p-1.5 rounded transition-colors ${showLandDimensions ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
          title="Toggle Land Dimensions"
        >
          <MapPin size={13} />
        </button>
      )}
      <div className="w-px h-4 bg-gray-200 mx-0.5" />
      <button
        onClick={() => deleteItem(selectedId)}
        className="p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        title="Delete"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
});

FloatingToolbar.displayName = 'FloatingToolbar';

export default FloatingToolbar;
