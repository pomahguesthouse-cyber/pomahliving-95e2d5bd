import { memo } from 'react';
import { MousePointer2, Trash2 } from 'lucide-react';
import useFloorPlanStore, { GRID_SIZE } from '@/features/floorplan/floorPlanStore';

const Section = ({ title, children }) => (
  <div className="mb-4">
    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</h4>
    {children}
  </div>
);

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="flex items-center gap-1.5">{children}</div>
  </div>
);

const NumInput = ({ value, onChange, unit, min, max, step = 1 }) => (
  <div className="flex items-center gap-1">
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-16 px-2 py-1 text-sm text-right bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    />
    {unit && <span className="text-xs text-gray-400 w-4">{unit}</span>}
  </div>
);

const TextInput = ({ value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
  />
);

const PropertiesPanel = memo(() => {
  const {
    walls, rooms, doors, windows, openings, outdoorElements, landBoundary,
    selectedId, selectedType,
    updateWall, updateRoom, updateDoor, updateWindow, updateOpening,
    updateOutdoorElement, updateLandBoundary, deleteItem,
  } = useFloorPlanStore();

  const getItem = () => {
    if (!selectedId) return null;
    if (selectedType === 'wall') return walls.find((w) => w.id === selectedId);
    if (selectedType === 'room') return rooms.find((r) => r.id === selectedId);
    if (selectedType === 'door') return doors.find((d) => d.id === selectedId);
    if (selectedType === 'window') return windows.find((w) => w.id === selectedId);
    if (selectedType === 'opening') return openings.find((o) => o.id === selectedId);
    if (selectedType === 'outdoor') return outdoorElements.find((e) => e.id === selectedId);
    if (selectedType === 'land-boundary') return landBoundary;
    return null;
  };

  const item = getItem();

  if (!item) {
    return (
      <div className="w-72 bg-white border-l border-gray-100 p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-900 mb-6">Properties</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <MousePointer2 size={20} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">Select an element to edit</p>
        </div>
        <div className="mt-auto pt-6">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Stats</h4>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
            {[
              ['Walls', walls.length],
              ['Rooms', rooms.length],
              ['Doors', doors.length],
              ['Windows', windows.length],
            ].map(([label, count]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const typeLabels = {
    wall: 'Wall',
    room: 'Room',
    door: 'Door',
    window: 'Window',
    opening: 'Opening',
    outdoor: 'Outdoor',
    'land-boundary': 'Land Boundary',
  };

  const renderRoomProps = () => {
    const w = item.width / GRID_SIZE;
    const h = item.height / GRID_SIZE;
    return (
      <>
        <Section title="Room Info">
          <TextInput value={item.name} onChange={(v) => updateRoom(item.id, { name: v })} />
        </Section>
        <Section title="Dimensions">
          <Row label="Width">
            <NumInput value={w.toFixed(2)} onChange={(v) => updateRoom(item.id, { width: v * GRID_SIZE })} unit="m" min={1} max={50} step={0.5} />
          </Row>
          <Row label="Length">
            <NumInput value={h.toFixed(2)} onChange={(v) => updateRoom(item.id, { height: v * GRID_SIZE })} unit="m" min={1} max={50} step={0.5} />
          </Row>
          <Row label="Area">
            <span className="text-sm font-semibold text-gray-800">{(w * h).toFixed(2)} m²</span>
          </Row>
          <Row label="Height">
            <NumInput value={item.roomHeight || 3.2} onChange={(v) => updateRoom(item.id, { roomHeight: v })} unit="m" min={2.4} max={6} step={0.1} />
          </Row>
        </Section>
        <Section title="Position">
          <Row label="X"><NumInput value={(item.x / GRID_SIZE).toFixed(0)} onChange={(v) => updateRoom(item.id, { x: v * GRID_SIZE })} unit="m" /></Row>
          <Row label="Y"><NumInput value={(item.y / GRID_SIZE).toFixed(0)} onChange={(v) => updateRoom(item.id, { y: v * GRID_SIZE })} unit="m" /></Row>
        </Section>
        <Section title="Style">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Color</span>
            <input
              type="color"
              value={item.fill}
              onChange={(e) => updateRoom(item.id, { fill: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
            />
          </div>
        </Section>
      </>
    );
  };

  const renderWallProps = () => {
    const length = Math.sqrt((item.x2 - item.x1) ** 2 + (item.y2 - item.y1) ** 2);
    return (
      <>
        <Section title="Dimensions">
          <Row label="Length"><span className="text-sm font-mono font-semibold text-gray-800">{(length / GRID_SIZE).toFixed(2)}m</span></Row>
          <Row label="Thickness"><NumInput value={item.thickness} onChange={(v) => updateWall(item.id, { thickness: v })} unit="px" min={4} max={48} /></Row>
        </Section>
        <Section title="Style">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Color</span>
            <input
              type="color"
              value={item.color}
              onChange={(e) => updateWall(item.id, { color: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
            />
          </div>
        </Section>
      </>
    );
  };

  const renderDoorWindowProps = (updateFn) => (
    <>
      <Section title="Dimensions">
        <Row label="Width"><NumInput value={item.width} onChange={(v) => updateFn(item.id, { width: v })} unit="px" min={40} max={200} /></Row>
      </Section>
      <Section title="Position">
        <Row label="Rotation"><NumInput value={item.rotation} onChange={(v) => updateFn(item.id, { rotation: v % 360 })} unit="°" min={0} max={360} /></Row>
      </Section>
    </>
  );

  const renderLandProps = () => (
    <Section title="Dimensions">
      <Row label="Width"><NumInput value={(item.width / GRID_SIZE).toFixed(1)} onChange={(v) => updateLandBoundary({ width: v * GRID_SIZE })} unit="m" min={1} max={100} /></Row>
      <Row label="Length"><NumInput value={(item.height / GRID_SIZE).toFixed(1)} onChange={(v) => updateLandBoundary({ height: v * GRID_SIZE })} unit="m" min={1} max={100} /></Row>
      <Row label="Area"><span className="text-sm font-semibold text-gray-800">{((item.width / GRID_SIZE) * (item.height / GRID_SIZE)).toFixed(2)} m²</span></Row>
    </Section>
  );

  const renderOutdoorProps = () => (
    <>
      <Section title="Info">
        <TextInput value={item.label} onChange={(v) => updateOutdoorElement(item.id, { label: v })} />
      </Section>
      <Section title="Dimensions">
        <Row label="Width"><NumInput value={(item.width / GRID_SIZE).toFixed(1)} onChange={(v) => updateOutdoorElement(item.id, { width: v * GRID_SIZE })} unit="m" /></Row>
        <Row label="Length"><NumInput value={(item.height / GRID_SIZE).toFixed(1)} onChange={(v) => updateOutdoorElement(item.id, { height: v * GRID_SIZE })} unit="m" /></Row>
      </Section>
    </>
  );

  return (
    <div className="w-72 bg-white border-l border-gray-100 p-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
        <button
          onClick={() => deleteItem(selectedId)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="bg-gray-50 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <MousePointer2 size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{typeLabels[selectedType] || 'Element'}</p>
          <p className="text-xs text-gray-400">{selectedType === 'room' ? item.name : (item.label || selectedType)}</p>
        </div>
      </div>

      {selectedType === 'room' && renderRoomProps()}
      {selectedType === 'wall' && renderWallProps()}
      {selectedType === 'door' && renderDoorWindowProps(updateDoor)}
      {selectedType === 'window' && renderDoorWindowProps(updateWindow)}
      {selectedType === 'opening' && renderDoorWindowProps(updateOpening)}
      {selectedType === 'land-boundary' && renderLandProps()}
      {selectedType === 'outdoor' && renderOutdoorProps()}
    </div>
  );
});

PropertiesPanel.displayName = 'PropertiesPanel';

export default PropertiesPanel;
