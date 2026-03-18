import { useState, useEffect } from 'react';
import { Upload, Plus, X, FileImage, FileText, CheckCircle, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useBuilderStore from '@/features/builder/builderStore';

const CreateProjectModal = ({ onClose }) => {
  const navigate = useNavigate();
  const setLandSize = useBuilderStore((state) => state.setLandSize);
  const clearAll = useBuilderStore((state) => state.clearAll);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (uploadedFile && uploadedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

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
      setActiveStep(1);
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

  const handleAutoGenerate = async () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockRooms = [
        { type: 'bedroom', x: 1.5, z: 1.5, w: 3, l: 3 },
        { type: 'bathroom', x: 6.5, z: 1.5, w: 2, l: 1.5 },
        { type: 'kitchen', x: 1.5, z: 5.5, w: 3, l: 2 },
        { type: 'living', x: 6.5, z: 4, w: 4, l: 3 },
      ];
      
      mockRooms.forEach((room) => {
        setLandSize(10, 12);
        const { addModule } = useBuilderStore.getState();
        const { MODULES } = require('@/features/builder/moduleConfig');
        const moduleConfig = MODULES.find(m => m.type === room.type);
        if (moduleConfig) {
          const newModule = {
            ...moduleConfig,
            id: `${room.type}-${Date.now()}-${Math.random()}`,
            x: room.x,
            z: room.z,
            w: room.w,
            l: room.l,
            rotation: 0,
            visible: true,
          };
          addModule(newModule);
        }
      });
      
      navigate('/builder');
    } catch (error) {
      alert("We couldn't detect perfectly. You can adjust manually.");
      navigate('/builder');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBlankProject = () => {
    setLandSize(10, 12);
    clearAll();
    navigate('/builder');
  };

  const fileTypes = [
    { type: 'JPG', color: 'bg-orange-500/70' },
    { type: 'PNG', color: 'bg-blue-500/70' },
    { type: 'PDF', color: 'bg-red-500/70' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a14] rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-white/5">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Create your floor plan
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose how you want to start your project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/5 rounded-xl transition-colors group"
          >
            <X size={18} className="text-gray-500 group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="p-8">
          {activeStep === 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div
                onClick={() => document.getElementById('fileInput').click()}
                className={`
                  relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-8 cursor-pointer
                  transition-all duration-300 ease-out border border-white/10
                  hover:border-cyan-500/30 hover:shadow-[0_0_60px_-15px_rgba(6,182,212,0.3)]
                  ${isDragging ? 'border-cyan-400 bg-cyan-500/10' : ''}
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

                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                      <Upload size={36} className="text-cyan-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                      <Sparkles size={12} className="text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Upload floor plan
                    </h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                      We'll analyze your 2D floor plan and convert it into an editable 3D layout
                    </p>
                  </div>

                  <div className={`
                    border-2 border-dashed rounded-xl p-8 transition-all duration-200
                    ${isDragging ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}
                  `}>
                    <FileImage size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-sm text-gray-300 font-medium">
                      Drag & drop your file here
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      or click to browse
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {fileTypes.map(({ type, color }) => (
                      <span
                        key={type}
                        className={`px-2.5 py-1 text-[10px] font-semibold text-white rounded-md ${color}`}
                      >
                        {type}
                      </span>
                    ))}
                    <span className="px-2.5 py-1 text-[10px] font-semibold text-white rounded-md bg-purple-500/70">
                      CAD
                    </span>
                  </div>
                </div>
              </div>

              <div
                onClick={handleBlankProject}
                className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl p-8 cursor-pointer border border-white/10 hover:border-green-500/30 hover:shadow-[0_0_60px_-15px_rgba(34,197,94,0.3)] transition-all duration-300 ease-out group"
              >
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-2xl flex items-center justify-center border border-green-500/20 group-hover:border-green-500/40 transition-colors">
                    <Plus size={36} className="text-green-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Start from scratch
                    </h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                      Build your modular home design with our intuitive drag-and-drop tools
                    </p>
                  </div>

                  <div className="relative h-36 bg-[#0f0f1a] rounded-xl overflow-hidden border border-white/5">
                    <svg viewBox="0 0 280 140" className="w-full h-full">
                      <defs>
                        <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1e1e2e" />
                          <stop offset="100%" stopColor="#12121f" />
                        </linearGradient>
                      </defs>
                      <rect fill="url(#gridGrad)" width="280" height="140" />
                      
                      <g opacity="0.3">
                        {[...Array(14)].map((_, i) => (
                          <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="140" stroke="#2d2d42" strokeWidth="0.5" />
                        ))}
                        {[...Array(7)].map((_, i) => (
                          <line key={`h${i}`} x1="0" y1={i * 20} x2="280" y2={i * 20} stroke="#2d2d42" strokeWidth="0.5" />
                        ))}
                      </g>
                      
                      <rect x="20" y="20" width="100" height="70" fill="none" stroke="#3d3d5c" strokeWidth="1" strokeDasharray="4" rx="2" />
                      <rect x="140" y="20" width="120" height="50" fill="none" stroke="#3d3d5c" strokeWidth="1" strokeDasharray="4" rx="2" />
                      <rect x="140" y="85" width="55" height="45" fill="none" stroke="#3d3d5c" strokeWidth="1" strokeDasharray="4" rx="2" />
                      <rect x="205" y="85" width="55" height="45" fill="none" stroke="#3d3d5c" strokeWidth="1" strokeDasharray="4" rx="2" />
                      
                      <rect x="28" y="28" width="35" height="25" fill="#22c55e" fillOpacity="0.5" stroke="#22c55e" strokeWidth="0.5" rx="1" />
                      <rect x="72" y="28" width="40" height="25" fill="#6366f1" fillOpacity="0.5" stroke="#6366f1" strokeWidth="0.5" rx="1" />
                      <rect x="28" y="60" width="35" height="22" fill="#f97316" fillOpacity="0.5" stroke="#f97316" strokeWidth="0.5" rx="1" />
                      <rect x="72" y="60" width="40" height="22" fill="#8b5cf6" fillOpacity="0.5" stroke="#8b5cf6" strokeWidth="0.5" rx="1" />
                      <rect x="148" y="28" width="45" height="35" fill="#22d3ee" fillOpacity="0.5" stroke="#22d3ee" strokeWidth="0.5" rx="1" />
                      <rect x="200" y="28" width="52" height="35" fill="#ec4899" fillOpacity="0.5" stroke="#ec4899" strokeWidth="0.5" rx="1" />
                      <rect x="148" y="92" width="42" height="32" fill="#a855f7" fillOpacity="0.5" stroke="#a855f7" strokeWidth="0.5" rx="1" />
                      <rect x="213" y="92" width="42" height="32" fill="#14b8a6" fillOpacity="0.5" stroke="#14b8a6" strokeWidth="0.5" rx="1" />
                    </svg>
                  </div>

                  <button className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200">
                    Start Building
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && uploadedFile && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveStep(0);
                    setUploadedFile(null);
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <span className="text-gray-600">|</span>
                <span className="text-sm text-white font-medium">Review your upload</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#12121f] rounded-2xl p-6 border border-white/5">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Uploaded File</h3>
                  
                  {previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={previewUrl}
                        alt="Floor plan preview"
                        className="w-full h-64 object-contain bg-[#0a0a14]"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-xs text-white">{uploadedFile.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 bg-[#1a1a2e] rounded-xl flex items-center justify-center border border-white/5">
                      <div className="text-center">
                        <FileText size={48} className="text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{uploadedFile.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl p-6 border border-cyan-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                        <Wand2 size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">AI Floor Plan Detection</h3>
                        <p className="text-xs text-gray-400">Powered by advanced image analysis</p>
                      </div>
                    </div>
                    
                    <ul className="space-y-2 text-sm text-gray-400 mb-6">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                        Detect walls and room boundaries
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                        Identify room types automatically
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                        Convert to editable 3D modules
                      </li>
                    </ul>

                    <button
                      onClick={handleAutoGenerate}
                      disabled={isAnalyzing}
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Analyzing floor plan...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Auto Generate Layout
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setLandSize(10, 12);
                      clearAll();
                      navigate('/builder', { state: { uploadedFile } });
                    }}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-all duration-200"
                  >
                    Skip & Open in Builder
                  </button>

                  <button
                    onClick={() => {
                      setActiveStep(0);
                      setUploadedFile(null);
                    }}
                    className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    Upload different file
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0a0a14] px-8 py-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-8">
            {[0, 1].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-6 h-1.5 rounded-full transition-colors ${
                  step <= activeStep ? 'bg-cyan-400' : 'bg-white/10'
                }`} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 text-center mt-3">
            Free to use • No credit card required • Export anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
