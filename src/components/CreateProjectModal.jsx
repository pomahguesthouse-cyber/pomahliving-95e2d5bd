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
    { type: 'JPG', color: 'bg-orange-500' },
    { type: 'PNG', color: 'bg-blue-500' },
    { type: 'PDF', color: 'bg-red-500' },
    { type: 'DWG', color: 'bg-green-500' },
    { type: 'DXF', color: 'bg-purple-500' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            Create your own floor plan
          </h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => document.getElementById('fileInput').click()}
              className={`
                relative bg-white border-2 border-dashed rounded-2xl p-8 cursor-pointer
                transition-all duration-200 ease-out
                ${isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-400 hover:shadow-lg'}
                ${uploadedFile ? 'ring-2 ring-cyan-500' : ''}
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
                        className="max-h-40 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 bg-slate-100 rounded-lg">
                        <FileText size={48} className="text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600">{uploadedFile.name}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle size={20} className="text-green-500" />
                    <span className="text-sm text-green-600 font-medium">File uploaded!</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadSubmit();
                    }}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    Continue with this file
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-cyan-100 rounded-2xl flex items-center justify-center">
                    <Upload size={32} className="text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      Upload floor plan
                    </h3>
                    <p className="text-sm text-slate-500">
                      Convert your 2D floor plan to 3D design automatically, or use it as a base map.
                    </p>
                  </div>

                  <div className={`border-2 border-dashed rounded-xl p-6 transition-colors ${isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300'}`}>
                    <FileImage size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 font-medium">
                      Click to upload your file
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      or drag and drop
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    {fileTypes.map(({ type, color }) => (
                      <span
                        key={type}
                        className={`px-2 py-1 text-xs font-semibold text-white rounded ${color}`}
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
              className="relative bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-green-400 hover:shadow-lg transition-all duration-200 ease-out group"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Plus size={32} className="text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    Create blank project
                  </h3>
                  <p className="text-sm text-slate-500">
                    Quickly draw rooms by adding walls or modules. Start from scratch with our modular house builder.
                  </p>
                </div>

                <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl overflow-hidden border border-slate-200">
                  <svg viewBox="0 0 200 120" className="w-full h-full">
                    <rect x="10" y="10" width="80" height="60" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
                    <rect x="100" y="10" width="90" height="50" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
                    <rect x="100" y="70" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
                    <rect x="150" y="70" width="40" height="40" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
                    
                    <rect x="20" y="20" width="25" height="20" fill="#22c55e" fillOpacity="0.3" stroke="#22c55e" strokeWidth="1" />
                    <rect x="55" y="20" width="25" height="20" fill="#6366f1" fillOpacity="0.3" stroke="#6366f1" strokeWidth="1" />
                    <rect x="110" y="20" width="30" height="30" fill="#f97316" fillOpacity="0.3" stroke="#f97316" strokeWidth="1" />
                    <rect x="155" y="80" width="25" height="20" fill="#22d3ee" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="1" />
                    
                    <line x1="0" y1="0" x2="200" y2="120" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="0" y1="20" x2="200" y2="20" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="0" y1="40" x2="200" y2="40" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="0" y1="60" x2="200" y2="60" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="0" y1="80" x2="200" y2="80" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="200" y2="100" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="20" y1="0" x2="20" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="40" y1="0" x2="40" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="60" y1="0" x2="60" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="80" y1="0" x2="80" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="100" y1="0" x2="100" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="120" y1="0" x2="120" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="140" y1="0" x2="140" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="160" y1="0" x2="160" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                    <line x1="180" y1="0" x2="180" y2="120" stroke="#e2e8f0" strokeWidth="0.5" />
                  </svg>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors">
                    Start building
                    <Plus size={16} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
