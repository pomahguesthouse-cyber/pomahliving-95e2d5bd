import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type FloorplanRequest = {
  mode: "size" | "image";
  projectId?: string;
  userId?: string;
  params?: {
    presetId?: string;
    landWidth?: number;
    landLength?: number;
    bedrooms?: number;
    bathrooms?: number;
    kitchenType?: "terbuka" | "tertutup";
    areaBand?: string;
    extras?: string[];
  };
  image?: string;
  fileName?: string;
  mimeType?: string;
};

type NormalizedPlan = {
  source: string;
  mode: "size" | "image";
  boundary: { width: number; height: number };
  rooms: Array<{ name: string; x: number; y: number; width: number; height: number; confidence: number }>;
  walls: Array<{ x1: number; y1: number; x2: number; y2: number; confidence: number; thickness?: number }>;
  openings: {
    doors: Array<{ x: number; y: number; rotation: number; confidence: number }>;
    windows: Array<{ x: number; y: number; rotation: number; confidence: number }>;
    openings: Array<{ x: number; y: number; rotation: number; confidence: number }>;
  };
  confidence: number;
  warnings: string[];
};

const MODEL_API_URL = Deno.env.get("EXTERNAL_AI_API_URL") || "";
const MODEL_API_KEY = Deno.env.get("EXTERNAL_AI_API_KEY") || "";
const MODEL_NAME = Deno.env.get("EXTERNAL_AI_MODEL") || "gpt-4.1-mini";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasModelConfig = () => Boolean(MODEL_API_URL && MODEL_API_KEY && MODEL_NAME);

const getAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

const summarizePlan = (plan: NormalizedPlan) => ({
  rooms: plan.rooms.length,
  walls: plan.walls.length,
  doors: plan.openings?.doors?.length || 0,
  windows: plan.openings?.windows?.length || 0,
  openings: plan.openings?.openings?.length || 0,
  confidence: plan.confidence,
  warnings: plan.warnings,
});

const extractJsonObject = (content: string) => {
  const direct = content.trim();
  try {
    return JSON.parse(direct);
  } catch {
    const match = direct.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Model tidak mengembalikan JSON valid.");
    }
    return JSON.parse(match[0]);
  }
};

const PRESET_GUIDANCE: Record<string, string> = {
  "36-72": "Tipe 36/72: rumah kompak 2 kamar untuk keluarga kecil. Prioritaskan ruang tamu menyatu dengan ruang makan, dapur efisien, sirkulasi pendek, dan 1 kamar mandi.",
  "45-90": "Tipe 45/90: rumah tumbuh 2 kamar dengan fleksibilitas pengembangan. Prioritaskan zoning publik dan servis yang jelas, serta 1-2 kamar mandi.",
  "60-120": "Tipe 60/120: rumah keluarga menengah 3 kamar. Prioritaskan ruang keluarga nyaman, dapur lebih jelas zonanya, dan kemungkinan garasi/pantry.",
  "90-144": "Tipe 90/144: rumah besar 4 kamar dengan ruang tambahan. Prioritaskan privasi kamar, area servis, ruang kerja, dan kapasitas parkir/garasi.",
};

const buildPrompt = (payload: FloorplanRequest) => {
  const params = payload.params || {};
  const presetId = params.presetId || "";
  const presetGuidance = presetId && PRESET_GUIDANCE[presetId]
    ? PRESET_GUIDANCE[presetId]
    : "Tidak ada preset khusus. Gunakan interpretasi parameter secara umum untuk rumah tinggal Indonesia.";

  return `
Anda adalah sistem AI perencana denah rumah 2D.

Tugas:
- Buat draft denah rumah berdasarkan parameter pengguna.
- Gunakan satuan meter.
- Output HARUS JSON valid tanpa markdown.
- Semua koordinat room dan opening harus berada di dalam boundary.
- Hindari room overlap berat.
- Prioritaskan layout rumah tinggal Indonesia yang realistis dan efisien sirkulasi.

Input:
- mode: ${payload.mode}
- preset rumah Indonesia: ${presetId || "tidak ada"}
- lebar tanah: ${params.landWidth ?? "tidak ada"}
- panjang tanah: ${params.landLength ?? "tidak ada"}
- kamar tidur: ${params.bedrooms ?? "tidak ada"}
- kamar mandi: ${params.bathrooms ?? "tidak ada"}
- tipe dapur: ${params.kitchenType ?? "tidak ada"}
- target luas: ${params.areaBand ?? "tidak ada"}
- fitur tambahan: ${(params.extras || []).join(", ") || "tidak ada"}

Panduan preset:
- ${presetGuidance}

Skema output wajib:
{
  "boundary": { "width": number, "height": number },
  "rooms": [{ "name": string, "x": number, "y": number, "width": number, "height": number, "confidence": number }],
  "walls": [{ "x1": number, "y1": number, "x2": number, "y2": number, "confidence": number }],
  "openings": {
    "doors": [{ "x": number, "y": number, "rotation": number, "confidence": number }],
    "windows": [{ "x": number, "y": number, "rotation": number, "confidence": number }],
    "openings": [{ "x": number, "y": number, "rotation": number, "confidence": number }]
  },
  "confidence": number,
  "warnings": string[]
}

Aturan tambahan:
- confidence antara 0 dan 1
- minimal satu ruang tamu atau ruang keluarga
- minimal satu akses pintu utama
- jika preset diberikan, biarkan preset memengaruhi karakter zoning dan proporsi ruang
- jika mode image dan gambar sulit dibaca, tetap hasilkan boundary + zoning kasar
`.trim();
};

const normalizePlan = (payload: FloorplanRequest, rawInput: Record<string, unknown>): NormalizedPlan => {
  const raw = rawInput as any;
  const width = clamp(toNumber(raw?.boundary?.width ?? payload.params?.landWidth, 10), 4, 60);
  const height = clamp(toNumber(raw?.boundary?.height ?? payload.params?.landLength, 12), 4, 60);

  const rooms = Array.isArray(raw?.rooms) ? raw.rooms : [];
  const normalizedRooms = rooms.map((room, index) => {
    const roomWidth = clamp(toNumber(room?.width, 3), 1.5, width);
    const roomHeight = clamp(toNumber(room?.height, 3), 1.5, height);
    return {
      name: String(room?.name || `Ruangan ${index + 1}`),
      x: clamp(toNumber(room?.x, 0.5), 0, Math.max(0, width - roomWidth)),
      y: clamp(toNumber(room?.y, 0.5), 0, Math.max(0, height - roomHeight)),
      width: roomWidth,
      height: roomHeight,
      confidence: clamp(toNumber(room?.confidence, 0.75), 0, 1),
    };
  });

  const walls = Array.isArray(raw?.walls) ? raw.walls : [];
  const normalizedWalls = walls
    .map((wall) => ({
      x1: clamp(toNumber(wall?.x1, 0), 0, width),
      y1: clamp(toNumber(wall?.y1, 0), 0, height),
      x2: clamp(toNumber(wall?.x2, width), 0, width),
      y2: clamp(toNumber(wall?.y2, height), 0, height),
      confidence: clamp(toNumber(wall?.confidence, 0.75), 0, 1),
      thickness: clamp(toNumber(wall?.thickness, 10), 6, 24),
    }))
    .filter((wall) => Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1) >= 0.4);

  const normalizeOpeningList = (items: unknown, boundaryW: number, boundaryH: number) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      x: clamp(toNumber(item?.x, boundaryW / 2), 0, boundaryW),
      y: clamp(toNumber(item?.y, boundaryH / 2), 0, boundaryH),
      rotation: toNumber(item?.rotation, 0),
      confidence: clamp(toNumber(item?.confidence, 0.7), 0, 1),
    }));
  };

  const openingsObject = (raw?.openings && typeof raw.openings === "object") ? raw.openings as Record<string, unknown> : {};
  const warnings = Array.isArray(raw?.warnings) ? raw.warnings.map((item) => String(item)) : [];

  return {
    source: hasModelConfig() ? "external-model" : "edge-fallback",
    mode: payload.mode,
    boundary: { width, height },
    rooms: normalizedRooms,
    walls: normalizedWalls,
    openings: {
      doors: normalizeOpeningList(openingsObject?.doors, width, height),
      windows: normalizeOpeningList(openingsObject?.windows, width, height),
      openings: normalizeOpeningList(openingsObject?.openings, width, height),
    },
    confidence: clamp(toNumber(raw?.confidence, 0.76), 0, 1),
    warnings,
  };
};

const callExternalModel = async (payload: FloorplanRequest): Promise<NormalizedPlan> => {
  const prompt = buildPrompt(payload);
  const userContent: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];

  if (payload.mode === "image" && payload.image) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: payload.image,
      },
    });
  }

  const response = await fetch(MODEL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MODEL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Anda ahli denah rumah 2D dan harus menjawab dalam JSON valid.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Model API error: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  const content = Array.isArray(rawContent)
    ? rawContent.map((item: Record<string, unknown>) => String(item?.text || "")).join("\n")
    : String(rawContent || "{}");

  return normalizePlan(payload, extractJsonObject(content));
};

const buildFallbackPlan = (payload: FloorplanRequest) => {
  const width = Math.max(4, Number(payload.params?.landWidth) || 10);
  const height = Math.max(4, Number(payload.params?.landLength) || 12);

  const rooms = [
    { name: "Ruang Tamu", x: 0.5, y: 0.5, width: width * 0.45, height: height * 0.3, confidence: 0.8 },
    { name: "Kamar Tidur Utama", x: 0.5, y: height * 0.45, width: width * 0.35, height: height * 0.28, confidence: 0.78 },
    { name: "Dapur", x: width * 0.55, y: 0.5, width: width * 0.35, height: height * 0.26, confidence: 0.76 },
  ];

  const walls = [
    { x1: 0, y1: 0, x2: width, y2: 0, confidence: 0.8 },
    { x1: width, y1: 0, x2: width, y2: height, confidence: 0.8 },
    { x1: width, y1: height, x2: 0, y2: height, confidence: 0.8 },
    { x1: 0, y1: height, x2: 0, y2: 0, confidence: 0.8 },
  ];

  return {
    source: "edge-fallback",
    mode: payload.mode,
    boundary: { width, height },
    rooms,
    walls,
    openings: {
      doors: [{ x: width / 2, y: height, rotation: 0, confidence: 0.7 }],
      windows: [{ x: width / 4, y: 0, rotation: 0, confidence: 0.65 }],
      openings: [],
    },
    confidence: 0.77,
    warnings: [
      "Model eksternal belum dihubungkan. Hasil ini masih fallback dari edge function.",
    ],
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method tidak didukung" });
  }

  let jobId: string | null = null;
  const admin = getAdminClient();

  try {
    const payload = (await req.json()) as FloorplanRequest;

    if (!payload.mode || !["size", "image"].includes(payload.mode)) {
      return json(400, { error: "mode wajib: size atau image" });
    }

    if (payload.mode === "image" && !payload.image) {
      return json(400, { error: "image wajib untuk mode image" });
    }

    if (admin) {
      const { data: createdJob, error: createJobError } = await admin
        .from("ai_generation_jobs")
        .insert({
          project_id: payload.projectId || null,
          user_id: payload.userId || null,
          mode: payload.mode,
          status: "processing",
          input_params: payload.params || {},
          image_meta: payload.mode === "image"
            ? {
                fileName: payload.fileName || null,
                mimeType: payload.mimeType || null,
                hasImage: Boolean(payload.image),
              }
            : null,
          model_provider: hasModelConfig() ? "external" : "fallback",
          model_name: hasModelConfig() ? MODEL_NAME : "fallback-template",
        })
        .select("id")
        .single();

      if (!createJobError) {
        jobId = createdJob?.id || null;
      }
    }

    let plan: NormalizedPlan;
    if (hasModelConfig()) {
      try {
        plan = await callExternalModel(payload);
        if (plan.rooms.length === 0) {
          plan.warnings.push("Model tidak memberi ruangan yang cukup. Sistem menyarankan regenerate.");
        }
      } catch (error) {
        console.error("External model failed:", error);
        plan = normalizePlan(payload, buildFallbackPlan(payload) as unknown as Record<string, unknown>);
        plan.warnings.push("Model eksternal gagal dipanggil. Sistem memakai fallback lokal.");
      }
    } else {
      plan = normalizePlan(payload, buildFallbackPlan(payload) as unknown as Record<string, unknown>);
      plan.warnings.push("ENV model AI belum diisi. Sistem memakai fallback lokal.");
    }

    let versionId: string | null = null;
    if (admin && jobId) {
      const summary = summarizePlan(plan);
      const { data: createdVersion, error: createVersionError } = await admin
        .from("ai_generation_versions")
        .insert({
          job_id: jobId,
          project_id: payload.projectId || null,
          user_id: payload.userId || null,
          version_index: 1,
          plan,
          summary,
          quality_score: plan.confidence,
        })
        .select("id")
        .single();

      if (!createVersionError) {
        versionId = createdVersion?.id || null;
      }

      await admin
        .from("ai_generation_jobs")
        .update({
          status: "succeeded",
          completed_at: new Date().toISOString(),
          model_provider: hasModelConfig() ? "external" : "fallback",
          model_name: hasModelConfig() ? MODEL_NAME : "fallback-template",
        })
        .eq("id", jobId);

      return json(200, {
        ...plan,
        metadata: {
          jobId,
          versionId,
          modelName: hasModelConfig() ? MODEL_NAME : "fallback-template",
          modelProvider: hasModelConfig() ? "external" : "fallback",
        },
      });
    }

    return json(200, plan);
  } catch (error) {
    if (admin && jobId) {
      await admin
        .from("ai_generation_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", jobId);
    }

    return json(500, {
      error: "Gagal memproses generate-floorplan",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
