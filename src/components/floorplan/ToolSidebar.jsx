import {
  MousePointer2,
  Square,
  Minus,
  DoorOpen,
  SquareStack,
  Grid3X3,
  Trash2,
  Upload,
  RotateCw,
  Image,
  X,
} from 'lucide-react';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const ToolButton = ({ icon: Icon, label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`
      w-10 h-10 flex items-center justify-center rounded-lg transition-all
      ${active
        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
        : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }
    `}
  >
    <Icon size={18} />
  </button>
);

const Divider = () => <div className="w-full h-px bg-gray-200 my-2" />;

const ToolSidebar = () => {
  const {
    activeTool,
    setActiveTool,
    gridVisible,
    setGridVisible,
    deleteItem,
    selectedId,
    uploadedImage,
    setUploadedImage,
    clearUploadedImage,
  } = useFloorPlanStore();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-1">
      <ToolButton
        icon={MousePointer2}
        label="Select (V)"
        active={activeTool === 'select'}
        onClick={() => setActiveTool('select')}
      />
      
      <ToolButton
        icon={Square}
        label="Room (R)"
        active={activeTool === 'room'}
        onClick={() => setActiveTool('room')}
      />
      
      <ToolButton
        icon={Minus}
        label="Wall (W)"
        active={activeTool === 'wall'}
        onClick={() => setActiveTool('wall')}
      />
      
      <Divider />
      
      <ToolButton
        icon={DoorOpen}
        label="Door (D)"
        active={activeTool === 'door'}
        onClick={() => setActiveTool('door')}
      />
      
      <ToolButton
        icon={SquareStack}
        label="Window (N)"
        active={activeTool === 'window'}
        onClick={() => setActiveTool('window')}
      />
      
      <Divider />
      
      <ToolButton
        icon={Grid3X3}
        label="Toggle Grid"
        active={gridVisible}
        onClick={() => setGridVisible(!gridVisible)}
      />
      
      <ToolButton
        icon={Upload}
        label="Upload Image"
        onClick={() => document.getElementById('floorplan-upload').click()}
      />
      
      <input
        type="file"
        id="floorplan-upload"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {uploadedImage && (
        <ToolButton
          icon={X}
          label="Remove Image"
          onClick={clearUploadedImage}
        />
      )}
      
      <div className="flex-1" />
      
      <ToolButton
        icon={Trash2}
        label="Delete (Del)"
        onClick={() => selectedId && deleteItem(selectedId)}
        disabled={!selectedId}
      />
    </div>
  );
};

export default ToolSidebar;
