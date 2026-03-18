import { RotateCw, Trash2, Move, Ruler, Maximize2 } from 'lucide-react';
import useFloorPlanStore, { GRID_SIZE } from '@/features/floorplan/floorPlanStore';

const PropertySection = ({ title, children }) => (
  <div className="mb-4">
    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
    {children}
  </div>
);

const PropertyRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

const Input = ({ value, onChange, unit, min, max }) => (
  <div className="flex items-center gap-1">
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-16 px-2 py-1 text-sm text-right border border-gray-200 rounded focus:outline-none focus:border-cyan-500"
    />
    {unit && <span className="text-xs text-gray-400">{unit}</span>}
  </div>
);

const PropertiesPanel = () => {
  const {
    walls,
    rooms,
    doors,
    windows,
    selectedId,
    selectedType,
    updateWall,
    updateRoom,
    updateDoor,
    updateWindow,
    deleteItem,
    moveItem,
  } = useFloorPlanStore();

  const getSelectedItem = () => {
    if (!selectedId) return null;
    
    if (selectedType === 'wall') return walls.find((w) => w.id === selectedId);
    if (selectedType === 'room') return rooms.find((r) => r.id === selectedId);
    if (selectedType === 'door') return doors.find((d) => d.id === selectedId);
    if (selectedType === 'window') return windows.find((w) => w.id === selectedId);
    return null;
  };

  const item = getSelectedItem();

  if (!item) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Properties</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Move size={32} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Select an element to view its properties</p>
        </div>
        
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Stats</h4>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Walls</span>
              <span className="text-sm font-semibold text-gray-900">{walls.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rooms</span>
              <span className="text-sm font-semibold text-gray-900">{rooms.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Doors</span>
              <span className="text-sm font-semibold text-gray-900">{doors.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Windows</span>
              <span className="text-sm font-semibold text-gray-900">{windows.length}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderWallProperties = () => {
    const length = Math.sqrt(
      Math.pow(item.x2 - item.x1, 2) + Math.pow(item.y2 - item.y1, 2)
    );
    
    return (
      <>
        <PropertySection title="Dimensions">
          <PropertyRow label="Length">
            <span className="text-sm font-mono font-semibold text-gray-900">
              {(length / GRID_SIZE).toFixed(2)}m
            </span>
          </PropertyRow>
          <PropertyRow label="Thickness">
            <Input
              value={item.thickness}
              onChange={(v) => updateWall(item.id, { thickness: v })}
              unit="px"
              min={12}
              max={48}
            />
          </PropertyRow>
          <PropertyRow label="Height">
            <Input
              value={item.height}
              onChange={(v) => updateWall(item.id, { height: v })}
              unit="mm"
              min={2000}
              max={4000}
            />
          </PropertyRow>
        </PropertySection>
        
        <PropertySection title="Position">
          <PropertyRow label="Start">
            <span className="text-xs font-mono text-gray-500">
              ({item.x1 / GRID_SIZE}, {item.y1 / GRID_SIZE})m
            </span>
          </PropertyRow>
          <PropertyRow label="End">
            <span className="text-xs font-mono text-gray-500">
              ({item.x2 / GRID_SIZE}, {item.y2 / GRID_SIZE})m
            </span>
          </PropertyRow>
        </PropertySection>
        
        <PropertySection title="Style">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Color</span>
            <input
              type="color"
              value={item.color}
              onChange={(e) => updateWall(item.id, { color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
          </div>
        </PropertySection>
      </>
    );
  };

  const renderRoomProperties = () => {
    return (
      <>
        <PropertySection title="Dimensions">
          <PropertyRow label="Width">
            <Input
              value={item.width / GRID_SIZE}
              onChange={(v) => updateRoom(item.id, { width: v * GRID_SIZE })}
              unit="m"
              min={1}
              max={20}
            />
          </PropertyRow>
          <PropertyRow label="Height">
            <Input
              value={item.height / GRID_SIZE}
              onChange={(v) => updateRoom(item.id, { height: v * GRID_SIZE })}
              unit="m"
              min={1}
              max={20}
            />
          </PropertyRow>
          <PropertyRow label="Area">
            <span className="text-sm font-semibold text-gray-900">
              {((item.width / GRID_SIZE) * (item.height / GRID_SIZE)).toFixed(1)}m²
            </span>
          </PropertyRow>
        </PropertySection>
        
        <PropertySection title="Position">
          <PropertyRow label="X">
            <Input
              value={item.x / GRID_SIZE}
              onChange={(v) => updateRoom(item.id, { x: v * GRID_SIZE })}
              unit="m"
              min={0}
              max={50}
            />
          </PropertyRow>
          <PropertyRow label="Y">
            <Input
              value={item.y / GRID_SIZE}
              onChange={(v) => updateRoom(item.id, { y: v * GRID_SIZE })}
              unit="m"
              min={0}
              max={50}
            />
          </PropertyRow>
        </PropertySection>
        
        <PropertySection title="Style">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Fill</span>
            <input
              type="color"
              value={item.fill}
              onChange={(e) => updateRoom(item.id, { fill: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
          </div>
        </PropertySection>
      </>
    );
  };

  const renderDoorProperties = () => (
    <>
      <PropertySection title="Dimensions">
        <PropertyRow label="Width">
          <Input
            value={item.width}
            onChange={(v) => updateDoor(item.id, { width: v })}
            unit="px"
            min={60}
            max={150}
          />
        </PropertyRow>
      </PropertySection>
      
      <PropertySection title="Position">
        <PropertyRow label="X">
          <span className="text-xs font-mono text-gray-500">{item.x / GRID_SIZE}m</span>
        </PropertyRow>
        <PropertyRow label="Y">
          <span className="text-xs font-mono text-gray-500">{item.y / GRID_SIZE}m</span>
        </PropertyRow>
        <PropertyRow label="Rotation">
          <Input
            value={item.rotation}
            onChange={(v) => updateDoor(item.id, { rotation: v % 360 })}
            unit="°"
            min={0}
            max={360}
          />
        </PropertyRow>
      </PropertySection>
    </>
  );

  const renderWindowProperties = () => (
    <>
      <PropertySection title="Dimensions">
        <PropertyRow label="Width">
          <Input
            value={item.width}
            onChange={(v) => updateWindow(item.id, { width: v })}
            unit="px"
            min={60}
            max={200}
          />
        </PropertyRow>
      </PropertySection>
      
      <PropertySection title="Position">
        <PropertyRow label="X">
          <span className="text-xs font-mono text-gray-500">{item.x / GRID_SIZE}m</span>
        </PropertyRow>
        <PropertyRow label="Y">
          <span className="text-xs font-mono text-gray-500">{item.y / GRID_SIZE}m</span>
        </PropertyRow>
        <PropertyRow label="Rotation">
          <Input
            value={item.rotation}
            onChange={(v) => updateWindow(item.id, { rotation: v % 360 })}
            unit="°"
            min={0}
            max={360}
          />
        </PropertyRow>
      </PropertySection>
    </>
  );

  const getTypeIcon = () => {
    if (selectedType === 'wall') return '🧱';
    if (selectedType === 'room') return '📐';
    if (selectedType === 'door') return '🚪';
    if (selectedType === 'window') return '🪟';
    return '📦';
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
        <button
          onClick={() => deleteItem(selectedId)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon()}</span>
          <div>
            <p className="text-sm font-medium text-gray-900 capitalize">{selectedType}</p>
            <p className="text-xs text-gray-500 font-mono">{selectedId?.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

      {selectedType === 'wall' && renderWallProperties()}
      {selectedType === 'room' && renderRoomProperties()}
      {selectedType === 'door' && renderDoorProperties()}
      {selectedType === 'window' && renderWindowProperties()}
    </div>
  );
};

export default PropertiesPanel;
