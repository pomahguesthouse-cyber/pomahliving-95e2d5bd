import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Download, Undo2, Redo2, FileImage, FileJson } from 'lucide-react';
import ToolSidebar from '@/components/floorplan/ToolSidebar';
import FloorPlanCanvas from '@/components/floorplan/FloorPlanCanvas';
import PropertiesPanel from '@/components/floorplan/PropertiesPanel';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const FloorPlan = () => {
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const {
    zoom, setZoom, setPanOffset, clearAll, undo, redo,
    walls, rooms, doors, windows, history, historyIndex, exportJSON,
  } = useFloorPlanStore();

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 100, y: 100 });
  };

  const handleExportPNG = () => {
    const svg = document.querySelector('svg');
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top toolbar */}
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
            {walls.length} walls • {rooms.length} rooms • {doors.length} doors • {windows.length} windows
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 mr-2">
            <button onClick={undo} disabled={historyIndex <= 0}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Undo (Ctrl+Z)">
              <Undo2 size={16} />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Redo (Ctrl+Shift+Z)">
              <Redo2 size={16} />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setZoom(zoom - 0.25)} className="p-1.5 hover:bg-white rounded-lg transition-colors" title="Zoom Out">
              <ZoomOut size={15} className="text-gray-600" />
            </button>
            <span className="text-xs font-semibold text-gray-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(zoom + 0.25)} className="p-1.5 hover:bg-white rounded-lg transition-colors" title="Zoom In">
              <ZoomIn size={15} className="text-gray-600" />
            </button>
            <button onClick={handleResetView} className="p-1.5 hover:bg-white rounded-lg transition-colors" title="Reset View">
              <Maximize2 size={15} className="text-gray-600" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <button
            onClick={() => { if (confirm('Clear all elements?')) clearAll(); }}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            Clear All
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-blue-600/20"
            >
              <Download size={15} />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden w-44 z-50">
                <button onClick={handleExportPNG}
                  className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                  <FileImage size={14} /> Export PNG
                </button>
                <button onClick={handleExportJSON}
                  className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                  <FileJson size={14} /> Export JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <ToolSidebar />
        <div className="flex-1 relative overflow-hidden">
          <FloorPlanCanvas />

          {/* Bottom shortcut bar */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 px-5 py-2.5 flex items-center gap-5">
            {[
              ['V', 'Select'], ['R', 'Room'], ['W', 'Wall'], ['D', 'Door'],
              ['N', 'Window'], ['Del', 'Delete'], ['Scroll', 'Zoom'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-gray-600 text-[10px] font-semibold">{key}</kbd>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default FloorPlan;
