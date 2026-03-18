import { useFloorPlanStore } from "../features/floorplan/store";

export default function Toolbar() {
  const { tool, setTool } = useFloorPlanStore();

  const tools = [
    { id: "select", label: "Select", key: "V" },
    { id: "room", label: "Room", key: "R" },
    { id: "wall", label: "Wall", key: "W" },
    { id: "door", label: "Door", key: "D" },
    { id: "window", label: "Window", key: "N" },
  ];

  return (
    <div className="w-20 bg-white border-r flex flex-col">
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          className={`px-3 py-3 text-xs font-medium border-b border-gray-100 transition-colors ${
            tool === t.id
              ? "bg-cyan-500 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t.label}
          <span className="block text-[9px] opacity-60 mt-0.5">{t.key}</span>
        </button>
      ))}
    </div>
  );
}
