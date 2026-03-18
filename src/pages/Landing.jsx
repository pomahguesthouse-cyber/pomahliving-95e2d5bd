import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Home, Building2, Ruler, CheckCircle } from 'lucide-react';
import CreateProjectModal from '@/components/CreateProjectModal';

const Landing = () => {
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            pomah<span className="text-cyan-400">living</span>
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            Get Started <ArrowRight size={18} />
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-sm mb-6">
            <Building2 size={16} />
            Modular House Builder
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Rancang Rumah Modul
            <span className="block text-cyan-400">Impian Anda</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Desain rumah modular dengan mudah. Tambahkan modul, atur layout, 
            dan dapatkan estimasi biaya secara real-time.
          </p>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
          >
            Buat Floor Plan <ArrowRight size={22} />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            {
              icon: Home,
              title: 'Modular Design',
              desc: 'Pilih dari berbagai modul seperti kamar tidur, dapur, dan ruang tamu',
            },
            {
              icon: Ruler,
              title: 'Ukuran Fleksibel',
              desc: 'Sesuaikan ukuran tanah dan modul sesuai kebutuhan Anda',
            },
            {
              icon: CheckCircle,
              title: 'Estimasi Instan',
              desc: 'Lihat estimasi biaya secara real-time saat merancang',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors"
            >
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="container mx-auto px-6 py-8 border-t border-slate-800">
        <p className="text-center text-slate-500 text-sm">
          © 2024 Pomah Living. Jasa Desain Arsitektur & Interior.
        </p>
      </footer>

      {showModal && (
        <CreateProjectModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default Landing;
