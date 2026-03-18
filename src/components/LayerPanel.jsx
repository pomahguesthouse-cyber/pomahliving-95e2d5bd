import { Eye, EyeOff, Trash2 } from 'lucide-react';
import useBuilderStore from '../features/builder/builderStore';
import { MODULES } from '../features/builder/moduleConfig';

const LayerPanel = () => {
  const modules = useBuilderStore((state) => state.modules);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const setSelected = useBuilderStore((state) => state.setSelected);
  const toggleModuleVisibility = useBuilderStore((state) => state.toggleModuleVisibility);
  const removeModule = useBuilderStore((state) => state.removeModule);

  const getModuleIcon = (type) => {
    const mod = MODULES.find((m) => m.type === type);
    return mod?.icon || '📦';
  };

  const getModuleColor = (type) => {
    const mod = MODULES.find((m) => m.type === type);
    return mod?.color || '#666';
  };

  return (
    <div className="w-48 bg-[#1a1a2e] border-r border-[#2d2d42] flex flex-col h-full">
      <div className="p-2.5 border-b border-[#2d2d42]">
        <h3 className="text-xs font-semibold text-white">Layers</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {modules.filter(m => m.visible).length}/{modules.length} visible
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {modules.length === 0 ? (
          <div className="p-4 text-center text-gray-600 text-xs">
            No modules
          </div>
        ) : (
          <div className="p-1">
            {[...modules].reverse().map((module) => {
              const isSelected = module.id === selectedId;
              return (
                <div
                  key={module.id}
                  onClick={() => setSelected(module.id)}
                  className={`
                    flex items-center gap-2 p-2 rounded-lg cursor-pointer mb-0.5
                    transition-colors
                    ${isSelected
                      ? 'bg-cyan-500/20 border-l-2 border-cyan-400'
                      : 'hover:bg-[#232338] border-l-2 border-transparent'
                    }
                  `}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModuleVisibility(module.id);
                    }}
                    className="p-0.5 hover:bg-[#2d2d42] rounded transition-colors"
                  >
                    {module.visible ? (
                      <Eye size={12} className="text-gray-500" />
                    ) : (
                      <EyeOff size={12} className="text-gray-700" />
                    )}
                  </button>

                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
                    style={{ 
                      backgroundColor: module.visible ? getModuleColor(module.type) + '30' : '#1a1a2e',
                      opacity: module.visible ? 1 : 0.5
                    }}
                  >
                    <span>{getModuleIcon(module.type)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] truncate ${module.visible ? 'text-gray-200' : 'text-gray-600'}`}>
                      {module.label}
                    </p>
                    <p className={`text-[9px] ${module.visible ? 'text-gray-600' : 'text-gray-700'}`}>
                      {module.w}×{module.l}m
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeModule(module.id);
                    }}
                    className="p-0.5 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={10} className="text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
