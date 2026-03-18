import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Download, Home, CheckCircle } from 'lucide-react';
import useBuilderStore from '@/features/builder/builderStore';
import {
  formatCurrency,
  calculateTotalPrice,
  calculateTotalArea,
  getPriceBreakdown,
} from '@/features/builder/priceCalculator';
import { MODULES } from '@/features/builder/moduleConfig';

const Review = () => {
  const navigate = useNavigate();
  const { landSize, modules } = useBuilderStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totalPrice = calculateTotalPrice(modules);
  const totalArea = calculateTotalArea(modules);
  const breakdown = getPriceBreakdown(modules);

  const handleWhatsApp = () => {
    const message = `Halo, saya ${name} sudah membuat desain rumah modular di Pomah Living:
    
Luas Tanah: ${landSize.w}m x ${landSize.l}m
Total Modul: ${modules.length}
Luas Bangunan: ${totalArea.toFixed(1)}m²
Total Estimasi Biaya: ${formatCurrency(totalPrice)}

Rincian Modul:
${breakdown.map((m) => `- ${m.label} (${m.size})`).join('\n')}

Mohon info lebih lanjut. Terima kasih!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    handleWhatsApp();
  };

  const getModuleIcon = (type) => {
    const mod = MODULES.find((m) => m.type === type);
    return mod?.icon || '🏠';
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="container mx-auto px-6 py-6">
        <button
          onClick={() => navigate('/builder')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /> Kembali ke Editor
        </button>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm mb-6">
              <CheckCircle size={16} />
              Desain Selesai
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Review Desain Anda
            </h1>
            <p className="text-slate-400">
              Periksa ringkasan desain dan hubungi kami untuk konsultasi.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Home size={20} />
                Detail Properti
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-400">Luas Tanah</span>
                  <span className="text-white font-medium">
                    {landSize.w}m x {landSize.l}m ({landSize.w * landSize.l}m²)
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-400">Jumlah Modul</span>
                  <span className="text-white font-medium">{modules.length}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-400">Luas Bangunan</span>
                  <span className="text-white font-medium">{totalArea.toFixed(1)}m²</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-400">Estimasi Biaya</span>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {breakdown.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg"
                  >
                    <span className="text-xl">{getModuleIcon(item.label.toLowerCase().replace(' ', ''))}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-slate-400 text-xs">
                        {item.size} • {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Hubungi Kami
              </h2>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-400" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    WhatsApp terbuka!
                  </h3>
                  <p className="text-slate-400">
                    Kirim pesan untuk konsultasi gratis dengan tim kami.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Masukkan nama Anda"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
                  >
                    <Send size={18} />
                    Kirim via WhatsApp
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Review;
