import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type FeedbackPayload = {
  versionId?: string;
  jobId?: string;
  projectId?: string;
  userId?: string;
  action: "accepted" | "rejected" | "edited" | "applied";
  rating?: number;
  notes?: string;
  editDistance?: number;
  editedPlan?: Record<string, unknown>;
};

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
    const payload = (await req.json()) as FeedbackPayload;

    if (!payload.action) {
      return json(400, { error: "action wajib diisi" });
    }

    const supabase = getAdminClient();

    const { data: inserted, error } = await supabase
      .from("ai_feedback_events")
      .insert({
        version_id: payload.versionId || null,
        job_id: payload.jobId || null,
        project_id: payload.projectId || null,
        user_id: payload.userId || null,
        action: payload.action,
        rating: payload.rating ?? null,
        notes: payload.notes || null,
        edit_distance: payload.editDistance ?? null,
        edited_plan: payload.editedPlan || null,
      })
      .select("id")
      .single();

    if (error) {
      return json(500, { error: error.message });
    }

    if (payload.versionId && (payload.action === "accepted" || payload.action === "applied")) {
      await supabase
        .from("ai_generation_versions")
        .update({ selected: true })
        .eq("id", payload.versionId);
    }

    return json(200, {
      ok: true,
      feedbackId: inserted?.id,
      message: "Feedback AI berhasil disimpan.",
    });
  } catch (error) {
    return json(500, {
      error: "Gagal menyimpan feedback AI",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
