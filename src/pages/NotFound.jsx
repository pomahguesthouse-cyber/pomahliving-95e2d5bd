import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-8xl font-bold text-slate-700 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-slate-400 mb-8">
          Maaf, halaman yang Anda cari tidak ada.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
        >
          <Home size={18} />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
