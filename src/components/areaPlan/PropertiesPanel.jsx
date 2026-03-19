import { useState, useEffect } from 'react';
import { X, Palette } from 'lucide-react';
import useAreaPlanStore from '@/features/areaPlan/areaPlanStore';
import { AREA_COLORS, formatArea, getPolygonArea } from '@/features/areaPlan/geometryUtils';

const AREA_PRESETS = [
  { label: 'Living Room', value: 'living' },
  { label: 'Bedroom', value: 'bedroom' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Bathroom', value: 'bathroom' },
  { label: 'Dining Room', value: 'dining' },
  { label: 'Office', value: 'office' },
  { label: 'Garage', value: 'garage' },
  { label: 'Garden', value: 'garden' },
  { label: 'Terrace', value: 'terrace' },
];

const COLOR_SWATCHES = [
  { fill: '#e0f2fe', stroke: '#0ea5e9', name: 'Sky' },
  { fill: '#fce7f3', stroke: '#ec4899', name: 'Pink' },
  { fill: '#dbeafe', stroke: '#3b82f6', name: 'Blue' },
  { fill: '#fef3c7', stroke: '#f59e0b', name: 'Amber' },
  { fill: '#d1fae5', stroke: '#10b981', name: 'Green' },
  { fill: '#fee2e2', stroke: '#ef4444', name: 'Red' },
  { fill: '#e9d5ff', stroke: '#8b5cf6', name: 'Purple' },
  { fill: '#f3f4f6', stroke: '#6b7280', name: 'Gray' },
  { fill: '#ffedd5', stroke: '#fb923c', name: 'Orange' },
  { fill: '#dcfce7', stroke: '#22c55e', name: 'Lime' },
];

const PropertiesPanel = () => {
  const { areas, selectedAreaId, updateAreaLabel, updateAreaColor, deselectArea } = useAreaPlanStore();
  
  const selectedArea = areas.find((a) => a.id === selectedAreaId);
  
  if (!selectedArea) return null;
  
  return (
    <div className="absolute top-20 right-4 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Area Properties</h3>
        <button
          onClick={deselectArea}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Label
          </label>
          <input
            type="text"
            value={selectedArea.label}
            onChange={(e) => updateAreaLabel(selectedArea.id, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AREA_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  const colors = AREA_COLORS[preset.value] || AREA_COLORS.default;
                  updateAreaColor(selectedArea.id, colors.fill, colors.stroke);
                  updateAreaLabel(selectedArea.id, preset.label);
                }}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.name}
                onClick={() => updateAreaColor(selectedArea.id, swatch.fill, swatch.stroke)}
                className={`
                  w-10 h-10 rounded-lg border-2 transition-all
                  ${selectedArea.fillColor === swatch.fill 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                style={{ backgroundColor: swatch.fill }}
                title={swatch.name}
              >
                <div 
                  className="w-full h-1/2 rounded-t-lg"
                  style={{ backgroundColor: swatch.stroke }}
                />
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Area Size</span>
            <span className="font-mono font-medium text-gray-800">
              {formatArea(selectedArea.areaSize)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-500">Points</span>
            <span className="font-mono text-gray-600">
              {selectedArea.points.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
