import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Upload, 
  Undo2, 
  Redo2,
  Save,
  FolderOpen,
  Grid3X3,
  Menu,
} from 'lucide-react';
import ToolSidebar from '@/components/floorplan/ToolSidebar';
import FloorPlanCanvas from '@/components/floorplan/FloorPlanCanvas';
import PropertiesPanel from '@/components/floorplan/PropertiesPanel';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const FloorPlan = () => {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProps, setShowProps] = useState(true);
  
  const {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    walls,
    rooms,
    openings,
    undo,
    redo,
    canUndo,
    canRedo,
    clearAll,
    exportToJSON,
    importFromJSON,
    activeTool,
  } = useFloorPlanStore();

  useEffect(() => {
    setPanOffset({ x: 50, y: 50 });
  }, [setPanOffset]);

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 50, y: 50 });
  };

  const handleExportJSON = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floorplan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.clientWidth * 2;
      canvas.height = svg.clientHeight * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `floorplan-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const success = importFromJSON(event.target.result);
      if (!success) {
        alert('Failed to import file. Please check the JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveToStorage = () => {
    const json = exportToJSON();
    localStorage.setItem('floorplan-save', json);
    alert('Design saved!');
  };

  const handleLoadFromStorage = () => {
    const saved = localStorage.getItem('floorplan-save');
    if (saved) {
      const success = importFromJSON(saved);
      if (success) {
        alert('Design loaded!');
      }
    } else {
      alert('No saved design found.');
    }
  };

  const getToolHint = () => {
    switch (activeTool) {
      case 'select': return 'Click to select • Drag to move';
      case 'room': return 'Click + drag to create room';
      case 'wall': return 'Click start point, then end point';
      case 'door': return 'Click on a wall to place door';
      case 'window': return 'Click on a wall to place window';
      default: return '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-200" />
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={18} className="text-gray-600" />
            </button>
            
            <h1 className="text-lg font-semibold text-gray-900">
              <span className="text-cyan-500">2D</span> Floor Planner
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-2 ml-4">
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              {walls.length} walls
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              {rooms.length} rooms
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              {openings.length} openings
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoom(zoom - 0.25)}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} className="text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 w-14 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(zoom + 0.25)}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} className="text-gray-600" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Reset View"
            >
              <Maximize2 size={16} className="text-gray-600" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
            title="Undo"
          >
            <Undo2 size={16} className="text-gray-600" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
            title="Redo"
          >
            <Redo2 size={16} className="text-gray-600" />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <button
            onClick={handleSaveToStorage}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Save"
          >
            <Save size={16} className="text-gray-600" />
          </button>
          <button
            onClick={handleLoadFromStorage}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Load"
          >
            <FolderOpen size={16} className="text-gray-600" />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <div className="relative">
            <button
              onClick={() => document.getElementById('import-json').click()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Import JSON"
            >
              <Upload size={16} className="text-gray-600" />
            </button>
            <input
              type="file"
              id="import-json"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
              ref={fileInputRef}
            />
          </div>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            JSON
          </button>

          <button
            onClick={handleExportPNG}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            PNG
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all elements?')) clearAll();
            }}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ToolSidebar />
        
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          <svg
            ref={svgRef}
            className="w-full h-full"
            onWheel={(e) => {
              e.preventDefault();
              setZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1));
            }}
          >
            <FloorPlanCanvas svgRef={svgRef} />
          </svg>

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-3">
            <span className="text-xs text-gray-500">{getToolHint()}</span>
            <div className="w-px h-4 bg-gray-200" />
            <span className="text-[10px] text-gray-400">
              Scroll to zoom • Middle-click to pan
            </span>
          </div>

          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-3">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Shortcuts</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px] text-gray-500">
              <span><kbd className="px-1 bg-gray-100 rounded">V</kbd> Select</span>
              <span><kbd className="px-1 bg-gray-100 rounded">R</kbd> Room</span>
              <span><kbd className="px-1 bg-gray-100 rounded">W</kbd> Wall</span>
              <span><kbd className="px-1 bg-gray-100 rounded">D</kbd> Door</span>
              <span><kbd className="px-1 bg-gray-100 rounded">N</kbd> Window</span>
              <span><kbd className="px-1 bg-gray-100 rounded">Del</kbd> Delete</span>
            </div>
          </div>
        </div>

        <PropertiesPanel />
      </div>
    </div>
  );
};

export default FloorPlan;
