import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type DatasetPayload = {
  source?: string;
  sinceDays?: number;
  limit?: number;
  createdBy?: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const TRAINING_ADMIN_TOKEN = Deno.env.get("TRAINING_ADMIN_TOKEN") || "";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
    },
  });

const getAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum tersedia.");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return json(200, { ok: true });
  if (req.method !== "POST") return json(405, { error: "Method tidak didukung" });

  try {
    if (TRAINING_ADMIN_TOKEN) {
      const token = req.headers.get("x-admin-token") || "";
      if (token !== TRAINING_ADMIN_TOKEN) {
        return json(401, { error: "Unauthorized" });
      }
    }

    const payload = (await req.json()) as DatasetPayload;
    const sinceDays = Math.max(1, Math.min(90, Number(payload.sinceDays) || 14));
    const limit = Math.max(50, Math.min(5000, Number(payload.limit) || 500));
    const windowStart = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();

    const supabase = getAdminClient();

    const { data: samples, error: sampleError } = await supabase
      .from("ai_feedback_events")
      .select(`
        id,
        action,
        rating,
        notes,
        edit_distance,
        edited_plan,
        created_at,
        ai_generation_versions (
          id,
          plan,
          summary,
          job_id
        )
      `)
      .gte("created_at", windowStart)
      .in("action", ["accepted", "edited", "applied"])
      .limit(limit);

    if (sampleError) {
      return json(500, { error: sampleError.message });
    }

    const cleanSamples = (samples || []).filter((item: any) => item?.ai_generation_versions?.plan);

    const { data: datasetRow, error: datasetError } = await supabase
      .from("ai_training_datasets")
      .insert({
        source: payload.source || "production-feedback",
        sample_count: cleanSamples.length,
        window_start: windowStart,
        window_end: new Date().toISOString(),
        created_by: payload.createdBy || null,
        metadata: {
          includeActions: ["accepted", "edited", "applied"],
          limit,
        },
      })
      .select("id")
      .single();

    if (datasetError || !datasetRow) {
      return json(500, { error: datasetError?.message || "Gagal membuat dataset" });
    }

    if (cleanSamples.length > 0) {
      const rows = cleanSamples.map((item: any) => ({
        dataset_id: datasetRow.id,
        version_id: item.ai_generation_versions.id,
        feedback_id: item.id,
        input_payload: {
          source: payload.source || "production-feedback",
          feedback_action: item.action,
          rating: item.rating,
          notes: item.notes,
        },
        target_payload: item.edited_plan || item.ai_generation_versions.plan,
        quality_label: item.action === "accepted" || item.action === "applied" ? "good" : "edited",
        metadata: {
          summary: item.ai_generation_versions.summary,
          edit_distance: item.edit_distance,
          created_at: item.created_at,
        },
      }));

      const { error: insertSampleError } = await supabase
        .from("ai_training_samples")
        .insert(rows);

      if (insertSampleError) {
        return json(500, { error: insertSampleError.message });
      }
    }

    return json(200, {
      ok: true,
      datasetId: datasetRow.id,
      sampleCount: cleanSamples.length,
      message: "Dataset training berhasil dibentuk dari feedback produksi.",
    });
  } catch (error) {
    return json(500, {
      error: "Gagal membentuk dataset training",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
