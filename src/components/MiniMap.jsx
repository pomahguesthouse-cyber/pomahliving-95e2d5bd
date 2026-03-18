import useBuilderStore from '../features/builder/builderStore';

const MiniMap = ({ onModuleClick }) => {
  const modules = useBuilderStore((state) => state.modules);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const landSize = useBuilderStore((state) => state.landSize);
  const setSelected = useBuilderStore((state) => state.setSelected);

  const mapSize = 120;
  const scale = mapSize / Math.max(landSize.w, landSize.l);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / mapSize) * landSize.w;
    const z = ((e.clientY - rect.top) / mapSize) * landSize.l;
    
    const clickedModule = modules.find((m) => {
      if (!m.visible) return false;
      const halfW = m.w / 2;
      const halfL = m.l / 2;
      return x >= m.x - halfW && x <= m.x + halfW && z >= m.z - halfL && z <= m.z + halfL;
    });

    if (clickedModule) {
      setSelected(clickedModule.id);
      onModuleClick?.(clickedModule.id);
    }
  };

  return (
    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-[#1a1a2e]/95 backdrop-blur border border-[#2d2d42] rounded-lg p-1.5 shadow-lg">
      <svg
        width={mapSize}
        height={mapSize}
        className="cursor-pointer"
        onClick={handleClick}
      >
        <rect x="0" y="0" width={mapSize} height={mapSize} fill="#0f0f1a" rx="4" />
        
        <rect
          x={0}
          y={0}
          width={landSize.w * scale}
          height={landSize.l * scale}
          fill="none"
          stroke="#3d3d5c"
          strokeWidth={1}
          rx="2"
        />

        {modules.filter(m => m.visible).map((module) => {
          const x = (module.x - module.w / 2) * scale;
          const y = (module.z - module.l / 2) * scale;
          const w = module.w * scale;
          const h = module.l * scale;
          const isSelected = module.id === selectedId;

          return (
            <g key={module.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={isSelected ? '#22d3ee' : module.color}
                stroke={isSelected ? '#fff' : 'transparent'}
                strokeWidth={1}
                opacity={0.8}
                rx="1"
              />
              {module.rotation !== 0 && (
                <line
                  x1={x + 2}
                  y1={y + 2}
                  x2={x + w - 2}
                  y2={y + h - 2}
                  stroke="#fff"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default MiniMap;
