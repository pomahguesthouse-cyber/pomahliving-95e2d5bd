import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { getCentroid, formatArea, GRID_SIZE } from '@/features/areaPlan/geometryUtils';
import useAreaPlanStore from '@/features/areaPlan/areaPlanStore';

const AreaPolygon = memo(({ area, isSelected, isHovered, isEditing, onSelect, onHover }) => {
  const pointsString = area.points.map((p) => `${p.x},${p.y}`).join(' ');
  
  const strokeColor = isSelected ? '#2563eb' : isHovered ? '#3b82f6' : area.color;
  const strokeWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;
  
  return (
    <polygon
      points={pointsString}
      fill={area.fillColor}
      fillOpacity={isSelected || isHovered ? 0.7 : 0.5}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      className="cursor-pointer transition-all duration-150"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(area.id);
      }}
      onMouseEnter={() => onHover(area.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        filter: isSelected ? 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2))' : 'none',
      }}
    />
  );
});

AreaPolygon.displayName = 'AreaPolygon';

const AreaVertices = memo(({ area, isSelected, isEditing, onPointDrag, onPointDragEnd }) => {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const dragRef = useRef(null);
  
  const handleMouseDown = useCallback((e, index) => {
    e.stopPropagation();
    setDraggingIndex(index);
  }, []);
  
  useEffect(() => {
    if (draggingIndex === null) return;
    
    const handleMouseMove = (e) => {
      const svg = dragRef.current?.ownerSVGElement;
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const panOffset = useAreaPlanStore.getState().panOffset;
      const zoom = useAreaPlanStore.getState().zoom;
      
      const x = (e.clientX - rect.left - panOffset.x) / zoom;
      const y = (e.clientY - rect.top - panOffset.y) / zoom;
      
      onPointDrag(area.id, draggingIndex, { x, y });
    };
    
    const handleMouseUp = () => {
      setDraggingIndex(null);
      onPointDragEnd();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIndex, area.id, onPointDrag, onPointDragEnd]);
  
  if (!isSelected && !isEditing) return null;
  
  return (
    <g ref={dragRef}>
      {area.points.map((point, index) => (
        <g key={index}>
          <circle
            cx={point.x}
            cy={point.y}
            r={8}
            fill="white"
            stroke="#2563eb"
            strokeWidth={2}
            className="cursor-move"
            onMouseDown={(e) => handleMouseDown(e, index)}
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
            }}
          />
          <circle
            cx={point.x}
            cy={point.y}
            r={3}
            fill="#2563eb"
            className="pointer-events-none"
          />
        </g>
      ))}
    </g>
  );
});

AreaVertices.displayName = 'AreaVertices';

const AreaLabel = memo(({ area, isSelected, isEditing, onLabelEdit }) => {
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(area.label);
  const inputRef = useRef(null);
  
  const centroid = getCentroid(area.points);
  
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);
  
  const handleSubmit = () => {
    onLabelEdit(area.id, labelValue);
    setEditing(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setLabelValue(area.label);
      setEditing(false);
    }
  };
  
  return (
    <g>
      {editing ? (
        <foreignObject
          x={centroid.x - 60}
          y={centroid.y - 14}
          width={120}
          height={28}
        >
          <input
            ref={inputRef}
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-xs text-center bg-white border-2 border-blue-500 rounded outline-none shadow"
            style={{ fontSize: '11px', fontWeight: 600 }}
          />
        </foreignObject>
      ) : (
        <g
          onClick={(e) => {
            e.stopPropagation();
            if (isSelected) {
              setEditing(true);
            }
          }}
          className={isSelected ? 'cursor-text' : 'pointer-events-none'}
        >
          <text
            x={centroid.x}
            y={centroid.y - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fontWeight={600}
            fill="#1f2937"
            className="select-none"
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {area.label}
          </text>
          <text
            x={centroid.x}
            y={centroid.y + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="#6b7280"
            fontFamily="monospace"
            className="select-none"
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {formatArea(area.areaSize)}
          </text>
        </g>
      )}
    </g>
  );
});

AreaLabel.displayName = 'AreaLabel';

const AreaItem = memo(({ 
  area, 
  isSelected, 
  isHovered, 
  isEditing,
  onSelect, 
  onHover,
  onPointDrag,
  onPointDragEnd,
  onLabelEdit,
}) => {
  return (
    <g>
      <AreaPolygon
        area={area}
        isSelected={isSelected}
        isHovered={isHovered}
        isEditing={isEditing}
        onSelect={onSelect}
        onHover={onHover}
      />
      <AreaVertices
        area={area}
        isSelected={isSelected}
        isEditing={isEditing}
        onPointDrag={onPointDrag}
        onPointDragEnd={onPointDragEnd}
      />
      <AreaLabel
        area={area}
        isSelected={isSelected}
        isEditing={isEditing}
        onLabelEdit={onLabelEdit}
      />
    </g>
  );
});

AreaItem.displayName = 'AreaItem';

const AreaLayer = memo(({
  areas,
  selectedAreaId,
  hoveredAreaId,
  editingAreaId,
  onSelect,
  onHover,
  onPointDrag,
  onPointDragEnd,
  onLabelEdit,
}) => {
  return (
    <g>
      {areas.map((area) => (
        <AreaItem
          key={area.id}
          area={area}
          isSelected={selectedAreaId === area.id}
          isHovered={hoveredAreaId === area.id}
          isEditing={editingAreaId === area.id}
          onSelect={onSelect}
          onHover={onHover}
          onPointDrag={onPointDrag}
          onPointDragEnd={onPointDragEnd}
          onLabelEdit={onLabelEdit}
        />
      ))}
    </g>
  );
});

AreaLayer.displayName = 'AreaLayer';

export default AreaLayer;
