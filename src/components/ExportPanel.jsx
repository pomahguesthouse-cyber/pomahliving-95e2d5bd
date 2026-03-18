import { useFloorPlanStore } from "../features/floorplan/store";

export default function ExportPanel() {
  const { walls, rooms, openings } = useFloorPlanStore();

  const exportJSON = () => {
    const data = { walls, rooms, openings, version: "1.0", exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `floorplan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSVG = async () => {
    const svg = document.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.style.backgroundColor = "#f8fafc";
    const bbox = getContentBBox(svg);
    if (bbox) {
      clone.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      clone.setAttribute("width", bbox.width * 2);
      clone.setAttribute("height", bbox.height * 2);
    }
    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `floorplan-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const getContentBBox = (svg) => {
    const g = svg.querySelector("g");
    if (!g) return null;
    const children = Array.from(g.children);
    if (children.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    children.forEach((el) => {
      const bb = el.getBBox();
      if (bb.x < minX) minX = bb.x;
      if (bb.y < minY) minY = bb.y;
      if (bb.x + bb.width > maxX) maxX = bb.x + bb.width;
      if (bb.y + bb.height > maxY) maxY = bb.y + bb.height;
    });
    if (minX === Infinity) return null;
    return { x: minX - 50, y: minY - 50, width: maxX - minX + 100, height: maxY - minY + 100 };
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={exportJSON}
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
        title="Export as JSON"
      >
        JSON
      </button>
      <button
        onClick={exportSVG}
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
        title="Export as PNG"
      >
        PNG
      </button>
    </div>
  );
}
