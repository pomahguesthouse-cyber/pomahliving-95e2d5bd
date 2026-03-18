import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Download, FileImage, Undo2, Redo2 } from 'lucide-react';
import ToolSidebar from '@/components/floorplan/ToolSidebar';
import FloorPlanCanvas from '@/components/floorplan/FloorPlanCanvas';
import PropertiesPanel from '@/components/floorplan/PropertiesPanel';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const FloorPlan = () => {
  const navigate = useNavigate();
  const { zoom, setZoom, setPanOffset, clearAll, walls, rooms, doors, windows } = useFloorPlanStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 100, y: 100 });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="w-px h-6 bg-gray-200" />
          
          <h1 className="text-lg font-semibold text-gray-900">
            <span className="text-cyan-500">2D</span> Floor Planner
          </h1>
          
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {walls.length} walls • {rooms.length} rooms • {doors.length} doors • {windows.length} windows
          </span>
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

          <div className="w-px h-6 bg-gray-200 mx-2" />

          <button
            onClick={() => {
              if (confirm('Clear all elements?')) clearAll();
            }}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear All
          </button>

          <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ToolSidebar />
        <div className="flex-1 relative overflow-hidden">
          <FloorPlanCanvas />
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">V</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">R</kbd>
              <span>Room</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">W</kbd>
              <span>Wall</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">D</kbd>
              <span>Door</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">N</kbd>
              <span>Window</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Del</kbd>
              <span>Delete</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Scroll</kbd>
              <span>Zoom</span>
            </div>
          </div>
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default FloorPlan;
