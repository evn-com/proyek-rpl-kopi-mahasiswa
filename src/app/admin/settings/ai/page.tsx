'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Sparkles,
  Bot,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Key,
  RotateCcw,
  Play,
  Check,
  Zap,
  Info,
  Clock,
  Send,
  Loader2,
  Lock,
  Unlock,
  Layers,
  Flame,
  ShieldCheck,
  Server,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

interface ApiKeyDetail {
  provider: string;
  label: string;
  isConfigured: boolean;
  maskedKey: string;
  rawKey?: string;
  source: 'database' | 'environment' | 'none';
  updatedAt: string | null;
}

interface ModelItem {
  id: 'gemini' | 'grok';
  name: string;
  subName: string;
  modelId: string;
  providerKey: 'gemini' | 'grok';
  contextWindow: string;
  tag: string;
  description: string;
  isConfigured: boolean;
  lastTested: string | null;
  latencyMs: number | null;
  testStatus: string | null;
}

type ProviderKey = 'gemini' | 'grok';

export default function AdminAISettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<string>('gemini');
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<ProviderKey, ApiKeyDetail>>({
    gemini: { provider: 'gemini', label: 'Google Gemini', isConfigured: false, maskedKey: '', source: 'none', updatedAt: null },
    grok: { provider: 'grok', label: 'xAI Grok', isConfigured: false, maskedKey: '', source: 'none', updatedAt: null },
  });

  // Selected provider for the API Key editing panel
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('gemini');
  const [keyInput, setKeyInput] = useState<string>('');
  const [savingKey, setSavingKey] = useState(false);
  const [resettingKey, setResettingKey] = useState(false);

  // Visibility toggles for API keys
  const [showSavedKey, setShowSavedKey] = useState<boolean>(false);
  const [showInputKey, setShowInputKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Model switching & testing states
  const [activatingModel, setActivatingModel] = useState<string | null>(null);
  const [testingModel, setTestingModel] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick test playground state
  const [testQuery, setTestQuery] = useState('Menu kopi yang creamy dan manis apa ya?');
  const [testResponse, setTestResponse] = useState('');
  const [isQueryRunning, setIsQueryRunning] = useState(false);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/ai');
      const data = await res.json();
      if (data.success) {
        if (data.activeModel) setActiveModel(data.activeModel);
        if (data.apiKeys) setApiKeys(data.apiKeys);
        if (data.availableModels) setAvailableModels(data.availableModels);
      }
    } catch (err) {
      console.error('Error loading AI settings:', err);
      showToast('Gagal memuat pengaturan AI dari server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handler: Update API Key
  const handleUpdateApiKey = async () => {
    if (!keyInput.trim() || keyInput.trim().length < 8) {
      showToast('Tempel API Key yang valid (minimal 8 karakter).', 'error');
      return;
    }
    try {
      setSavingKey(true);
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: keyInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'API Key berhasil diperbarui!', 'success');
        setKeyInput('');
        await fetchSettings();
      } else {
        showToast(data.error || 'Gagal memperbarui API Key.', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan koneksi saat menyimpan API Key.', 'error');
    } finally {
      setSavingKey(false);
    }
  };

  // Handler: Reset API Key to environment (.env)
  const handleResetToEnv = async () => {
    if (!confirm(`Reset API Key ${apiKeys[selectedProvider]?.label || selectedProvider} kembali ke nilai file .env?`)) {
      return;
    }
    try {
      setResettingKey(true);
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          reset: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'API Key dikembalikan ke environment variable.', 'success');
        setKeyInput('');
        await fetchSettings();
      } else {
        showToast(data.error || 'Gagal mereset API Key.', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat mereset API Key.', 'error');
    } finally {
      setResettingKey(false);
    }
  };

  // Handler: Activate Model
  const handleActivateModel = async (modelId: string) => {
    try {
      setActivatingModel(modelId);
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModel(modelId);
        showToast(`Model ${modelId.toUpperCase()} sekarang aktif sebagai engine AI!`, 'success');
      } else {
        showToast(data.error || 'Gagal mengaktifkan model.', 'error');
      }
    } catch (err) {
      showToast('Gagal mengubah model aktif.', 'error');
    } finally {
      setActivatingModel(null);
    }
  };

  // Handler: Test Model Latency
  const handleTestModel = async (modelId: string) => {
    try {
      setTestingModel(modelId);
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_model', model: modelId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Respons berhasil dalam ${data.latencyMs} ms!`, 'success');
        await fetchSettings();
      } else {
        showToast(data.error || `Tes model gagal.`, 'error');
      }
    } catch (err: any) {
      showToast('Koneksi terputus saat menguji model.', 'error');
    } finally {
      setTestingModel(null);
    }
  };

  // Handler: Run quick interactive test query
  const handleRunTestQuery = async () => {
    if (!testQuery.trim()) return;
    try {
      setIsQueryRunning(true);
      setTestResponse('');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: testQuery }],
          mode: 'barista',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        setTestResponse(`⚠️ Error (${res.status}): ${errJson?.error || 'Gagal mendapatkan respon AI.'}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setTestResponse('Gagal membuka streaming response.');
        return;
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (rawData === '[DONE]') continue;
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.chunk) {
                setTestResponse((prev) => prev + parsed.chunk);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      setTestResponse(`⚠️ Gagal menghubungi endpoint chat: ${err?.message || err}`);
    } finally {
      setIsQueryRunning(false);
    }
  };

  const currentKeyInfo = apiKeys[selectedProvider];

  const getProviderIcon = (provider: ProviderKey) => {
    switch (provider) {
      case 'gemini':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'grok':
        return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab="ai-settings"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-[260px] min-w-0 transition-[padding] duration-300">
        <AdminNavbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          pageTitle="🤖 Pengaturan AI & API Key"
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div
            className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span className="font-medium text-xs sm:text-sm">{toast.text}</span>
          </div>
        )}

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171B26] via-[#1A1F2C] to-[#121622] border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5" />
                <span>Multi-Model AI Switcher</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Integrasi & Model Chatbot AI
              </h1>
              <p className="text-xs text-slate-400 max-w-xl">
                Kelola API Key setiap engine LLM dan tentukan model aktif untuk Barista AI pelanggan & Admin Assistant.
              </p>
            </div>

            {/* Current Active Model Badge */}
            <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-3 shrink-0 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Model Aktif</p>
                <p className="text-sm font-extrabold text-white">
                  {activeModel === 'gemini'
                    ? 'Google Gemini Flash'
                    : 'xAI Grok 2'}
                </p>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              CARD A: CHATBOT AI (SEPERTI GAMBAR REFERENSI)
          ═════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl bg-[#111622] border border-slate-800 p-6 space-y-6 shadow-xl">
            {/* Header: A. CHATBOT AI | Provider */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="text-amber-400 font-bold text-sm">🤖 A. CHATBOT AI</span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Provider: <span className="text-white font-semibold">{currentKeyInfo?.label || selectedProvider}</span>
              </span>
            </div>

            {/* Provider Tabs */}
            <div className="flex flex-wrap gap-2">
              {(['gemini', 'grok'] as ProviderKey[]).map((prov) => {
                const info = apiKeys[prov];
                const isSelected = selectedProvider === prov;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(prov);
                      setKeyInput('');
                      setShowSavedKey(false);
                      setShowInputKey(false);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    {getProviderIcon(prov)}
                    <span>{info?.label || prov}</span>
                    {info?.isConfigured && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ─── SECTION 1: API KEY BOX ─────────────────────────────── */}
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold text-white tracking-wide">API Key</h3>

              {/* Status Bar: Badge + Source + Timestamp */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {currentKeyInfo?.isConfigured ? (
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                    <Lock className="w-3 h-3" />
                    SUDAH DIKONFIGURASI
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-slate-850 text-slate-400 border border-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Unlock className="w-3 h-3" />
                    BELUM DIKONFIGURASI
                  </span>
                )}

                <span className="text-slate-400 text-xs">
                  Sumber:{' '}
                  <span className="text-slate-200 font-medium">
                    {currentKeyInfo?.source === 'database'
                      ? 'Pengaturan Admin (terenkripsi di database)'
                      : currentKeyInfo?.source === 'environment'
                      ? 'Environment (.env)'
                      : 'Belum diisi'}
                  </span>
                </span>

                {currentKeyInfo?.updatedAt && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    • diperbarui {currentKeyInfo.updatedAt}
                  </span>
                )}
              </div>

              {/* Box Tampilan Code API Key Aktif dengan Toggle Lihat & Salin */}
              {currentKeyInfo?.isConfigured && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#090D16] border border-slate-800">
                  <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    <Key className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-mono text-xs sm:text-sm text-slate-200 select-all break-all">
                      {showSavedKey
                        ? (currentKeyInfo.rawKey || currentKeyInfo.maskedKey)
                        : (currentKeyInfo.maskedKey || '••••••••••••••••••••••••')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Tombol Lihat/Sembunyikan Code */}
                    <button
                      type="button"
                      onClick={() => setShowSavedKey((prev) => !prev)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
                      title={showSavedKey ? 'Sembunyikan code API key' : 'Lihat code lengkap API key'}
                    >
                      {showSavedKey ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sembunyikan</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Lihat Code</span>
                        </>
                      )}
                    </button>

                    {/* Tombol Salin */}
                    {currentKeyInfo.rawKey && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentKeyInfo.rawKey || '');
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
                        title="Salin API Key ke clipboard"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Input Tempel API Key Baru dengan Tombol Lihat Input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <div className="relative flex-1">
                  <input
                    type={showInputKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={`Tempel API Key ${currentKeyInfo?.label || selectedProvider} baru...`}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs sm:text-sm font-mono text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInputKey((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition"
                    title={showInputKey ? 'Sembunyikan karakter' : 'Tampilkan karakter yang diketik'}
                  >
                    {showInputKey ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleUpdateApiKey}
                  disabled={savingKey || !keyInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
                >
                  {savingKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>{savingKey ? 'Menguji & Menyimpan...' : 'Perbarui API Key'}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-slate-400">
                  API Key baru diuji jika memakai model aktif. Jika gagal, key lama tetap dipakai.
                </p>

                {currentKeyInfo?.source === 'database' && (
                  <button
                    type="button"
                    onClick={handleResetToEnv}
                    disabled={resettingKey}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition underline font-medium self-start sm:self-auto"
                  >
                    {resettingKey ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    <span>Pakai API Key environment</span>
                  </button>
                )}
              </div>
            </div>

            {/* ─── SECTION 2: MODEL AKTIF CARDS ───────────────────────── */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide">Model Aktif</h3>
                {loading && (
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    Memuat status...
                  </span>
                )}
              </div>

              <div className="space-y-3.5">
                {availableModels.map((item) => {
                  const isCurrent = activeModel === item.id;
                  const isTesting = testingModel === item.id;
                  const isActivating = activatingModel === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                        isCurrent
                          ? 'bg-[#151B2B] border-amber-500/50 shadow-md shadow-amber-500/10'
                          : 'bg-[#0E131E] border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm sm:text-base font-extrabold text-white">
                              {item.name}
                            </h4>

                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
                                AKTIF
                              </span>
                            )}

                            {item.isConfigured ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/50 text-emerald-400 uppercase tracking-wider">
                                KOMPATIBEL
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/50 text-rose-400 uppercase tracking-wider">
                                PERLU API KEY
                              </span>
                            )}

                            <span className="text-[10px] text-amber-400/90 font-semibold px-2 py-0.5 rounded bg-amber-500/10">
                              {item.tag}
                            </span>
                          </div>

                          {/* Technical Meta Line 1: Model ID & Context */}
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono text-slate-400">
                            <span>
                              Model ID: <span className="text-slate-200">{item.modelId}</span>
                            </span>
                            <span>
                              Context: <span className="text-slate-200">{item.contextWindow}</span>
                            </span>
                          </div>

                          {/* Technical Meta Line 2: Last test & Response time */}
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono text-slate-400">
                            <span>
                              Uji terakhir:{' '}
                              <span className="text-slate-300">
                                {item.lastTested ? new Date(item.lastTested).toLocaleString('id-ID') : 'Belum diuji'}
                              </span>
                            </span>
                            {item.latencyMs !== null && item.latencyMs !== undefined && (
                              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                <Zap className="w-3 h-3 text-amber-400" />
                                Waktu respons: {item.latencyMs} ms
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Right Buttons: Uji & Aktifkan */}
                        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                          {/* Tombol Uji */}
                          <button
                            type="button"
                            onClick={() => handleTestModel(item.id)}
                            disabled={isTesting}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-700"
                          >
                            {isTesting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>{isTesting ? 'Menguji...' : 'Uji'}</span>
                          </button>

                          {/* Tombol Aktifkan */}
                          <button
                            type="button"
                            onClick={() => handleActivateModel(item.id)}
                            disabled={isCurrent || isActivating}
                            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                              isCurrent
                                ? 'bg-slate-800/80 text-emerald-400 border border-emerald-500/30 cursor-default'
                                : 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-amber-500/20'
                            }`}
                          >
                            {isActivating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isCurrent ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : null}
                            <span>{isActivating ? 'Mengaktifkan...' : isCurrent ? 'Aktif' : 'Aktifkan'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Note */}
              <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                Pergantian model hanya mengubah Model Chatbot (Google Gemini &amp; xAI Grok). System prompt, persona barista, konteks role,
                riwayat percakapan, dan data operasional kafe tetap terjaga konsisten.
              </p>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              CARD 2: LIVE PLAYGROUND (UJI RESPON AI LANGSUNG)
          ═════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl bg-[#111622] border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">☕</span>
                <h3 className="text-sm font-bold text-white">Live Playground Respon AI</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Uji langsung Chatbot dengan model aktif
              </span>
            </div>

            {/* Input prompt */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunTestQuery()}
                placeholder="Ketik pertanyaan untuk Barista AI..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={handleRunTestQuery}
                disabled={isQueryRunning || !testQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 transition shadow-lg shadow-amber-500/20"
              >
                {isQueryRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Pertanyaan</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick samples */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400">Contoh:</span>
              {[
                'Menu kopi yang creamy dan manis',
                'Minuman non-kopi yang segar',
                'Camilan buat nugas malam',
                'Berapa harga Classic Caffe Latte?',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTestQuery(sample)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                >
                  {sample}
                </button>
              ))}
            </div>

            {/* Output stream preview */}
            <div className="rounded-xl bg-[#090D16] border border-slate-800 p-4 min-h-[100px] max-h-[260px] overflow-y-auto text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
              {isQueryRunning && !testResponse && (
                <div className="flex items-center gap-2 text-slate-400 italic py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>AI sedang meracik jawaban dengan model aktif...</span>
                </div>
              )}
              {testResponse ? (
                <div>{testResponse}</div>
              ) : !isQueryRunning ? (
                <span className="text-slate-400 italic">
                  Belum ada respon. Tekan &ldquo;Kirim Pertanyaan&rdquo; untuk menguji respon model aktif secara live.
                </span>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
