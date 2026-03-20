import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, 
  Download, Save, Upload 
} from 'lucide-react';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const TopToolbar = () => {
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const {
    zoom, setZoom, setPanOffset, clearAll, undo, redo,
    walls, rooms, doors, windows, openings, history, historyIndex,
    exportJSON,
  } = useFloorPlanStore();

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 100, y: 100 });
  };

  const handleExportPNG = () => {
    const svg = document.querySelector('svg[data-floorplan-canvas="true"]');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = 'floorplan.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.download = 'floorplan.json';
    a.href = URL.createObjectURL(blob);
    a.click();
    setShowExportMenu(false);
  };

  const handleSave = () => {
    const data = exportJSON();
    localStorage.setItem('floorplan-save', data);
    alert('Saved!');
  };

  const handleLoad = () => {
    const data = localStorage.getItem('floorplan-save');
    if (data) {
      const parsed = JSON.parse(data);
      const loadedState = {
        walls: parsed.walls || [],
        rooms: parsed.rooms || [],
        doors: parsed.doors || [],
        windows: parsed.windows || [],
        openings: parsed.openings || [],
        landBoundary: parsed.landBoundary || null,
        outdoorElements: parsed.outdoorElements || [],
        filledAreas: parsed.filledAreas || [],
      };

      useFloorPlanStore.setState({
        ...loadedState,
        selectedId: null,
        selectedType: null,
        history: [loadedState],
        historyIndex: 0,
        isDrawingBoundary: false,
        currentBoundaryPoints: [],
        previewBoundaryPoints: [],
        isDrawingWall: false,
        currentWallPoints: [],
        previewWallPoints: [],
      });
      alert('Loaded!');
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <h1 className="text-lg font-bold text-gray-900">
          <span className="text-blue-600">2D</span> Floor Planner
        </h1>

        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
          {walls.length} walls • {rooms.length} rooms • {doors.length + windows.length} openings
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Save"
        >
          <Save size={16} />
        </button>
        <button
          onClick={handleLoad}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Load"
        >
          <Upload size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setZoom(zoom - 0.25)}
            className="p-1.5 hover:bg-white rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={15} className="text-gray-600" />
          </button>
          <span className="text-xs font-semibold text-gray-700 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.25)}
            className="p-1.5 hover:bg-white rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={15} className="text-gray-600" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 hover:bg-white rounded-lg transition-colors"
            title="Reset View"
          >
            <Maximize2 size={15} className="text-gray-600" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          onClick={() => { if (confirm('Clear all?')) clearAll(); }}
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
        >
          Clear
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Download size={15} />
            Export
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden w-40 z-50">
              <button
                onClick={handleExportPNG}
                className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                Export PNG
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                Export JSON
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopToolbar;
