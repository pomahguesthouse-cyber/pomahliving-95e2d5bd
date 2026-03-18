import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Download,
  RotateCw,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  MousePointer2,
  Move,
  Info,
} from 'lucide-react';
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
  const removeModule = useBuilderStore((state) => state.removeModule);
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const canUndo = useBuilderStore((state) => state.canUndo);
  const canRedo = useBuilderStore((state) => state.canRedo);
  const saveDesign = useBuilderStore((state) => state.saveDesign);
  const loadDesign = useBuilderStore((state) => state.loadDesign);

  const handleResize = (dimension, delta) => {
    if (!selectedId || !selectedModule) return;
    const newW = dimension === 'w' ? Math.max(2, selectedModule.w + delta) : selectedModule.w;
    const newL = dimension === 'l' ? Math.max(2, selectedModule.l + delta) : selectedModule.l;
    resizeModule(selectedId, newW, newL);
  };

  const handleSave = () => {
    const saved = saveDesign();
    alert(`Design saved!\n${saved.modules.length} modules`);
  };

  const handleLoad = () => {
    const loaded = loadDesign();
    if (loaded) {
      alert(`Design loaded!\n${loaded.modules.length} modules`);
    } else {
      alert('No saved design found');
    }
  };

  const handleExport = () => {
    navigate('/review');
  };

  return (
    <header className="h-11 bg-[#1a1a2e] border-b border-[#2d2d42] flex items-center justify-between px-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#2d2d42] rounded transition-colors"
        >
          <span className="text-cyan-400">pomah</span>living
        </button>
        
        <div className="w-px h-5 bg-[#3d3d5c] mx-2"></div>
        
        <ToolButton icon={Undo2} onClick={undo} disabled={!canUndo()} tooltip="Undo (Ctrl+Z)" />
        <ToolButton icon={Redo2} onClick={redo} disabled={!canRedo()} tooltip="Redo (Ctrl+Y)" />
        
        <div className="w-px h-5 bg-[#3d3d5c] mx-2"></div>
        
        <ToolButton icon={Save} onClick={handleSave} tooltip="Save" />
        <ToolButton icon={FolderOpen} onClick={handleLoad} tooltip="Open" />
        <ToolButton icon={Download} onClick={handleExport} tooltip="Export" />
        
        <div className="w-px h-5 bg-[#3d3d5c] mx-2"></div>
        
        <ToolButton icon={MousePointer2} tooltip="Select (V)" active />
        <ToolButton icon={Move} tooltip="Move (M)" />
        <ToolButton icon={RotateCcw} tooltip="Rotate (R)" />
        
        <div className="w-px h-5 bg-[#3d3d5c] mx-2"></div>
        
        <ToolButton icon={ZoomIn} tooltip="Zoom In" />
        <ToolButton icon={ZoomOut} tooltip="Zoom Out" />
        <ToolButton icon={Maximize2} tooltip="Fit All" />
        <ToolButton icon={Grid3X3} tooltip="Toggle Grid" active />
      </div>

      <div className="flex items-center gap-2">
        {selectedModule && (
          <div className="flex items-center gap-1 bg-[#2d2d42] rounded px-2 py-1">
            <Info size={12} className="text-cyan-400 mr-1" />
            <span className="text-xs text-gray-300 font-medium mr-2">{selectedModule.label}</span>
            
            <div className="flex items-center gap-0.5 bg-[#1a1a2e] rounded px-1.5 py-0.5">
              <button
                onClick={() => handleResize('w', -1)}
                className="p-0.5 hover:bg-[#2d2d42] rounded text-gray-400 hover:text-white transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs text-white w-7 text-center font-mono">{selectedModule.w}m</span>
              <button
                onClick={() => handleResize('w', 1)}
                className="p-0.5 hover:bg-[#2d2d42] rounded text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
            
            <span className="text-gray-600 mx-0.5">×</span>
            
            <div className="flex items-center gap-0.5 bg-[#1a1a2e] rounded px-1.5 py-0.5">
              <button
                onClick={() => handleResize('l', -1)}
                className="p-0.5 hover:bg-[#2d2d42] rounded text-gray-400 hover:text-white transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs text-white w-7 text-center font-mono">{selectedModule.l}m</span>
              <button
                onClick={() => handleResize('l', 1)}
                className="p-0.5 hover:bg-[#2d2d42] rounded text-gray-400 hover:text-white transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
            
            <div className="w-px h-4 bg-[#3d3d5c] mx-1"></div>
            
            <button
              onClick={() => rotateModule(selectedId)}
              className="p-1 hover:bg-[#3d3d5c] rounded text-gray-400 hover:text-cyan-400 transition-colors"
              title="Rotate 90°"
            >
              <RotateCw size={12} />
            </button>
            
            <button
              onClick={() => removeModule(selectedId)}
              className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
              title="Delete (Del)"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
        
        <div className="w-px h-5 bg-[#3d3d5c] mx-2"></div>
        
        <span className="text-xs text-gray-500 bg-[#1a1a2e] px-2 py-1 rounded border border-[#2d2d42] font-mono">
          {landSize.w}×{landSize.l}m
        </span>
      </div>
    </header>
  );
};

const ToolButton = ({ icon: Icon, onClick, disabled, tooltip, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`
      p-1.5 rounded transition-colors
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#2d2d42] cursor-pointer'}
      ${active ? 'bg-[#2d2d42] text-cyan-400' : 'text-gray-400 hover:text-white'}
    `}
  >
    <Icon size={15} />
  </button>
);

export default Topbar;
