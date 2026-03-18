import useBuilderStore from '../features/builder/builderStore';

const MeasurementOverlay = () => {
  const selectedId = useBuilderStore((state) => state.selectedId);
  const modules = useBuilderStore((state) => state.modules);
  const selectedModule = modules.find((m) => m.id === selectedId);

  if (!selectedModule) return null;

  const area = selectedModule.w * selectedModule.l;

  return (
    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-[#1a1a2e]/95 backdrop-blur border border-[#2d2d42] rounded-lg px-3 py-1.5 shadow-lg">
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 bg-cyan-400"></div>
          <span className="text-gray-500">W:</span>
          <span className="text-white font-mono font-medium">{selectedModule.w}m</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-5 bg-cyan-400"></div>
          <span className="text-gray-500">L:</span>
          <span className="text-white font-mono font-medium">{selectedModule.l}m</span>
        </div>
        <div className="w-px h-4 bg-[#3d3d5c]"></div>
        <div>
          <span className="text-gray-500">Area:</span>
          <span className="text-white font-mono font-medium ml-1">{area}m²</span>
        </div>
        <div className="w-px h-4 bg-[#3d3d5c]"></div>
        <div>
          <span className="text-gray-500">Pos:</span>
          <span className="text-white font-mono font-medium ml-1">
            ({selectedModule.x.toFixed(1)}, {selectedModule.z.toFixed(1)})
          </span>
        </div>
        {selectedModule.rotation !== 0 && (
          <>
            <div className="w-px h-4 bg-[#3d3d5c]"></div>
            <div>
              <span className="text-gray-500">Rot:</span>
              <span className="text-cyan-400 font-mono font-medium ml-1">90°</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MeasurementOverlay;
