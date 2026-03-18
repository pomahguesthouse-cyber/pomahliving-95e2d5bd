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
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Ringkasan</h2>
        <p className="text-xs text-slate-400 mt-1">
          {landSize.w}m x {landSize.l}m ({landSize.w * landSize.l}m²)
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">
            {formatCurrency(totalPrice)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Total estimasi biaya
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">{modules.length}</div>
            <div className="text-xs text-slate-400">Modul</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">{totalArea.toFixed(1)}m²</div>
            <div className="text-xs text-slate-400">Luas</div>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">
              Detail Modul
            </h3>
            <div className="space-y-2">
              {breakdown.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm py-2 border-b border-slate-700/50 last:border-0"
                >
                  <div>
                    <p className="text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">
                      {item.size} ({item.area}m²)
                    </p>
                  </div>
                  <p className="text-slate-300 font-medium">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <button
          onClick={handleWhatsApp}
          disabled={modules.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <MessageCircle size={18} />
          Konsultasi via WhatsApp
        </button>
        <button
          onClick={handleDownload}
          disabled={modules.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <Download size={18} />
          Review & Download
        </button>
        {modules.length > 0 && (
          <button
            onClick={clearAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <Trash2 size={14} />
            Hapus Semua
          </button>
        )}
      </div>
    </div>
  );
};

export default PricePanel;
