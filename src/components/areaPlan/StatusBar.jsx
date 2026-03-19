import useAreaPlanStore from '@/features/areaPlan/areaPlanStore';
import { formatArea } from '@/features/areaPlan/geometryUtils';

const StatusBar = () => {
  const { areas, isDrawing, selectedAreaId, zoom } = useAreaPlanStore();
  
  const totalArea = areas.reduce((sum, area) => sum + area.areaSize, 0);
  const selectedArea = areas.find((a) => a.id === selectedAreaId);
  
  return (
    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
      <div className="flex items-center gap-6 bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="font-medium">Areas:</span>
          <span className="font-mono">{areas.length}</span>
        </div>
        
        <div className="w-px h-4 bg-gray-200" />
        
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="font-medium">Total:</span>
          <span className="font-mono">{formatArea(totalArea)}</span>
        </div>
        
        {selectedArea && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">Selected:</span>
              <span className="font-mono">{selectedArea.label}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4 bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 px-4 py-2">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {[
            ['A', 'Draw'],
            ['V', 'Select'],
            ['Del', 'Delete'],
            ['Ctrl+Z', 'Undo'],
            ['Esc', 'Cancel'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-[10px] font-medium">
                {key}
              </kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
