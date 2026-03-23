# Deploy Backend AI PomahLiving (Indonesia)

Dokumen ini berisi langkah eksekusi migration database dan deploy Supabase Functions untuk backend AI.

## Prasyarat

1. Supabase CLI terpasang.
2. Sudah login ke Supabase CLI.
3. Project sudah link ke workspace ini.

## 1) Link project

```bash
supabase login
supabase link --project-ref hjawnhfmaburmmyivrwt
```

## 2) Jalankan migration database AI

Migration yang harus diterapkan:
- supabase/migrations/202603230001_ai_backend.sql

Perintah:

```bash
supabase db push
```

## 3) Set environment variables untuk functions

Minimal env yang diperlukan:

```bash
supabase secrets set SUPABASE_URL="https://hjawnhfmaburmmyivrwt.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Untuk model AI eksternal:

```bash
supabase secrets set EXTERNAL_AI_API_URL="<model-api-url>"
supabase secrets set EXTERNAL_AI_API_KEY="<model-api-key>"
supabase secrets set EXTERNAL_AI_MODEL="gpt-4.1-mini"
```

Opsional untuk proteksi endpoint build dataset:

```bash
supabase secrets set TRAINING_ADMIN_TOKEN="<token-acak-panjang>"
```

## 4) Deploy edge functions

```bash
supabase functions deploy generate-floorplan
supabase functions deploy submit-ai-feedback
supabase functions deploy build-training-dataset
```

## 5) Uji endpoint cepat

### A. Generate floorplan (size)

```bash
curl -X POST "https://hjawnhfmaburmmyivrwt.functions.supabase.co/generate-floorplan" \
  -H "Content-Type: application/json" \
  -d '{
    "mode":"size",
    "projectId":"demo-project-1",
    "userId":"demo-user-1",
    "params":{
      "presetId":"60-120",
      "landWidth":10,
      "landLength":12,
      "bedrooms":3,
      "bathrooms":2,
      "kitchenType":"tertutup",
      "areaBand":"80-100",
      "extras":["Garasi","Pantry"]
    }
  }'
```

### B. Submit feedback AI

```bash
curl -X POST "https://hjawnhfmaburmmyivrwt.functions.supabase.co/submit-ai-feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "versionId":"<version-id>",
    "jobId":"<job-id>",
    "action":"applied",
    "rating":4,
    "notes":"Hasil cukup baik untuk baseline."
  }'
```

### C. Build dataset training

```bash
curl -X POST "https://hjawnhfmaburmmyivrwt.functions.supabase.co/build-training-dataset" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <TRAINING_ADMIN_TOKEN>" \
  -d '{
    "source":"production-feedback",
    "sinceDays":14,
    "limit":500
  }'
```

## 6) Operasional setelah deploy

1. Pantau tabel:
- ai_generation_jobs
- ai_generation_versions
- ai_feedback_events
- ai_training_datasets
- ai_training_samples
- ai_training_runs
- ai_model_registry

2. Gunakan halaman internal:
- /ai-admin

3. Proses rutin mingguan:
- Build dataset
- Buat training run
- Evaluasi metrik
- Aktivasi model terbaik
