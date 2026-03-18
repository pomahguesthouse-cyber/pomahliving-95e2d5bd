import { useState, useEffect } from 'react';
import { Trash2, Move, Ruler, Edit3, Check, X } from 'lucide-react';
import useFloorPlanStore, { GRID_SIZE } from '@/features/floorplan/floorPlanStore';

const PropertySection = ({ title, children }) => (
  <div className="mb-5">
    <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h4>
    {children}
  </div>
);

const PropertyRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-600">{label}</span>
    {children}
  </div>
);

const Input = ({ value, onChange, unit, min, max, step = 1 }) => (
  <div className="flex items-center gap-1">
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-20 px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
    />
    {unit && <span className="text-xs text-gray-400 w-6">{unit}</span>}
  </div>
);

const ColorPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-8 h-8 rounded cursor-pointer border-0"
    />
    <span className="text-sm text-gray-500 font-mono">{value}</span>
  </div>
);

const PropertiesPanel = () => {
  const {
    walls,
    rooms,
    openings,
    selectedId,
    selectedType,
    updateRoom,
    updateWall,
    updateOpening,
    deleteItem,
    getWallLength,
    getRoomArea,
    clearAll,
  } = useFloorPlanStore();

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const getSelectedItem = () => {
    if (!selectedId) return null;
    if (selectedType === 'room') return rooms.find((r) => r.id === selectedId);
    if (selectedType === 'wall') return walls.find((w) => w.id === selectedId);
    if (selectedType === 'opening') return openings.find((o) => o.id === selectedId);
    return null;
  };

  const item = getSelectedItem();

  useEffect(() => {
    if (item?.name) {
      setTempName(item.name);
      setEditingName(false);
    }
  }, [item?.name]);

  if (!item) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Move size={24} className="text-gray-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">No Selection</h4>
          <p className="text-xs text-gray-400 max-w-[200px]">
            Select an element to view and edit its properties
          </p>
        </div>

        <div className="p-4 border-t border-gray-100">
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Statistics</h4>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded" />
                <span className="text-sm text-gray-600">Walls</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{walls.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded" />
                <span className="text-sm text-gray-600">Rooms</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{rooms.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-300 rounded" />
                <span className="text-sm text-gray-600">Doors</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {openings.filter((o) => o.type === 'door').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-cyan-300 rounded" />
                <span className="text-sm text-gray-600">Windows</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {openings.filter((o) => o.type === 'window').length}
              </span>
            </div>
          </div>

          {walls.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Total Area</span>
                <span className="text-sm font-semibold text-cyan-600">
                  {rooms.reduce((sum, r) => sum + parseFloat(getRoomArea(r)), 0).toFixed(1)} m²
                </span>
              </div>
            </div>
          )}

          {walls.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all elements? This cannot be undone.')) clearAll();
              }}
              className="w-full mt-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    );
  }

  const renderRoomProperties = () => {
    const widthM = (item.width / GRID_SIZE).toFixed(1);
    const heightM = (item.height / GRID_SIZE).toFixed(1);
    const area = getRoomArea(item);

    return (
      <>
        <PropertySection title="Room Name">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateRoom(item.id, { name: tempName });
                    setEditingName(false);
                  }
                  if (e.key === 'Escape') {
                    setTempName(item.name);
                    setEditingName(false);
                  }
                }}
              />
              <button
                onClick={() => {
                  updateRoom(item.id, { name: tempName });
                  setEditingName(false);
                }}
                className="p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setEditingName(true)}
            >
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
              <Edit3 size={14} className="text-gray-400" />
            </div>
          )}
        </PropertySection>

        <PropertySection title="Dimensions">
          <PropertyRow label="Width">
            <div className="flex items-center gap-1">
              <Input
                value={widthM}
                onChange={(v) => updateRoom(item.id, { width: v * GRID_SIZE })}
                min={1}
                max={50}
                step={0.5}
              />
              <span className="text-xs text-gray-400">m</span>
            </div>
          </PropertyRow>
          <PropertyRow label="Height">
            <div className="flex items-center gap-1">
              <Input
                value={heightM}
                onChange={(v) => updateRoom(item.id, { height: v * GRID_SIZE })}
                min={1}
                max={50}
                step={0.5}
              />
              <span className="text-xs text-gray-400">m</span>
            </div>
          </PropertyRow>
          <PropertyRow label="Area">
            <span className="text-sm font-semibold text-cyan-600">{area} m²</span>
          </PropertyRow>
        </PropertySection>

        <PropertySection title="Position">
          <PropertyRow label="X">
            <span className="text-sm font-mono text-gray-600">{item.x / GRID_SIZE}m</span>
          </PropertyRow>
          <PropertyRow label="Y">
            <span className="text-sm font-mono text-gray-600">{item.y / GRID_SIZE}m</span>
          </PropertyRow>
        </PropertySection>

        <PropertySection title="Appearance">
          <PropertyRow label="Fill Color">
            <ColorPicker
              value={item.fill}
              onChange={(v) => updateRoom(item.id, { fill: v })}
            />
          </PropertyRow>
        </PropertySection>
      </>
    );
  };

  const renderWallProperties = () => {
    const length = getWallLength(item);
    const lengthM = (length / GRID_SIZE).toFixed(2);

    return (
      <>
        <PropertySection title="Dimensions">
          <PropertyRow label="Length">
            <div className="flex items-center gap-1">
              <Input
                value={lengthM}
                onChange={(v) => {
                  const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
                  const newLength = v * GRID_SIZE;
                  updateWall(item.id, {
                    x2: item.x1 + Math.cos(angle) * newLength,
                    y2: item.y1 + Math.sin(angle) * newLength,
                  });
                }}
                min={0.5}
                max={100}
                step={0.5}
              />
              <span className="text-xs text-gray-400">m</span>
            </div>
          </PropertyRow>
          <PropertyRow label="Thickness">
            <Input
              value={item.thickness}
              onChange={(v) => updateWall(item.id, { thickness: v })}
              min={12}
              max={48}
            />
            <span className="text-xs text-gray-400 ml-1">px</span>
          </PropertyRow>
        </PropertySection>

        <PropertySection title="Coordinates">
          <PropertyRow label="Start">
            <span className="text-xs font-mono text-gray-500">
              ({item.x1 / GRID_SIZE}, {item.y1 / GRID_SIZE})
            </span>
          </PropertyRow>
          <PropertyRow label="End">
            <span className="text-xs font-mono text-gray-500">
              ({item.x2 / GRID_SIZE}, {item.y2 / GRID_SIZE})
            </span>
          </PropertyRow>
        </PropertySection>
      </>
    );
  };

  const renderOpeningProperties = () => {
    return (
      <>
        <PropertySection title="Type">
          <div className="flex items-center gap-2 py-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              item.type === 'door' ? 'bg-purple-100' : 'bg-cyan-100'
            }`}>
              <span className="text-lg">{item.type === 'door' ? '🚪' : '🪟'}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 capitalize">{item.type}</span>
          </div>
        </PropertySection>

        <PropertySection title="Dimensions">
          <PropertyRow label="Width">
            <div className="flex items-center gap-1">
              <Input
                value={item.width / GRID_SIZE}
                onChange={(v) => updateOpening(item.id, { width: v * GRID_SIZE })}
                min={0.5}
                max={3}
                step={0.1}
              />
              <span className="text-xs text-gray-400">m</span>
            </div>
          </PropertyRow>
          <PropertyRow label="Position">
            <span className="text-sm font-mono text-gray-600">
              {(item.offset * 100).toFixed(0)}%
            </span>
          </PropertyRow>
        </PropertySection>

        <PropertySection title="Wall Info">
          <PropertyRow label="Wall ID">
            <span className="text-xs font-mono text-gray-500">
              {item.wallId?.slice(0, 12)}...
            </span>
          </PropertyRow>
        </PropertySection>
      </>
    );
  };

  const getIcon = () => {
    if (selectedType === 'room') return '📐';
    if (selectedType === 'wall') return '🧱';
    if (selectedType === 'opening') return item?.type === 'door' ? '🚪' : '🪟';
    return '📦';
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
        <button
          onClick={() => deleteItem(selectedId)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-200">
            {getIcon()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 capitalize">{selectedType}</p>
            <p className="text-xs text-gray-500 font-mono">{selectedId?.slice(0, 16)}...</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedType === 'room' && renderRoomProperties()}
        {selectedType === 'wall' && renderWallProperties()}
        {selectedType === 'opening' && renderOpeningProperties()}
      </div>
    </div>
  );
};

export default PropertiesPanel;
