-- AI backend core schema for PomahLiving
create extension if not exists pgcrypto;

create table if not exists public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  user_id uuid,
  mode text not null check (mode in ('size', 'image')),
  status text not null default 'processing' check (status in ('processing', 'succeeded', 'failed')),
  input_params jsonb not null default '{}'::jsonb,
  image_meta jsonb,
  model_provider text,
  model_name text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_generation_versions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.ai_generation_jobs(id) on delete cascade,
  project_id uuid,
  user_id uuid,
  version_index integer not null default 1,
  plan jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  quality_score numeric,
  selected boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_feedback_events (
  id uuid primary key default gen_random_uuid(),
  version_id uuid references public.ai_generation_versions(id) on delete set null,
  job_id uuid references public.ai_generation_jobs(id) on delete set null,
  project_id uuid,
  user_id uuid,
  action text not null check (action in ('accepted', 'rejected', 'edited', 'applied')),
  rating smallint check (rating between 1 and 5),
  notes text,
  edit_distance numeric,
  edited_plan jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_training_datasets (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  sample_count integer not null default 0,
  window_start timestamptz,
  window_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_training_samples (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.ai_training_datasets(id) on delete cascade,
  version_id uuid references public.ai_generation_versions(id) on delete set null,
  feedback_id uuid references public.ai_feedback_events(id) on delete set null,
  input_payload jsonb not null default '{}'::jsonb,
  target_payload jsonb not null default '{}'::jsonb,
  quality_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_training_runs (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references public.ai_training_datasets(id) on delete set null,
  model_name text not null,
  base_model text,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  metrics jsonb,
  artifact_uri text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_model_registry (
  id uuid primary key default gen_random_uuid(),
  model_name text not null,
  version_tag text not null,
  provider text not null,
  endpoint text,
  is_active boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (model_name, version_tag)
);

create index if not exists idx_ai_jobs_project_created on public.ai_generation_jobs(project_id, created_at desc);
create index if not exists idx_ai_jobs_user_created on public.ai_generation_jobs(user_id, created_at desc);
create index if not exists idx_ai_versions_job_created on public.ai_generation_versions(job_id, created_at desc);
create index if not exists idx_ai_feedback_version_created on public.ai_feedback_events(version_id, created_at desc);
create index if not exists idx_ai_feedback_action_created on public.ai_feedback_events(action, created_at desc);
create index if not exists idx_ai_samples_dataset on public.ai_training_samples(dataset_id);
create index if not exists idx_ai_training_runs_status on public.ai_training_runs(status, created_at desc);

comment on table public.ai_generation_jobs is 'Log semua job generate denah AI (input, status, model, error).';
comment on table public.ai_generation_versions is 'Setiap versi denah yang dihasilkan per job generate.';
comment on table public.ai_feedback_events is 'Feedback user untuk loop pembelajaran model (accepted/rejected/edited/applied).';
comment on table public.ai_training_datasets is 'Snapshot dataset training yang dibekukan dari data produksi.';
comment on table public.ai_training_samples is 'Sample training terstruktur yang berasal dari versi + feedback.';
comment on table public.ai_training_runs is 'Riwayat training/fine-tuning model.';
comment on table public.ai_model_registry is 'Registry model AI siap deploy/canary/rollback.';
