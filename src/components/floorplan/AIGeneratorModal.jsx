import { useMemo, useState } from 'react';
import { Loader2, Sparkles, Upload, X } from 'lucide-react';
import useFloorPlanStore from '@/features/floorplan/floorPlanStore';
import { mapAIFloorplanToCanvas } from '@/utils/aiFloorplanMapper';
import { generateFloorplanFromImage, generateFloorplanFromSize, submitAIFeedback } from '@/services/aiFloorplanService';

const DEFAULT_FORM = {
  presetId: '',
  landWidth: 10,
  landLength: 12,
  bedrooms: 2,
  bathrooms: 1,
  kitchenType: 'terbuka',
  areaBand: '80-100',
  extras: [],
};

const EXTRA_OPTIONS = ['Garasi', 'Ruang Kerja', 'Laundry', 'Pantry', 'Balkon', 'Gudang'];

const HOUSE_PRESETS = [
  {
    id: '36-72',
    label: 'Tipe 36/72',
    description: 'Rumah kompak 2 kamar',
    values: {
      landWidth: 8,
      landLength: 9,
      bedrooms: 2,
      bathrooms: 1,
      kitchenType: 'terbuka',
      areaBand: '<50',
      extras: [],
    },
  },
  {
    id: '45-90',
    label: 'Tipe 45/90',
    description: 'Rumah tumbuh keluarga kecil',
    values: {
      landWidth: 9,
      landLength: 10,
      bedrooms: 2,
      bathrooms: 2,
      kitchenType: 'terbuka',
      areaBand: '50-80',
      extras: ['Laundry'],
    },
  },
  {
    id: '60-120',
    label: 'Tipe 60/120',
    description: 'Rumah keluarga menengah',
    values: {
      landWidth: 10,
      landLength: 12,
      bedrooms: 3,
      bathrooms: 2,
      kitchenType: 'tertutup',
      areaBand: '80-100',
      extras: ['Garasi', 'Pantry'],
    },
  },
  {
    id: '90-144',
    label: 'Tipe 90/144',
    description: 'Rumah besar dengan ruang tambahan',
    values: {
      landWidth: 12,
      landLength: 12,
      bedrooms: 4,
      bathrooms: 3,
      kitchenType: 'tertutup',
      areaBand: '100-120',
      extras: ['Garasi', 'Ruang Kerja', 'Laundry'],
    },
  },
];

const PlanThumbnail = ({ plan }) => {
  const boundaryWidth = Math.max(plan?.boundary?.width || 1, 1);
  const boundaryHeight = Math.max(plan?.boundary?.height || 1, 1);

  return (
    <svg viewBox={`0 0 ${boundaryWidth + 20} ${boundaryHeight + 20}`} className="w-full h-28 rounded-lg bg-slate-50 border border-slate-200">
      <g transform="translate(10, 10)">
        <rect x="0" y="0" width={boundaryWidth} height={boundaryHeight} fill="#ffffff" stroke="#0f172a" strokeWidth="6" />
        {plan?.rooms?.map((room) => (
          <rect key={room.id || `${room.x}-${room.y}`} x={room.x - (plan?.boundary?.x || 0)} y={room.y - (plan?.boundary?.y || 0)} width={room.width} height={room.height} fill="#dbeafe" stroke="#60a5fa" strokeWidth="4" />
        ))}
        {plan?.walls?.map((wall, index) => (
          <line key={`${wall.x1}-${wall.y1}-${index}`} x1={wall.x1 - (plan?.boundary?.x || 0)} y1={wall.y1 - (plan?.boundary?.y || 0)} x2={wall.x2 - (plan?.boundary?.x || 0)} y2={wall.y2 - (plan?.boundary?.y || 0)} stroke="#334155" strokeWidth={Math.max(6, (wall.thickness || 10) / 2)} strokeLinecap="round" />
        ))}
      </g>
    </svg>
  );
};

const AIGeneratorModal = ({ onClose }) => {
  const [mode, setMode] = useState('size');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    gridSize,
    aiGeneration,
    aiGenerationHistory,
    selectedAIGenerationId,
    startAIGeneration,
    setAIGenerationProgress,
    failAIGeneration,
    applyGeneratedPlan,
    saveAIGenerationVersion,
    resetAIGenerationState,
    selectAIGenerationVersion,
    setUploadedImage,
  } = useFloorPlanStore();

  const isGenerating = aiGeneration.status === 'analyzing' || aiGeneration.status === 'uploading' || aiGeneration.status === 'mapping';

  const historyPreview = useMemo(() => aiGenerationHistory.slice(0, 5), [aiGenerationHistory]);
  const selectedVersion = useMemo(
    () => historyPreview.find((item) => item.id === selectedAIGenerationId) || historyPreview[0] || null,
    [historyPreview, selectedAIGenerationId]
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetValues) => {
    setForm((prev) => ({
      ...prev,
      ...presetValues,
      extras: [...(presetValues.extras || [])],
    }));
  };

  const toggleExtra = (extra) => {
    setForm((prev) => ({
      ...prev,
      extras: prev.extras.includes(extra)
        ? prev.extras.filter((item) => item !== extra)
        : [...prev.extras, extra],
    }));
  };

  const runGeneration = async () => {
    try {
      startAIGeneration({ mode });
      setAIGenerationProgress({ progress: 10, message: 'Menyiapkan permintaan AI...', status: 'analyzing' });

      let aiRawResult;
      if (mode === 'size') {
        aiRawResult = await generateFloorplanFromSize(form, (progress, message) => {
          setAIGenerationProgress({ progress, message, status: 'analyzing' });
        });
      } else {
        if (!selectedFile) {
          failAIGeneration('Silakan pilih file gambar terlebih dahulu.');
          return;
        }

        setAIGenerationProgress({ progress: 20, message: 'Mengunggah gambar...', status: 'uploading' });
        aiRawResult = await generateFloorplanFromImage({ file: selectedFile, params: form }, (progress, message) => {
          setAIGenerationProgress({ progress, message, status: 'analyzing' });
        });

        if (aiRawResult?.imagePreviewUrl) {
          setUploadedImage(aiRawResult.imagePreviewUrl);
        }
      }

      setAIGenerationProgress({ progress: 92, message: 'Menyusun hasil ke kanvas...', status: 'mapping' });
      const mapped = mapAIFloorplanToCanvas(aiRawResult, { gridSize });

      saveAIGenerationVersion(mapped, {
        title: `AI ${mode === 'size' ? 'Ukuran' : 'Gambar'} ${new Date().toLocaleTimeString('id-ID')}`,
      });
    } catch (error) {
      failAIGeneration(error?.message || 'Proses AI gagal. Silakan coba lagi.');
    }
  };

  const applySelectedVersion = () => {
    if (!selectedVersion?.plan) return;
    applyGeneratedPlan(selectedVersion.plan, {
      title: selectedVersion.title,
      openingConfidenceThreshold: 0.72,
    });

    const backend = selectedVersion?.meta?.backend;
    if (backend?.versionId || backend?.jobId) {
      submitAIFeedback({
        versionId: backend?.versionId || null,
        jobId: backend?.jobId || null,
        action: 'applied',
        rating: 4,
        notes: 'Versi diterapkan dari panel preview AI.',
      }).catch(() => {
        // Non-blocking feedback path.
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Generate AI Denah</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-0">
          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 space-y-5">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setMode('size')}
                className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'size' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
              >
                Berdasarkan Ukuran Tanah
              </button>
              <button
                onClick={() => setMode('image')}
                className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'image' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
              >
                Berdasarkan Gambar
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-800">Preset Rumah Indonesia</p>
                <span className="text-xs text-gray-500">Pilih untuk isi form otomatis</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HOUSE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset({ ...preset.values, presetId: preset.id })}
                    className={`text-left rounded-xl border px-3 py-3 transition-colors ${form.presetId === preset.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'}`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{preset.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-700">
                Lebar Tanah (m)
                <input type="number" min="4" max="60" value={form.landWidth} onChange={(e) => updateField('landWidth', Number(e.target.value))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="text-sm text-gray-700">
                Panjang Tanah (m)
                <input type="number" min="4" max="60" value={form.landLength} onChange={(e) => updateField('landLength', Number(e.target.value))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="text-sm text-gray-700">
                Kamar Tidur
                <input type="number" min="1" max="6" value={form.bedrooms} onChange={(e) => updateField('bedrooms', Number(e.target.value))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
              <label className="text-sm text-gray-700">
                Kamar Mandi
                <input type="number" min="1" max="4" value={form.bathrooms} onChange={(e) => updateField('bathrooms', Number(e.target.value))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-700">
                Tipe Dapur
                <select value={form.kitchenType} onChange={(e) => updateField('kitchenType', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                  <option value="terbuka">Terbuka</option>
                  <option value="tertutup">Tertutup</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Target Luas
                <select value={form.areaBand} onChange={(e) => updateField('areaBand', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                  <option value="<50">&lt; 50 m2</option>
                  <option value="50-80">50 - 80 m2</option>
                  <option value="80-100">80 - 100 m2</option>
                  <option value="100-120">100 - 120 m2</option>
                  <option value=">120">&gt; 120 m2</option>
                </select>
              </label>
            </div>

            {mode === 'image' && (
              <label className="block border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Upload size={20} className="mx-auto text-gray-500 mb-2" />
                <p className="text-sm text-gray-700 font-medium">{selectedFile ? selectedFile.name : 'Pilih gambar denah/lahan'}</p>
                <p className="text-xs text-gray-500 mt-1">Format JPG/PNG/WEBP</p>
              </label>
            )}

            <div>
              <p className="text-sm text-gray-700 mb-2">Fitur Tambahan</p>
              <div className="flex flex-wrap gap-2">
                {EXTRA_OPTIONS.map((extra) => {
                  const active = form.extras.includes(extra);
                  return (
                    <button
                      key={extra}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`px-3 py-1.5 text-xs rounded-full border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}
                    >
                      {extra}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={runGeneration}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Denah
              </button>
              <button
                onClick={resetAIGenerationState}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Reset Status
              </button>
            </div>

            {(aiGeneration.message || aiGeneration.error) && (
              <div className={`rounded-xl px-4 py-3 text-sm ${aiGeneration.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                <p>{aiGeneration.error || aiGeneration.message}</p>
                <div className="mt-2 h-2 bg-white/70 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, aiGeneration.progress || 0))}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Preview & Riwayat Hasil AI</h3>
            {selectedVersion?.plan && (
              <div className="mb-4 bg-white rounded-xl border border-gray-200 p-3">
                <PlanThumbnail plan={selectedVersion.plan} />
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">{selectedVersion.summary?.rooms || 0} ruang</div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">{selectedVersion.summary?.walls || 0} dinding</div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">{selectedVersion.summary?.doors || 0} pintu</div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1.5">{selectedVersion.summary?.windows || 0} jendela</div>
                </div>
                {Array.isArray(selectedVersion.summary?.warnings) && selectedVersion.summary.warnings.length > 0 && (
                  <p className="text-xs text-amber-700 mt-3">{selectedVersion.summary.warnings[0]}</p>
                )}
                <button
                  onClick={applySelectedVersion}
                  className="mt-3 w-full text-xs px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
                >
                  Terapkan Versi Terpilih
                </button>
              </div>
            )}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {historyPreview.length === 0 && (
                <p className="text-sm text-gray-500">Belum ada hasil generate.</p>
              )}
              {historyPreview.map((item) => (
                <div key={item.id} className={`bg-white rounded-xl border p-3 ${item.id === selectedVersion?.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString('id-ID')}</p>
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-gray-500">
                    <span>{item.summary?.rooms || 0} ruang</span>
                    <span>•</span>
                    <span>{item.summary?.walls || 0} dinding</span>
                    <span>•</span>
                    <span>{Math.round((item.summary?.confidence || 0) * 100)}% confidence</span>
                  </div>
                  {Array.isArray(item.meta?.warnings) && item.meta.warnings.length > 0 && (
                    <p className="text-xs text-amber-700 mt-2">{item.meta.warnings[0]}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => selectAIGenerationVersion(item.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        selectAIGenerationVersion(item.id);
                        applyGeneratedPlan(item.plan, { title: item.title, openingConfidenceThreshold: 0.72 });

                        const backend = item?.meta?.backend;
                        if (backend?.versionId || backend?.jobId) {
                          submitAIFeedback({
                            versionId: backend?.versionId || null,
                            jobId: backend?.jobId || null,
                            action: 'applied',
                            rating: 4,
                            notes: 'Versi diterapkan langsung dari daftar riwayat AI.',
                          }).catch(() => {
                            // Non-blocking feedback path.
                          });
                        }

                        onClose();
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorModal;
