import { supabase } from '@/integrations/supabase/client';
import { processUploadedImage } from '@/utils/floorPlanDetector';

const DEFAULT_TIMEOUT_MS = 25000;

const withTimeout = async (promise, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Permintaan AI timeout. Coba lagi.')), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
};

const createBoundaryWalls = (width, height) => [
  { x1: 0, y1: 0, x2: width, y2: 0 },
  { x1: width, y1: 0, x2: width, y2: height },
  { x1: width, y1: height, x2: 0, y2: height },
  { x1: 0, y1: height, x2: 0, y2: 0 },
];

const createRoomBoxWalls = (room) => [
  { x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y },
  { x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height },
  { x1: room.x + room.width, y1: room.y + room.height, x2: room.x, y2: room.y + room.height },
  { x1: room.x, y1: room.y + room.height, x2: room.x, y2: room.y },
];

const normalizeRooms = (rooms = []) => rooms.map((room, index) => ({
  id: room.id || `room-${index + 1}`,
  name: room.name || room.type || `Ruangan ${index + 1}`,
  x: Number(room.x) || 0,
  y: Number(room.y) || 0,
  width: Number(room.width || room.w) || 3,
  height: Number(room.height || room.l) || 3,
  confidence: Number(room.confidence) || 0.75,
}));

const fallbackGenerateFromSize = (payload) => {
  const width = Math.max(4, Number(payload?.landWidth) || 10);
  const height = Math.max(4, Number(payload?.landLength) || 12);
  const bedrooms = Math.max(1, Math.min(6, Number(payload?.bedrooms) || 2));
  const bathrooms = Math.max(1, Math.min(4, Number(payload?.bathrooms) || 1));
  const kitchenType = payload?.kitchenType || 'terbuka';

  const rooms = [];
  rooms.push({ name: 'Ruang Tamu', x: 0.5, y: 0.5, width: Math.max(3.5, width * 0.45), height: Math.max(3, height * 0.3), confidence: 0.86 });
  rooms.push({ name: kitchenType === 'tertutup' ? 'Dapur Tertutup' : 'Dapur', x: width * 0.55, y: 0.5, width: Math.max(2.8, width * 0.35), height: Math.max(2.6, height * 0.25), confidence: 0.82 });

  for (let i = 0; i < bedrooms; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const roomWidth = Math.max(2.8, width * 0.28);
    const roomHeight = Math.max(2.8, height * 0.22);
    rooms.push({
      name: `Kamar Tidur ${i + 1}`,
      x: 0.5 + col * (roomWidth + 0.4),
      y: height * 0.42 + row * (roomHeight + 0.35),
      width: roomWidth,
      height: roomHeight,
      confidence: 0.8,
    });
  }

  for (let i = 0; i < bathrooms; i += 1) {
    const bathWidth = Math.max(1.6, width * 0.14);
    const bathHeight = Math.max(1.8, height * 0.16);
    rooms.push({
      name: `Kamar Mandi ${i + 1}`,
      x: width - bathWidth - 0.5,
      y: height * 0.42 + i * (bathHeight + 0.2),
      width: bathWidth,
      height: bathHeight,
      confidence: 0.78,
    });
  }

  const normalizedRooms = normalizeRooms(rooms).map((room) => ({
    ...room,
    x: Math.max(0.2, Math.min(width - room.width - 0.2, room.x)),
    y: Math.max(0.2, Math.min(height - room.height - 0.2, room.y)),
  }));

  const walls = [
    ...createBoundaryWalls(width, height),
    ...normalizedRooms.flatMap((room) => createRoomBoxWalls(room)),
  ];

  return {
    source: 'fallback-size',
    boundary: { width, height },
    rooms: normalizedRooms,
    walls,
    openings: {
      doors: [{ x: width * 0.5, y: height, rotation: 0, confidence: 0.7 }],
      windows: normalizedRooms
        .filter((room) => String(room.name).toLowerCase().includes('kamar'))
        .map((room) => ({ x: room.x + room.width * 0.5, y: room.y, rotation: 0, confidence: 0.68 })),
      openings: [],
    },
    confidence: 0.78,
    warnings: ['Menggunakan mode fallback lokal. Silakan cek ulang posisi ruang dan opening.'],
  };
};

const fallbackGenerateFromImage = async ({ file, params }) => {
  const result = await processUploadedImage(file);
  const roomsDetected = normalizeRooms((result?.rooms || []).map((room) => ({
    name: room.type,
    x: Math.max(0, room.x - room.w / 2),
    y: Math.max(0, room.z - room.l / 2),
    width: room.w,
    height: room.l,
    confidence: room.confidence,
  })));

  const width = Math.max(Number(params?.landWidth) || 12, 6);
  const height = Math.max(Number(params?.landLength) || 10, 6);

  const walls = [
    ...createBoundaryWalls(width, height),
    ...roomsDetected.flatMap((room) => createRoomBoxWalls(room)),
  ];

  return {
    source: 'fallback-image',
    boundary: { width, height },
    rooms: roomsDetected,
    walls,
    openings: {
      doors: [{ x: width * 0.5, y: height, rotation: 0, confidence: 0.65 }],
      windows: [],
      openings: [],
    },
    confidence: 0.72,
    warnings: ['Deteksi gambar masih estimasi awal. Review hasil sebelum dipakai.'],
    imagePreviewUrl: result?.imageUrl || null,
  };
};

const invokeEdgeFunction = async (payload) => {
  const { data, error } = await withTimeout(
    supabase.functions.invoke('generate-floorplan', {
      body: payload,
    })
  );

  if (error) {
    throw new Error(error.message || 'Gagal memproses AI floorplan.');
  }

  if (!data) {
    throw new Error('Respon AI kosong.');
  }

  return data;
};

export const generateFloorplanFromSize = async (params, onProgress, context = {}) => {
  onProgress?.(20, 'Mengirim parameter ke AI...');

  try {
    const data = await invokeEdgeFunction({
      mode: 'size',
      params,
      projectId: context.projectId,
      userId: context.userId,
    });
    onProgress?.(85, 'Menerjemahkan hasil AI...');
    return data;
  } catch (error) {
    onProgress?.(75, 'Backend AI tidak tersedia, pakai fallback lokal...');
    return fallbackGenerateFromSize(params);
  }
};

export const generateFloorplanFromImage = async ({ file, params }, onProgress, context = {}) => {
  onProgress?.(15, 'Mempersiapkan file gambar...');

  try {
    const toBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result);
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(file);
    });

    onProgress?.(35, 'Mengirim gambar ke AI...');

    const data = await invokeEdgeFunction({
      mode: 'image',
      params,
      projectId: context.projectId,
      userId: context.userId,
      image: toBase64,
      fileName: file?.name,
      mimeType: file?.type,
    });

    onProgress?.(88, 'Menerjemahkan hasil AI...');
    return data;
  } catch (error) {
    onProgress?.(75, 'Backend AI tidak tersedia, pakai fallback lokal...');
    return fallbackGenerateFromImage({ file, params });
  }
};

export const submitAIFeedback = async (feedbackPayload) => {
  const { data, error } = await withTimeout(
    supabase.functions.invoke('submit-ai-feedback', {
      body: feedbackPayload,
    }),
    12000
  );

  if (error) {
    throw new Error(error.message || 'Gagal mengirim feedback AI.');
  }

  return data;
};

export const buildTrainingDataset = async (payload) => {
  const { data, error } = await withTimeout(
    supabase.functions.invoke('build-training-dataset', {
      body: payload,
      headers: payload?.adminToken
        ? { 'x-admin-token': payload.adminToken }
        : undefined,
    }),
    15000
  );

  if (error) {
    throw new Error(error.message || 'Gagal membuat dataset training.');
  }

  return data;
};

export const getAIBackendDashboard = async (options = {}) => {
  const limit = Math.max(5, Math.min(100, Number(options.limit) || 20));

  const [jobsRes, versionsRes, datasetsRes, runsRes, modelsRes] = await Promise.all([
    supabase
      .from('ai_generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('ai_generation_versions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('ai_training_datasets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('ai_training_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('ai_model_registry')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  const firstError = [jobsRes.error, versionsRes.error, datasetsRes.error, runsRes.error, modelsRes.error].find(Boolean);
  if (firstError) {
    throw new Error(firstError.message || 'Gagal mengambil dashboard AI backend.');
  }

  return {
    jobs: jobsRes.data || [],
    versions: versionsRes.data || [],
    datasets: datasetsRes.data || [],
    runs: runsRes.data || [],
    models: modelsRes.data || [],
  };
};

export const createAITrainingRun = async (payload) => {
  const { data, error } = await supabase
    .from('ai_training_runs')
    .insert({
      dataset_id: payload.datasetId || null,
      model_name: payload.modelName,
      base_model: payload.baseModel || null,
      status: 'queued',
      metrics: payload.metrics || null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Gagal membuat training run.');
  }

  return data;
};

export const updateAITrainingRunStatus = async (runId, patch) => {
  const nextPatch = {
    status: patch.status,
    metrics: patch.metrics || null,
    artifact_uri: patch.artifactUri || null,
  };

  if (patch.status === 'running') {
    nextPatch.started_at = new Date().toISOString();
  }

  if (['succeeded', 'failed', 'cancelled'].includes(patch.status)) {
    nextPatch.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('ai_training_runs')
    .update(nextPatch)
    .eq('id', runId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Gagal memperbarui status training run.');
  }

  return data;
};

export const activateAIModelVersion = async ({ modelName, versionTag }) => {
  const { error: resetError } = await supabase
    .from('ai_model_registry')
    .update({ is_active: false })
    .eq('model_name', modelName);

  if (resetError) {
    throw new Error(resetError.message || 'Gagal menonaktifkan model sebelumnya.');
  }

  const { data, error } = await supabase
    .from('ai_model_registry')
    .update({ is_active: true })
    .eq('model_name', modelName)
    .eq('version_tag', versionTag)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Gagal mengaktifkan model AI.');
  }

  return data;
};
