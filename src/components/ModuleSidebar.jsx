import { MODULES } from '../features/builder/moduleConfig';
import useBuilderStore from '../features/builder/builderStore';
import { RotateCw, Plus } from 'lucide-react';

const ModuleSidebar = () => {
  const modules = useBuilderStore((state) => state.modules);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const addModule = useBuilderStore((state) => state.addModule);
  const rotateModule = useBuilderStore((state) => state.rotateModule);
  const removeModule = useBuilderStore((state) => state.removeModule);

  const selectedModule = modules.find((m) => m.id === selectedId);

  const handleAddModule = (moduleConfig) => {
    addModule(moduleConfig);
  };

  const handleRotate = () => {
    if (selectedId) {
      rotateModule(selectedId);
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      removeModule(selectedId);
    }
  };

  return (
    <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Modul</h2>
        <p className="text-xs text-slate-400 mt-1">
          {modules.length}/20 modul
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {MODULES.map((module) => (
          <button
            key={module.type}
            onClick={() => handleAddModule(module)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-left group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: module.color + '30' }}
            >
              {module.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{module.label}</p>
              <p className="text-xs text-slate-400">
                {module.defaultW}m x {module.defaultL}m
              </p>
            </div>
            <Plus
              size={16}
              className="text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </button>
        ))}
      </div>

      {selectedModule && (
        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="text-sm text-white font-medium">
            {selectedModule.label} terpilih
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRotate}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
            >
              <RotateCw size={14} />
              Rotasi
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleSidebar;
