import { useFloorPlanStore } from "../features/floorplan/store";

export default function PropertiesPanel() {
  const { selectedId, selectedType, walls, rooms, openings, updateRoom, updateWall, updateOpening } = useFloorPlanStore();

  if (!selectedId) {
    return (
      <div className="w-56 bg-white border-l flex flex-col">
        <div className="p-3 border-b">
          <h2 className="text-xs font-semibold text-gray-900">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-gray-400 text-center">Select an element to edit</p>
        </div>
      </div>
    );
  }

  let item = null;
  let updateFn = null;
  if (selectedType === "room") {
    item = rooms.find((r) => r.id === selectedId);
    updateFn = updateRoom;
  } else if (selectedType === "wall") {
    item = walls.find((w) => w.id === selectedId);
    updateFn = updateWall;
  } else if (selectedType === "opening") {
    item = openings.find((o) => o.id === selectedId);
    updateFn = updateOpening;
  }

  if (!item) return null;

  const handleChange = (field, value) => {
    updateFn(selectedId, { [field]: value });
  };

  return (
    <div className="w-56 bg-white border-l flex flex-col">
      <div className="p-3 border-b">
        <h2 className="text-xs font-semibold text-gray-900">Properties</h2>
        <span className="text-[10px] text-cyan-500 capitalize">{selectedType}</span>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {selectedType === "room" && (
          <>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Name</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">Width (m)</label>
                <input
                  type="number"
                  value={(item.width / 20).toFixed(1)}
                  onChange={(e) => handleChange("width", parseFloat(e.target.value) * 20)}
                  className="w-full mt-1 px-2 py-1.5 text-xs border rounded"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Height (m)</label>
                <input
                  type="number"
                  value={(item.height / 20).toFixed(1)}
                  onChange={(e) => handleChange("height", parseFloat(e.target.value) * 20)}
                  className="w-full mt-1 px-2 py-1.5 text-xs border rounded"
                  step="0.5"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Color</label>
              <div className="flex gap-1 mt-1">
                {["#f1f5f9", "#fef3c7", "#dbeafe", "#dcfce7", "#fce7f3", "#fee2e2"].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleChange("fill", c)}
                    className={`w-6 h-6 rounded border ${item.fill === c ? "ring-2 ring-cyan-500" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-[10px] text-gray-500">Area: <span className="text-cyan-600 font-medium">{((item.width / 20) * (item.height / 20)).toFixed(1)} m²</span></div>
            </div>
          </>
        )}
        {selectedType === "wall" && (
          <>
            <div>
              <label className="text-[10px] text-gray-500">Thickness</label>
              <input
                type="range"
                min="4"
                max="12"
                value={item.thickness}
                onChange={(e) => handleChange("thickness", parseInt(e.target.value))}
                className="w-full mt-1"
              />
              <div className="text-[10px] text-gray-400 text-right">{item.thickness}px</div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-[10px] text-gray-500">Length: <span className="text-cyan-600 font-medium">{(Math.hypot(item.x2 - item.x1, item.y2 - item.y1) / 20).toFixed(2)} m</span></div>
            </div>
          </>
        )}
        {selectedType === "opening" && (
          <>
            <div>
              <label className="text-[10px] text-gray-500">Width (cm)</label>
              <input
                type="number"
                value={item.width}
                onChange={(e) => handleChange("width", parseInt(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-xs border rounded"
                step="10"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Position on wall</label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={item.offset}
                onChange={(e) => handleChange("offset", parseFloat(e.target.value))}
                className="w-full mt-1"
              />
              <div className="text-[10px] text-gray-400 text-right">{Math.round(item.offset * 100)}%</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
