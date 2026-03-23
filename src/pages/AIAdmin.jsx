import { useEffect, useMemo, useState } from 'react';
import {
  activateAIModelVersion,
  buildTrainingDataset,
  createAITrainingRun,
  getAIBackendDashboard,
  updateAITrainingRunStatus,
} from '@/services/aiFloorplanService';

const statusClasses = {
  queued: 'bg-slate-100 text-slate-700',
  running: 'bg-amber-100 text-amber-700',
  succeeded: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-700',
};

const Card = ({ title, value, subtitle }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
  </div>
);

const AIAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [dashboard, setDashboard] = useState({ jobs: [], versions: [], datasets: [], runs: [], models: [] });

  const [datasetForm, setDatasetForm] = useState({
    sinceDays: 14,
    limit: 500,
    source: 'production-feedback',
    adminToken: '',
  });

  const [runForm, setRunForm] = useState({
    datasetId: '',
    modelName: 'pomah-floorplan-v1',
    baseModel: 'gpt-4.1-mini',
  });

  const [activationForm, setActivationForm] = useState({
    modelName: '',
    versionTag: '',
  });

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const data = await getAIBackendDashboard({ limit: 20 });
      setDashboard(data);
      setSetupRequired(Boolean(data?.setupRequired));
      setSetupMessage(data?.setupMessage || '');
    } catch (err) {
      setError(err.message || 'Gagal memuat dashboard AI backend.');
      setSetupRequired(false);
      setSetupMessage('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const acceptedRate = useMemo(() => {
    const totalVersions = dashboard.versions.length;
    const selected = dashboard.versions.filter((item) => item.selected).length;
    if (!totalVersions) return 0;
    return Math.round((selected / totalVersions) * 100);
  }, [dashboard.versions]);

  const latestDataset = dashboard.datasets[0];
  const latestRun = dashboard.runs[0];

  const handleBuildDataset = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await buildTrainingDataset(datasetForm);
      setNotice(`Dataset berhasil dibuat: ${result.datasetId} (${result.sampleCount} sample).`);
      await loadDashboard();
      setRunForm((prev) => ({ ...prev, datasetId: result.datasetId || prev.datasetId }));
    } catch (err) {
      setError(err.message || 'Gagal membentuk dataset training.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRun = async () => {
    if (!runForm.datasetId || !runForm.modelName) {
      setError('datasetId dan modelName wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const run = await createAITrainingRun(runForm);
      setNotice(`Training run dibuat: ${run.id}`);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Gagal membuat training run.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRun = async (runId, status) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateAITrainingRunStatus(runId, { status });
      setNotice(`Status run ${runId} diubah ke ${status}.`);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Gagal update status run.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivateModel = async () => {
    if (!activationForm.modelName || !activationForm.versionTag) {
      setError('modelName dan versionTag wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const model = await activateAIModelVersion(activationForm);
      setNotice(`Model aktif: ${model.model_name}@${model.version_tag}`);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Gagal mengaktifkan model.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">AI Backend Admin</h1>
          <p className="text-sm text-slate-600">Panel operasional untuk dataset training, training run, dan aktivasi model.</p>
        </header>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
        {setupRequired ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-2">
            <p className="font-semibold">Setup database AI belum selesai</p>
            <p>{setupMessage || 'Tabel AI backend belum dibuat di Supabase.'}</p>
            <div className="text-xs text-amber-900/90">
              <p>Langkah cepat:</p>
              <p>1. Jalankan migration: <span className="font-mono">supabase db push</span></p>
              <p>2. Deploy function: <span className="font-mono">generate-floorplan</span>, <span className="font-mono">submit-ai-feedback</span>, <span className="font-mono">build-training-dataset</span></p>
              <p>3. Lihat panduan lengkap di <span className="font-mono">docs/AI_BACKEND_DEPLOY_ID.md</span></p>
            </div>
          </div>
        ) : null}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card title="Job AI" value={dashboard.jobs.length} subtitle="20 data terbaru" />
          <Card title="Versi AI" value={dashboard.versions.length} subtitle={`Acceptance ${acceptedRate}%`} />
          <Card title="Dataset" value={dashboard.datasets.length} subtitle={latestDataset ? `Terakhir ${latestDataset.sample_count} sample` : 'Belum ada'} />
          <Card title="Training Run" value={dashboard.runs.length} subtitle={latestRun ? `Status ${latestRun.status}` : 'Belum ada'} />
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Bentuk Dataset Training</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-700">Range Hari
                <input type="number" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={datasetForm.sinceDays} onChange={(e) => setDatasetForm((prev) => ({ ...prev, sinceDays: Number(e.target.value) }))} />
              </label>
              <label className="text-sm text-slate-700">Limit Sample
                <input type="number" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={datasetForm.limit} onChange={(e) => setDatasetForm((prev) => ({ ...prev, limit: Number(e.target.value) }))} />
              </label>
            </div>
            <label className="text-sm text-slate-700 block">Source
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={datasetForm.source} onChange={(e) => setDatasetForm((prev) => ({ ...prev, source: e.target.value }))} />
            </label>
            <label className="text-sm text-slate-700 block">Admin Token (opsional)
              <input type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={datasetForm.adminToken} onChange={(e) => setDatasetForm((prev) => ({ ...prev, adminToken: e.target.value }))} />
            </label>
            <button disabled={saving} onClick={handleBuildDataset} className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-black disabled:opacity-60">Build Dataset</button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Kelola Training Run</h2>
            <label className="text-sm text-slate-700 block">Dataset ID
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={runForm.datasetId} onChange={(e) => setRunForm((prev) => ({ ...prev, datasetId: e.target.value }))} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-700">Model Name
                <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={runForm.modelName} onChange={(e) => setRunForm((prev) => ({ ...prev, modelName: e.target.value }))} />
              </label>
              <label className="text-sm text-slate-700">Base Model
                <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={runForm.baseModel} onChange={(e) => setRunForm((prev) => ({ ...prev, baseModel: e.target.value }))} />
              </label>
            </div>
            <button disabled={saving} onClick={handleCreateRun} className="rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">Buat Training Run</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Aktivasi Model</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="modelName" value={activationForm.modelName} onChange={(e) => setActivationForm((prev) => ({ ...prev, modelName: e.target.value }))} />
            <input className="rounded-lg border border-slate-300 px-3 py-2" placeholder="versionTag" value={activationForm.versionTag} onChange={(e) => setActivationForm((prev) => ({ ...prev, versionTag: e.target.value }))} />
            <button disabled={saving} onClick={handleActivateModel} className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">Aktifkan Model</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Model</th>
                  <th className="py-2">Versi</th>
                  <th className="py-2">Provider</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.models.map((model) => (
                  <tr key={model.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-slate-800">{model.model_name}</td>
                    <td className="py-2 text-slate-600">{model.version_tag}</td>
                    <td className="py-2 text-slate-600">{model.provider}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${model.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {model.is_active ? 'active' : 'inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!dashboard.models.length && !loading ? (
                  <tr><td colSpan={4} className="py-3 text-slate-500">Belum ada model di registry.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Training Runs Terbaru</h2>
          <div className="space-y-2">
            {dashboard.runs.map((run) => (
              <div key={run.id} className="rounded-xl border border-slate-200 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">{run.model_name}</p>
                  <p className="text-xs text-slate-500">Run ID: {run.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusClasses[run.status] || 'bg-slate-100 text-slate-700'}`}>{run.status}</span>
                  <button className="text-xs px-2 py-1 rounded border border-slate-300" onClick={() => handleUpdateRun(run.id, 'running')}>Running</button>
                  <button className="text-xs px-2 py-1 rounded border border-slate-300" onClick={() => handleUpdateRun(run.id, 'succeeded')}>Selesai</button>
                  <button className="text-xs px-2 py-1 rounded border border-slate-300" onClick={() => handleUpdateRun(run.id, 'failed')}>Gagal</button>
                </div>
              </div>
            ))}
            {!dashboard.runs.length && !loading ? <p className="text-sm text-slate-500">Belum ada training run.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AIAdmin;
