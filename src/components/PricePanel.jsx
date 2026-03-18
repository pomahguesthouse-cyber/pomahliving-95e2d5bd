import useBuilderStore from '../features/builder/builderStore';
import {
  formatCurrency,
  calculateTotalPrice,
  calculateTotalArea,
  getPriceBreakdown,
} from '../features/builder/priceCalculator';
import { MessageCircle, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricePanel = () => {
  const { modules, landSize, clearAll } = useBuilderStore();
  const navigate = useNavigate();

  const totalPrice = calculateTotalPrice(modules);
  const totalArea = calculateTotalArea(modules);
  const breakdown = getPriceBreakdown(modules);

  const handleWhatsApp = () => {
    const message = `Halo, saya sudah membuat desain rumah modular:
    
Luas Tanah: ${landSize.w}m x ${landSize.l}m
Total Modul: ${modules.length}
Luas Bangunan: ${totalArea.toFixed(1)}m²
Total Estimasi Biaya: ${formatCurrency(totalPrice)}

Mohon info lebih lanjut. Terima kasih!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleDownload = () => {
    navigate('/review');
  };

  return (
    <div className="w-72 bg-[#1a1a2e] border-l border-[#2d2d42] flex flex-col h-full">
      <div className="p-3 border-b border-[#2d2d42]">
        <h2 className="text-sm font-semibold text-white">Summary</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {landSize.w}m × {landSize.l}m · {landSize.w * landSize.l}m²
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg p-4 border border-cyan-500/20">
          <div className="text-xl font-bold text-white">
            {formatCurrency(totalPrice)}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            Estimated Cost
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#232338] rounded-lg p-2.5 text-center">
            <div className="text-base font-semibold text-white">{modules.length}</div>
            <div className="text-[10px] text-gray-500">Modules</div>
          </div>
          <div className="bg-[#232338] rounded-lg p-2.5 text-center">
            <div className="text-base font-semibold text-white">{totalArea.toFixed(1)}m²</div>
            <div className="text-[10px] text-gray-500">Area</div>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Module Breakdown
            </h3>
            <div className="space-y-1">
              {breakdown.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-xs py-1.5 px-2 bg-[#232338] rounded"
                >
                  <div>
                    <p className="text-gray-200">{item.label}</p>
                    <p className="text-[10px] text-gray-500">
                      {item.size} · {item.area}m²
                    </p>
                  </div>
                  <p className="text-gray-300 font-medium">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#2d2d42] space-y-2">
        <button
          onClick={handleWhatsApp}
          disabled={modules.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-400 disabled:bg-[#2d2d42] disabled:text-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>
        <button
          onClick={handleDownload}
          disabled={modules.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-[#2d2d42] disabled:text-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download size={16} />
          Review & Export
        </button>
        {modules.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Delete all modules?')) clearAll();
            }}
            className="w-full flex items-center justify-center gap-1 px-4 py-2 text-gray-500 hover:text-red-400 text-xs transition-colors"
          >
            <Trash2 size={12} />
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default PricePanel;
