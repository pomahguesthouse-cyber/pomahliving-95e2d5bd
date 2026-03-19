const CanvasOverlay = () => {
  return (
    <>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 px-5 py-2.5 flex items-center gap-5">
        {[
          ['V', 'Select'], ['R', 'Room'], ['W', 'Wall'], ['F', 'Poly Wall'],
          ['D', 'Door'], ['N', 'Window'], ['Del', 'Delete'],
          ['Dbl', 'Finish Poly'], ['Enter', 'Finish'], ['Esc', 'Cancel'],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-gray-600 text-[10px] font-semibold">
              {key}
            </kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default CanvasOverlay;
