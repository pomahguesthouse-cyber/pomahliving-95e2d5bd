import {
  MousePointer2,
  Square,
  Minus,
  DoorOpen,
  LayoutGrid,
  Trash2,
  ChevronRight,
  Ruler,
  Eye,
  EyeOff,
} from 'lucide-react';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const ToolButton = ({ icon: Icon, label, active, onClick, shortcut }) => (
  <button
    onClick={onClick}
    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    className={`
      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
      ${active
        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }
    `}
  >
    <Icon size={18} />
    <span className="text-sm font-medium">{label}</span>
    {shortcut && (
      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
        active ? 'bg-cyan-400/30' : 'bg-gray-200'
      }`}>
        {shortcut}
      </span>
    )}
  </button>
);

const ToolSidebar = () => {
  const {
    activeTool,
    setActiveTool,
    selectedId,
    deleteItem,
    showDimensions,
    showLabels,
    setShowDimensions,
    setShowLabels,
  } = useFloorPlanStore();

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Tools</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Selection</p>
          <ToolButton
            icon={MousePointer2}
            label="Select"
            shortcut="V"
            active={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
          />
        </div>

        <div className="space-y-1 pt-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Draw</p>
          <ToolButton
            icon={Square}
            label="Room"
            shortcut="R"
            active={activeTool === 'room'}
            onClick={() => setActiveTool('room')}
          />
          <ToolButton
            icon={Minus}
            label="Wall"
            shortcut="W"
            active={activeTool === 'wall'}
            onClick={() => setActiveTool('wall')}
          />
        </div>

        <div className="space-y-1 pt-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Insert</p>
          <ToolButton
            icon={DoorOpen}
            label="Door"
            shortcut="D"
            active={activeTool === 'door'}
            onClick={() => setActiveTool('door')}
          />
          <ToolButton
            icon={LayoutGrid}
            label="Window"
            shortcut="N"
            active={activeTool === 'window'}
            onClick={() => setActiveTool('window')}
          />
        </div>

        <div className="space-y-1 pt-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Display</p>
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
              showDimensions ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Ruler size={18} />
            <span className="text-sm font-medium">Dimensions</span>
            {showDimensions ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
              showLabels ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-sm font-medium">Room Labels</span>
            {showLabels ? <Eye size={14} className="ml-auto" /> : <EyeOff size={14} className="ml-auto" />}
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => selectedId && deleteItem(selectedId)}
          disabled={!selectedId}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
            selectedId
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <Trash2 size={16} />
          <span className="text-sm font-medium">Delete</span>
          <span className="text-[10px] bg-gray-200 px-1 rounded">Del</span>
        </button>
      </div>
    </div>
  );
};

export default ToolSidebar;
