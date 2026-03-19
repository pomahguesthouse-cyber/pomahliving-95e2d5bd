import { useState } from 'react';
import { 
  MousePointer2, Pencil, Undo2, Redo2, Trash2, 
  Download, Upload, Grid3X3, ZoomIn, ZoomOut,
  Copy, MoreVertical, ChevronDown
} from 'lucide-react';
import useAreaPlanStore from '@/features/areaPlan/areaPlanStore';

const ToolbarButton = ({ icon: Icon, label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`
      p-2 rounded-lg transition-all
      ${active
        ? 'bg-blue-500 text-white shadow-md'
        : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }
    `}
  >
    <Icon size={18} />
  </button>
);

const AreaToolbar = () => {
  const {
    selectedAreaId,
    areas,
    isDrawing,
    gridVisible,
    snapToGrid,
    undo,
    redo,
    history,
    historyIndex,
    startDrawing,
    cancelDrawing,
    deleteArea,
    setGridVisible,
    setSnapToGrid,
    setZoom,
    zoom,
    exportJSON,
    clearAll,
  } = useAreaPlanStore();
  
  const [showExport, setShowExport] = useState(false);
  
  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplan.json';
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };
  
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const success = useAreaPlanStore.getState().importJSON(event.target.result);
      if (!success) {
        alert('Failed to import file. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
      <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2">
        <ToolbarButton
          icon={MousePointer2}
          label="Select (V)"
          onClick={() => { if (isDrawing) cancelDrawing(); }}
        />
        
        <div className="w-px h-6 bg-gray-200" />
        
        <ToolbarButton
          icon={Pencil}
          label="Draw Area (A)"
          active={isDrawing}
          onClick={() => {
            if (isDrawing) {
              cancelDrawing();
            } else {
              startDrawing();
            }
          }}
        />
        
        <div className="w-px h-6 bg-gray-200" />
        
        <ToolbarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={undo}
        />
        
        <ToolbarButton
          icon={Redo2}
          label="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={redo}
        />
      </div>
      
      <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2">
        <ToolbarButton
          icon={Grid3X3}
          label="Toggle Grid"
          active={gridVisible}
          onClick={() => setGridVisible(!gridVisible)}
        />
        
        <div className="relative">
          <button
            onClick={() => setShowExport(!showExport)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
            title="Export/Import"
          >
            <MoreVertical size={18} />
          </button>
          
          {showExport && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-50">
              <button
                onClick={handleExport}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Download size={14} />
                Export JSON
              </button>
              <label className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
                <Upload size={14} />
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <div className="h-px bg-gray-200 my-2" />
              <button
                onClick={() => {
                  if (confirm('Clear all areas?')) {
                    clearAll();
                  }
                  setShowExport(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
      
      {selectedAreaId && (
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2">
          <button
            onClick={() => useAreaPlanStore.getState().duplicateArea(selectedAreaId)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-200" />
          
          <button
            onClick={() => deleteArea(selectedAreaId)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
            title="Delete (Del)"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1">
        <button
          onClick={() => setZoom(zoom - 0.25)}
          className="p-1 rounded hover:bg-gray-100 transition-all"
          disabled={zoom <= 0.25}
        >
          <ZoomOut size={16} className={zoom <= 0.25 ? 'text-gray-300' : 'text-gray-600'} />
        </button>
        <span className="text-xs text-gray-600 font-medium w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom + 0.25)}
          className="p-1 rounded hover:bg-gray-100 transition-all"
          disabled={zoom >= 4}
        >
          <ZoomIn size={16} className={zoom >= 4 ? 'text-gray-300' : 'text-gray-600'} />
        </button>
      </div>
    </div>
  );
};

export default AreaToolbar;
