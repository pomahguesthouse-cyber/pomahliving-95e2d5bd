import { MODULES } from '../features/builder/moduleConfig';
import useBuilderStore from '../features/builder/builderStore';
import { Plus, Eye, EyeOff, Trash2, RotateCw } from 'lucide-react';

const ModuleSidebar = () => {
  const modules = useBuilderStore((state) => state.modules);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const addModule = useBuilderStore((state) => state.addModule);
  const rotateModule = useBuilderStore((state) => state.rotateModule);
  const removeModule = useBuilderStore((state) => state.removeModule);
  const toggleModuleVisibility = useBuilderStore((state) => state.toggleModuleVisibility);

  const selectedModule = modules.find((m) => m.id === selectedId);

  const handleAddModule = (moduleConfig) => {
    addModule(moduleConfig);
  };

  return (
    <div className="w-56 bg-[#1a1a2e] border-r border-[#2d2d42] flex flex-col">
      <div className="p-3 border-b border-[#2d2d42]">
        <h2 className="text-sm font-semibold text-white mb-1">Modules</h2>
        <p className="text-[10px] text-gray-500">
          {modules.length}/20 placed
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {MODULES.map((module) => (
          <button
            key={module.type}
            onClick={() => handleAddModule(module)}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-[#232338] hover:bg-[#2d2d42] transition-colors group"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-base"
              style={{ backgroundColor: module.color + '25' }}
            >
              {module.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-gray-200">{module.label}</p>
              <p className="text-[10px] text-gray-500">
                {module.defaultW}×{module.defaultL}m
              </p>
            </div>
            <Plus
              size={14}
              className="text-gray-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all"
            />
          </button>
        ))}
      </div>

      {selectedModule && (
        <div className="p-2 border-t border-[#2d2d42] space-y-1">
          <div className="flex items-center gap-2 p-2 bg-[#232338] rounded-lg">
            <div
              className="w-6 h-6 rounded text-xs flex items-center justify-center"
              style={{ backgroundColor: selectedModule.color + '25' }}
            >
              {MODULES.find((m) => m.type === selectedModule.type)?.icon}
            </div>
            <div className="flex-1">
              <p className="text-xs text-white font-medium">{selectedModule.label}</p>
              <p className="text-[10px] text-gray-500">
                {selectedModule.w}×{selectedModule.l}m
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => rotateModule(selectedId)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#232338] hover:bg-[#2d2d42] text-gray-400 hover:text-cyan-400 text-[10px] rounded transition-colors"
            >
              <RotateCw size={10} />
              Rotate
            </button>
            <button
              onClick={() => toggleModuleVisibility(selectedId)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#232338] hover:bg-[#2d2d42] text-gray-400 hover:text-white text-[10px] rounded transition-colors"
            >
              {selectedModule.visible ? <Eye size={10} /> : <EyeOff size={10} />}
              {selectedModule.visible ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            onClick={() => removeModule(selectedId)}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] rounded transition-colors"
          >
            <Trash2 size={10} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ModuleSidebar;
