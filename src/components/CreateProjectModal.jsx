import { useState } from 'react';
import { Upload, Plus, X, FileImage, FileText, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useBuilderStore from '@/features/builder/builderStore';

const CreateProjectModal = ({ onClose }) => {
  const navigate = useNavigate();
  const setLandSize = useBuilderStore((state) => state.setLandSize);
  const clearAll = useBuilderStore((state) => state.clearAll);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (validTypes.includes(file.type) || file.name.endsWith('.dwg') || file.name.endsWith('.dxf')) {
      setUploadedFile(file);
    } else {
      alert('File type not supported. Please upload JPG, PNG, WEBP, PDF, DWG, or DXF files.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUploadSubmit = () => {
    if (uploadedFile) {
      navigate('/builder', { state: { uploadedFile } });
    }
  };

  const handleBlankProject = () => {
    setLandSize(10, 12);
    clearAll();
    navigate('/builder');
  };

  const fileTypes = [
    { type: 'JPG', color: 'bg-orange-500/80' },
    { type: 'PNG', color: 'bg-blue-500/80' },
    { type: 'PDF', color: 'bg-red-500/80' },
    { type: 'DWG', color: 'bg-green-500/80' },
    { type: 'DXF', color: 'bg-purple-500/80' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-[#2d2d42]">
        <div className="flex items-center justify-between p-5 border-b border-[#2d2d42]">
          <h1 className="text-xl font-bold text-white">
            Create your floor plan
          </h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2d2d42] rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div
              onClick={() => document.getElementById('fileInput').click()}
              className={`
                relative bg-[#232338] border-2 border-dashed rounded-xl p-6 cursor-pointer
                transition-all duration-200 ease-out
                ${isDragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-[#3d3d5c] hover:border-cyan-400/50 hover:bg-[#2a2a42]'}
                ${uploadedFile ? 'border-cyan-400 bg-cyan-500/10' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="fileInput"
                accept=".jpg,.jpeg,.png,.pdf,.webp,.dwg,.dxf"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    {uploadedFile.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(uploadedFile)}
                        alt="Preview"
                        className="max-h-36 rounded-lg object-contain border border-[#3d3d5c]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-[#1a1a2e] rounded-lg border border-[#3d3d5c]">
                        <FileText size={40} className="text-gray-500 mb-2" />
                        <p className="text-xs text-gray-400">{uploadedFile.name}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle size={18} className="text-green-400" />
                    <span className="text-sm text-green-400 font-medium">File uploaded!</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadSubmit();
                    }}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg transition-colors"
                  >
                    Continue with file
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 mx-auto bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Upload size={28} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">
                      Upload floor plan
                    </h3>
                    <p className="text-xs text-gray-400">
                      Convert your 2D floor plan to 3D design automatically
                    </p>
                  </div>

                  <div className={`border-2 border-dashed rounded-lg p-5 transition-colors ${isDragging ? 'border-cyan-400 bg-cyan-500/5' : 'border-[#3d3d5c]'}`}>
                    <FileImage size={28} className="mx-auto text-gray-500 mb-2" />
                    <p className="text-sm text-gray-300 font-medium">
                      Click to upload
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      or drag and drop
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    {fileTypes.map(({ type, color }) => (
                      <span
                        key={type}
                        className={`px-2 py-0.5 text-[10px] font-semibold text-white rounded ${color}`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              onClick={handleBlankProject}
              className="relative bg-[#232338] border-2 border-dashed border-[#3d3d5c] rounded-xl p-6 cursor-pointer hover:border-green-400/50 hover:bg-[#2a2a42] transition-all duration-200 ease-out group"
            >
              <div className="text-center space-y-4">
                <div className="w-14 h-14 mx-auto bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <Plus size={28} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Create blank project
                  </h3>
                  <p className="text-xs text-gray-400">
                    Start from scratch with modular house builder
                  </p>
                </div>

                <div className="relative h-28 bg-[#1a1a2e] rounded-lg overflow-hidden border border-[#2d2d42]">
                  <svg viewBox="0 0 200 110" className="w-full h-full">
                    <rect x="10" y="10" width="80" height="50" fill="none" stroke="#3d3d5c" strokeWidth="1.5" strokeDasharray="3" />
                    <rect x="100" y="10" width="90" height="40" fill="none" stroke="#3d3d5c" strokeWidth="1.5" strokeDasharray="3" />
                    <rect x="100" y="60" width="40" height="40" fill="none" stroke="#3d3d5c" strokeWidth="1.5" strokeDasharray="3" />
                    <rect x="150" y="60" width="40" height="40" fill="none" stroke="#3d3d5c" strokeWidth="1.5" strokeDasharray="3" />
                    
                    <rect x="18" y="18" width="22" height="18" fill="#22c55e" fillOpacity="0.4" stroke="#22c55e" strokeWidth="0.5" rx="1" />
                    <rect x="50" y="18" width="32" height="18" fill="#6366f1" fillOpacity="0.4" stroke="#6366f1" strokeWidth="0.5" rx="1" />
                    <rect x="108" y="18" width="28" height="28" fill="#f97316" fillOpacity="0.4" stroke="#f97316" strokeWidth="0.5" rx="1" />
                    <rect x="152" y="68" width="22" height="18" fill="#22d3ee" fillOpacity="0.4" stroke="#22d3ee" strokeWidth="0.5" rx="1" />
                    
                    <line x1="0" y1="20" x2="200" y2="20" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="0" y1="40" x2="200" y2="40" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="0" y1="60" x2="200" y2="60" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="0" y1="80" x2="200" y2="80" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="20" y1="0" x2="20" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="40" y1="0" x2="40" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="60" y1="0" x2="60" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="80" y1="0" x2="80" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="100" y1="0" x2="100" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="120" y1="0" x2="120" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="140" y1="0" x2="140" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="160" y1="0" x2="160" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                    <line x1="180" y1="0" x2="180" y2="110" stroke="#2d2d42" strokeWidth="0.5" />
                  </svg>
                </div>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-2 px-5 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-400 transition-colors">
                    Start Building
                    <Plus size={14} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#12121f] px-6 py-3 border-t border-[#2d2d42]">
          <p className="text-[11px] text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
