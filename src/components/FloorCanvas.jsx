import { useRef, useState } from "react";
import { useFloorPlanStore } from "../features/floorplan/store";

const snap = (v, size = 20) => Math.round(v / size) * size;

export default function FloorCanvas() {
  const svgRef = useRef();
  const [drawing, setDrawing] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragDelta, setDragDelta] = useState(null);

  const {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    tool,
    walls,
    rooms,
    openings,
    selectedId,
    selectedType,
    addWall,
    addRoom,
    addOpening,
    setSelected,
    updateRoom,
    updateRoomWithWalls,
    deleteItem,
    undo,
    redo,
  } = useFloorPlanStore();

  const getCanvasPoint = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    };
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleFactor = 0.1;
    const newZoom = zoom + (e.deltaY > 0 ? -scaleFactor : scaleFactor);
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    const point = getCanvasPoint(e);
    const x = snap(point.x);
    const y = snap(point.y);

    if (tool === "wall") {
      setDrawing({ x1: x, y1: y, x2: x, y2: y });
    } else if (tool === "room") {
      setDrawing({ x, y, width: 0, height: 0 });
    } else if (tool === "door" || tool === "window") {
      const nearestWall = findNearestWall(point);
      if (nearestWall) {
        const offset = getOffsetOnWall(nearestWall, point);
        addOpening({
          id: Date.now(),
          type: tool,
          wallId: nearestWall.id,
          offset,
          width: tool === "door" ? 90 : 120,
        });
      }
    } else if (tool === "select") {
      const target = e.target;
      const id = target.getAttribute("data-id");
      const type = target.getAttribute("data-type");
      
      if (id && type) {
        setSelected(id, type);
        setDragStart({ id, type, x: point.x, y: point.y });
      } else {
        setSelected(null, null);
      }
    }
  };

  const handleMouseMove = (e) => {
    const point = getCanvasPoint(e);
    const x = snap(point.x);
    const y = snap(point.y);

    if (tool === "wall" && drawing) {
      setDrawing({ ...drawing, x2: x, y2: y });
    } else if (tool === "room" && drawing) {
      setDrawing({
        ...drawing,
        width: x - drawing.x,
        height: y - drawing.y,
      });
    } else if (tool === "select" && dragStart) {
      const dx = x - snap(dragStart.x);
      const dy = y - snap(dragStart.y);
      setDragDelta({ dx, dy });
      
      if (dragStart.type === "room") {
        const room = rooms.find((r) => r.id === dragStart.id);
        if (room) {
          updateRoom(dragStart.id, {
            x: room.x + dx,
            y: room.y + dy,
          }, true);
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (drawing) {
      if (tool === "wall") {
        const length = Math.hypot(drawing.x2 - drawing.x1, drawing.y2 - drawing.y1);
        if (length > 20) {
          addWall({
            id: Date.now(),
            x1: drawing.x1,
            y1: drawing.y1,
            x2: drawing.x2,
            y2: drawing.y2,
            thickness: 6,
          });
        }
      } else if (tool === "room") {
        const width = drawing.width;
        const height = drawing.height;
        if (Math.abs(width) > 40 && Math.abs(height) > 40) {
          const rx = width > 0 ? drawing.x : drawing.x + width;
          const ry = height > 0 ? drawing.y : drawing.y + height;
          addRoom({
            id: Date.now(),
            x: snap(rx),
            y: snap(ry),
            width: snap(Math.abs(width)),
            height: snap(Math.abs(height)),
            name: "Room",
            fill: "#f1f5f9",
            stroke: "#94a3af",
          });
        }
      }
      setDrawing(null);
    }
    setDragStart(null);
  };

  const findNearestWall = (point) => {
    let nearest = null;
    let minDist = 50;
    walls.forEach((wall) => {
      const dist = pointToLineDistance(point, wall);
      if (dist < minDist) {
        minDist = dist;
        nearest = wall;
      }
    });
    return nearest;
  };

  const getOffsetOnWall = (wall, point) => {
    const wallLength = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
    const dot =
      ((point.x - wall.x1) * (wall.x2 - wall.x1) +
        (point.y - wall.y1) * (wall.y2 - wall.y1)) /
      (wallLength * wallLength);
    return Math.max(0.1, Math.min(0.9, dot));
  };

  const pointToLineDistance = (point, wall) => {
    const A = point.x - wall.x1;
    const B = point.y - wall.y1;
    const C = wall.x2 - wall.x1;
    const D = wall.y2 - wall.y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) {
      xx = wall.x1;
      yy = wall.y1;
    } else if (param > 1) {
      xx = wall.x2;
      yy = wall.y2;
    } else {
      xx = wall.x1 + param * C;
      yy = wall.y1 + param * D;
    }
    return Math.hypot(point.x - xx, point.y - yy);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedId) {
        deleteItem();
      }
    }
    if (e.key === "v") useFloorPlanStore.getState().setTool("select");
    if (e.key === "r") useFloorPlanStore.getState().setTool("room");
    if (e.key === "w") useFloorPlanStore.getState().setTool("wall");
    if (e.key === "d") useFloorPlanStore.getState().setTool("door");
    if (e.key === "n") useFloorPlanStore.getState().setTool("window");
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault();
      redo();
    }
  };

  // GRID
  const grid = [];
  for (let i = -1000; i <= 1000; i += 20) {
    const isMajor = i % 100 === 0;
    grid.push(
      <line
        key={`v${i}`}
        x1={i}
        y1={-1000}
        x2={i}
        y2={1000}
        stroke={isMajor ? "#cbd5e1" : "#e2e8f0"}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
    grid.push(
      <line
        key={`h${i}`}
        x1={-1000}
        y1={i}
        x2={1000}
        y2={i}
        stroke={isMajor ? "#cbd5e1" : "#e2e8f0"}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-slate-50"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
        {grid}

        {/* ROOMS */}
        {rooms.map((r) => {
          const isSelected = selectedId === r.id;
          const area = ((r.width / 20) * (r.height / 20)).toFixed(1);
          const wM = (r.width / 20).toFixed(1);
          const hM = (r.height / 20).toFixed(1);
          return (
            <g key={r.id}>
              <rect
                data-id={r.id}
                data-type="room"
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                fill={r.fill}
                stroke={isSelected ? "#06b6d4" : r.stroke}
                strokeWidth={isSelected ? 3 : 1.5}
                strokeDasharray={isSelected ? "none" : "8,4"}
                className="cursor-move"
              />
              <text
                x={r.x + r.width / 2}
                y={r.y + r.height / 2 - 10}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill="#475569"
              >
                {r.name}
              </text>
              <text
                x={r.x + r.width / 2}
                y={r.y + r.height / 2 + 6}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3af"
              >
                {wM} × {hM}m
              </text>
              <text
                x={r.x + r.width / 2}
                y={r.y + r.height / 2 + 20}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill="#06b6d4"
              >
                {area} m²
              </text>
            </g>
          );
        })}

        {/* WALLS */}
        {walls.map((w) => {
          const isSelected = selectedId === w.id;
          const length = (Math.hypot(w.x2 - w.x1, w.y2 - w.y1) / 20).toFixed(2);
          const midX = (w.x1 + w.x2) / 2;
          const midY = (w.y1 + w.y2) / 2;
          return (
            <g key={w.id}>
              <line
                data-id={w.id}
                data-type="wall"
                x1={w.x1}
                y1={w.y1}
                x2={w.x2}
                y2={w.y2}
                stroke={isSelected ? "#06b6d4" : "#475569"}
                strokeWidth={w.thickness}
                strokeLinecap="round"
                className="cursor-move"
              />
              {isSelected && (
                <>
                  <circle cx={w.x1} cy={w.y1} r={6} fill="#06b6d4" />
                  <circle cx={w.x2} cy={w.y2} r={6} fill="#06b6d4" />
                </>
              )}
              {parseFloat(length) > 0.5 && (
                <text
                  x={midX}
                  y={midY - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={500}
                  fill="#64748b"
                >
                  {length}m
                </text>
              )}
            </g>
          );
        })}

        {/* OPENINGS */}
        {openings.map((o) => {
          const wall = walls.find((w) => w.id === o.wallId);
          if (!wall) return null;
          const isSelected = selectedId === o.id;
          const startX = wall.x1 + (wall.x2 - wall.x1) * o.offset;
          const startY = wall.y1 + (wall.y2 - wall.y1) * o.offset;
          const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
          const halfWidth = o.width / 2;
          const color = o.type === "door" ? "#8b5cf6" : "#06b6d4";
          return (
            <g
              key={o.id}
              transform={`translate(${startX}, ${startY}) rotate(${(angle * 180) / Math.PI})`}
            >
              <rect
                data-id={o.id}
                data-type="opening"
                x={-halfWidth}
                y={-6}
                width={o.width}
                height={12}
                fill={color}
                stroke={isSelected ? "#06b6d4" : "transparent"}
                strokeWidth={isSelected ? 2 : 0}
                rx={2}
                className="cursor-move"
              />
              {o.type === "door" && (
                <path
                  d={`M ${-halfWidth} 0 A ${halfWidth} ${halfWidth} 0 0 1 ${halfWidth} 0`}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="4,3"
                  opacity={0.7}
                />
              )}
            </g>
          );
        })}

        {/* DRAW PREVIEW */}
        {drawing && tool === "wall" && (
          <line
            x1={drawing.x1}
            y1={drawing.y1}
            x2={drawing.x2}
            y2={drawing.y2}
            stroke="#06b6d4"
            strokeWidth={6}
            strokeDasharray="12,6"
            strokeLinecap="round"
          />
        )}
        {drawing && tool === "room" && (
          <rect
            x={drawing.width > 0 ? drawing.x : drawing.x + drawing.width}
            y={drawing.height > 0 ? drawing.y : drawing.y + drawing.height}
            width={Math.abs(drawing.width)}
            height={Math.abs(drawing.height)}
            fill="#f1f5f9"
            stroke="#06b6d4"
            strokeWidth={2}
            strokeDasharray="8,4"
            rx={2}
          />
        )}
      </g>
    </svg>
  );
}
