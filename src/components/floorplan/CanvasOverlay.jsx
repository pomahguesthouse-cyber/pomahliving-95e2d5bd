import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const CanvasOverlay = () => {
  const aiSuggestionOpenings = useFloorPlanStore((state) => state.aiSuggestionOpenings);

  return (
    <>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 px-5 py-2.5 flex items-center gap-5">
        {[
          ['V', 'Select'], ['R', 'Room'], ['W', 'Wall'],
          ['D', 'Door'], ['N', 'Window'], ['Del', 'Delete'],
          ['Dbl', 'Finish Wall'], ['Enter', 'Finish'], ['Esc', 'Cancel'],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-gray-600 text-[10px] font-semibold">
              {key}
            </kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {aiSuggestionOpenings.length > 0 && (
        <div className="absolute top-4 right-4 max-w-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl shadow-sm px-4 py-3 text-sm">
          <p className="font-medium">Saran opening AI</p>
          <p className="mt-1 text-xs leading-5">
            {aiSuggestionOpenings.length} opening tidak diterapkan otomatis karena confidence rendah. Review manual disarankan.
          </p>
        </div>
      )}
    </>
  );
};

export default CanvasOverlay;
