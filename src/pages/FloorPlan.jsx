import FloorCanvas from "../components/FloorCanvas";
import Toolbar from "../components/Toolbar";
import PropertiesPanel from "../components/PropertiesPanel";
import ExportPanel from "../components/ExportPanel";
import { useNavigate } from "react-router-dom";
import { useFloorPlanStore } from "../features/floorplan/store";

function Topbar() {
  const navigate = useNavigate();
  const { zoom, setZoom, walls, rooms, openings, clearAll, undo, redo, historyIndex, history, generateWallsFromRooms } = useFloorPlanStore();

  return (
    <div className="h-12 bg-white border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          ← Back
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-sm font-semibold text-gray-900">
          <span className="text-cyan-500">2D</span> Floor Planner
        </h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          {walls.length} walls • {rooms.length} rooms
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            ↩
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            ↪
          </button>
        </div>

        <div className="flex items-center bg-gray-100 rounded-lg px-1">
          <button
            onClick={() => setZoom(zoom - 0.25)}
            className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
          >
            -
          </button>
          <span className="text-xs font-medium text-gray-700 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.25)}
            className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
          >
            +
          </button>
        </div>

        <button
          onClick={generateWallsFromRooms}
          disabled={rooms.length === 0}
          className="px-3 py-1.5 text-xs text-cyan-600 hover:bg-cyan-50 rounded-lg disabled:opacity-30"
          title="Generate walls around rooms"
        >
          Auto Walls
        </button>

        <ExportPanel />

        <button
          onClick={() => {
            if (confirm("Clear all?")) clearAll();
          }}
          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function StatusBar() {
  const { tool, selectedId, selectedType } = useFloorPlanStore();

  const hints = {
    select: "Click to select • Drag room to move",
    room: "Click + drag to create room",
    wall: "Click start point, then end point",
    door: "Click on a wall to place",
    window: "Click on a wall to place",
  };

  return (
    <div className="h-8 bg-white border-t flex items-center justify-between px-4">
      <div className="flex items-center">
        <span className="text-xs text-gray-500">{hints[tool]}</span>
        {selectedId && (
          <>
            <span className="mx-3 text-gray-300">•</span>
            <span className="text-xs text-cyan-600 capitalize">{selectedType} selected</span>
          </>
        )}
      </div>
      <span className="text-[10px] text-gray-400">
        V Select • R Room • W Wall • D Door • N Window • Del Delete • Ctrl+Z Undo
      </span>
    </div>
  );
}

export default function FloorPlan() {
  return (
    <div className="h-screen flex flex-col">
      <Topbar />
      <div className="flex-1 flex overflow-hidden">
        <Toolbar />
        <div className="flex-1">
          <FloorCanvas />
        </div>
        <PropertiesPanel />
      </div>
      <StatusBar />
    </div>
  );
}
