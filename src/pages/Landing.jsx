import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Home, Building2, Ruler, CheckCircle, PenTool, LayoutGrid } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#12121f] to-[#0a0a14]">
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            pomah<span className="text-cyan-400">living</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link
              to="/floorplan"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <LayoutGrid size={16} />
              2D Planner
            </Link>
            <Link
              to="/ai-admin"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              AI Admin
            </Link>
            <Link
              to="/floorplan"
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-sm mb-8">
            <Building2 size={16} />
            2D Floor Plan Drafting Tool
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
            Rancang Rumah
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Impian Anda
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Gambar denah rumah lebih cepat dengan alur line-drawing yang fokus, presisi, dan mudah dipakai sejak tahap sketsa awal.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/floorplan"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-cyan-500/25 flex items-center gap-3"
            >
              <PenTool size={22} />
              Mulai Gambar Denah
            </Link>
            <Link
              to="/floorplan"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 flex items-center gap-3"
            >
              <PenTool size={22} />
              2D Floor Planner
            </Link>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-1 gap-8 max-w-6xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl p-8 hover:border-cyan-500/30 transition-all group"
          >
            <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PenTool size={28} className="text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">2D Floor Planner</h3>
            <p className="text-gray-400 mb-6">
              Gambar denah rumah dengan presisi. Tambahkan dinding, pintu, jendela, dan ukuran secara cepat.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                Fokus garis denah 2D
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                Draw walls & rooms
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                Auto dimension labels
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            {
              icon: Home,
              title: 'Sketsa Denah Cepat',
              desc: 'Mulai dari garis dasar layout rumah tanpa distraksi fitur yang tidak dibutuhkan',
            },
            {
              icon: Ruler,
              title: 'Ukuran Presisi',
              desc: 'Atur dimensi dinding dan ruang dengan grid serta snapping yang konsisten',
            },
            {
              icon: CheckCircle,
              title: 'Siap Lanjut Detail',
              desc: 'Jadikan denah baseline yang rapi sebelum masuk ke tahap desain lanjutan',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
            >
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="container mx-auto px-6 py-8 border-t border-white/5">
        <p className="text-center text-gray-500 text-sm">
          © 2024 Pomah Living. Jasa Desain Arsitektur & Interior.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
