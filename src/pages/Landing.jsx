import { motion } from 'framer-motion';
import { ArrowRight, Home, Palette, DollarSign, Shield } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            pomah<span className="text-indigo-400">living</span>
          </h1>
          <a
            href="/input-land"
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            Mulai Bangun <ArrowRight size={18} />
          </a>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-8">
            <Home size={16} />
            Modular House Builder
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Rancang Rumah Modul
            <span className="block text-indigo-400">Impian Anda</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
            Desain rumah modular dengan mudah. Tambahkan modul, atur layout, 
            dan dapatkan estimasi biaya secara real-time.
          </p>

          <a
            href="/input-land"
            className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105"
          >
            Mulai Desain Gratis <ArrowRight size={22} />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mt-24"
        >
          {[
            {
              icon: Palette,
              title: 'Desain Interaktif',
              desc: 'Drag & drop modul dengan mudah dalam tampilan 3D',
            },
            {
              icon: DollarSign,
              title: 'Harga Transparan',
              desc: 'Lihat estimasi biaya secara real-time saat desain',
            },
            {
              icon: Shield,
              title: 'Konsultasi Ahli',
              desc: 'Hubungi tim kami via WhatsApp untuk konsultasi',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-indigo-500/50 transition-colors"
            >
              <div className="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="text-indigo-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="container mx-auto px-6 py-8 border-t border-slate-800">
        <p className="text-center text-slate-500 text-sm">
          © 2024 Pomah Living. Jasa Desain Arsitektur & Interior.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
