import {
  MousePointer2, Square, Minus, DoorOpen, PanelTop,
  Grid3X3, Trash2, Upload, X, Fence, Car, TreePine, Route, Magnet,
} from 'lucide-react';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';

const ToolButton = ({ icon: Icon, label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`
      w-14 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all group relative
      ${active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
        : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }
    `}
  >
    <Icon size={20} strokeWidth={1.8} />
    <span className={`text-[9px] font-medium leading-tight ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
      {label}
    </span>
  </button>
);

const Divider = () => <div className="w-10 h-px bg-gray-200 my-1" />;

const ToolSidebar = () => {
  const {
    activeTool, setActiveTool, gridVisible, setGridVisible,
    snapEnabled, setSnapEnabled,
    deleteItem, selectedId, uploadedImage, setUploadedImage, clearUploadedImage,
  } = useFloorPlanStore();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setUploadedImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-[72px] bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-0.5 overflow-y-auto">
      <ToolButton
        icon={MousePointer2}
        label="Select"
        active={activeTool === 'select'}
        onClick={() => setActiveTool('select')}
      />

      <Divider />

      <ToolButton
        icon={Fence}
        label="Batas"
        active={activeTool === 'land'}
        onClick={() => setActiveTool('land')}
      />

      <ToolButton
        icon={Square}
        label="Rect"
        active={activeTool === 'room'}
        onClick={() => setActiveTool('room')}
      />

      <ToolButton
        icon={Minus}
        label="Garis"
        active={activeTool === 'wall'}
        onClick={() => setActiveTool('wall')}
      />

      <Divider />

      <ToolButton
        icon={DoorOpen}
        label="Pintu"
        active={activeTool === 'door'}
        onClick={() => setActiveTool('door')}
      />

      <ToolButton
        icon={PanelTop}
        label="Jendela"
        active={activeTool === 'window'}
        onClick={() => setActiveTool('window')}
      />

      <ToolButton
        icon={Square}
        label="Opening"
        active={activeTool === 'opening'}
        onClick={() => setActiveTool('opening')}
      />

      <Divider />

      <ToolButton
        icon={Car}
        label="Car Porch"
        active={activeTool === 'carport'}
        onClick={() => setActiveTool('carport')}
      />

      <ToolButton
        icon={Route}
        label="Jalan"
        active={activeTool === 'road'}
        onClick={() => setActiveTool('road')}
      />

      <ToolButton
        icon={TreePine}
        label="Taman"
        active={activeTool === 'garden'}
        onClick={() => setActiveTool('garden')}
      />

      <Divider />

      <ToolButton
        icon={Grid3X3}
        label="Grid"
        active={gridVisible}
        onClick={() => setGridVisible(!gridVisible)}
      />

      <ToolButton
        icon={Magnet}
        label="Snap"
        active={snapEnabled}
        onClick={() => setSnapEnabled(!snapEnabled)}
      />

      <ToolButton
        icon={Upload}
        label="Upload"
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
        <ToolButton icon={X} label="Hapus" onClick={clearUploadedImage} />
      )}

      <div className="flex-1" />

      <ToolButton
        icon={Trash2}
        label="Hapus"
        onClick={() => selectedId && deleteItem(selectedId)}
        disabled={!selectedId}
      />
    </div>
  );
};

export default ToolSidebar;
