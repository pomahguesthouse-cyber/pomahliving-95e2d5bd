import { useNavigate } from 'react-router-dom';
import useBuilderStore from '../features/builder/builderStore';

const Topbar = () => {
  const navigate = useNavigate();
  const landSize = useBuilderStore((state) => state.landSize);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const selectedModule = useBuilderStore((state) => 
    state.modules.find((m) => m.id === state.selectedId)
  );
  const rotateModule = useBuilderStore((state) => state.rotateModule);
  const resizeModule = useBuilderStore((state) => state.resizeModule);

  const handleResize = (dimension, delta) => {
    if (!selectedId || !selectedModule) return;
    
    const newW = dimension === 'w' 
      ? Math.max(2, selectedModule.w + delta)
      : selectedModule.w;
    const newL = dimension === 'l'
      ? Math.max(2, selectedModule.l + delta)
      : selectedModule.l;
    
    resizeModule(selectedId, newW, newL);
  };

  return (
    <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="font-display text-xl tracking-tight text-white"
        >
          pomah<span className="text-cyan-400">living</span>
        </button>
        <span className="text-slate-500 text-sm">|</span>
        <span className="text-sm text-slate-400">
          Tanah: {landSize.w}m x {landSize.l}m
        </span>
      </div>

      <div className="flex items-center gap-2">
        {selectedModule && (
          <>
            <span className="text-sm text-slate-300 mr-2">
              {selectedModule.label}
            </span>
            <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => handleResize('w', -1)}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
              >
                -W
              </button>
              <span className="px-2 text-xs text-white min-w-[50px] text-center">
                {selectedModule.w}m
              </span>
              <button
                onClick={() => handleResize('w', 1)}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
              >
                +W
              </button>
              <span className="w-px h-4 bg-slate-500" />
              <button
                onClick={() => handleResize('l', -1)}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
              >
                -L
              </button>
              <span className="px-2 text-xs text-white min-w-[50px] text-center">
                {selectedModule.l}m
              </span>
              <button
                onClick={() => handleResize('l', 1)}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
              >
                +L
              </button>
            </div>
            <button
              onClick={() => rotateModule(selectedId)}
              className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              Rotate
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Ganti Ukuran Tanah
        </button>
      </div>
    </header>
  );
};

export default Topbar;
