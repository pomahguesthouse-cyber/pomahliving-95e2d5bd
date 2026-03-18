import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import useBuilderStore from '@/features/builder/builderStore';

const PRESETS = [
  { label: '6 x 8m', w: 6, l: 8 },
  { label: '8 x 10m', w: 8, l: 10 },
  { label: '10 x 12m', w: 10, l: 12 },
  { label: '12 x 15m', w: 12, l: 15 },
  { label: '15 x 20m', w: 15, l: 20 },
];

const InputLand = () => {
  const navigate = useNavigate();
  const setLandSize = useBuilderStore((state) => state.setLandSize);
  const clearAll = useBuilderStore((state) => state.clearAll);

  const [width, setWidth] = useState(10);
  const [length, setLength] = useState(12);

  const handlePreset = (preset) => {
    setWidth(preset.w);
    setLength(preset.l);
  };

  const handleContinue = () => {
    setLandSize(width, length);
    clearAll();
    navigate('/builder');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      <nav className="container mx-auto px-6 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} /> Kembali
        </a>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-sm mb-6">
              <Home size={16} />
              Langkah 1 dari 2
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ukuran Tanah Anda
            </h1>
            <p className="text-slate-400">
              Masukkan dimensi tanah untuk memulai desain rumah modular Anda.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Lebar (meter)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={4}
                  max={30}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Panjang (meter)</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  min={4}
                  max={30}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm text-slate-400 mb-3">Preset Ukuran</label>
              <div className="grid grid-cols-5 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      width === preset.w && length === preset.l
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Luas Tanah</span>
                <span className="text-2xl font-bold text-white">{width * length} m²</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
            >
              Lanjut ke Desain <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default InputLand;
