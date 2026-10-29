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
  Save,
  Zap,
  ShieldCheck,
  Send,
  Loader2,
  Check,
  Flame,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AIModelOption {
  id: 'gemini' | 'gpt' | 'deepseek';
  name: string;
  subName: string;
  tag: string;
  tagColor: string;
  borderActive: string;
  bgActive: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  description: string;
  features: string[];
  latency: string;
  statusText: string;
}

const MODEL_OPTIONS: AIModelOption[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    subName: 'Gemini 2.5 Flash',
    tag: 'Rekomendasi Utama',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderActive: 'border-amber-500 ring-2 ring-amber-500/30',
    bgActive: 'bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-coffee-950/60',
    icon: Sparkles,
    iconColor: 'text-amber-400',
    iconBg: 'from-amber-500/20 to-orange-500/20',
    description:
      'Model AI default resmi Google dengan kecepatan respon ultra-cepat, integrasi native SDK (@google/genai), dan pemahaman konteks database menu real-time.',
    features: [
      'Latency streaming instan (~180ms TTFT)',
      'Akurasi 100% pada filter menu Kopi vs Non-Kopi vs Snack',
      'Terhubung langsung dengan database meja & promo',
    ],
    latency: '< 200 ms',
    statusText: 'Direkomendasikan untuk operasional harian kasir & WhatsApp',
  },
  {
    id: 'gpt',
    name: 'OpenAI GPT',
    subName: 'GPT-4o / GPT-3.5',
    tag: 'High Reasoning',
    tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    borderActive: 'border-indigo-500 ring-2 ring-indigo-500/30',
    bgActive: 'bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950/60',
    icon: Bot,
    iconColor: 'text-indigo-400',
    iconBg: 'from-indigo-500/20 to-purple-500/20',
    description:
      'Model bahasa paling populer untuk percakapan natural, pemahaman nuansa curhat mahasiswa, dan penalaran menu yang sangat fleksibel.',
    features: [
      'Gaya bahasa ramah, santun, dan sangat luwes',
      'Penalaran logika pesanan kompleks & kustomisasi topping',
      'Kompatibel dengan endpoint OpenAI API & gateway',
    ],
    latency: '~450 ms',
    statusText: 'Sangat baik untuk percakapan santai & customer engagement',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    subName: 'DeepSeek V3 / R1',
    tag: 'Cost Efficient & Open Weights',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    borderActive: 'border-cyan-500 ring-2 ring-cyan-500/30',
    bgActive: 'bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950/60',
    icon: Cpu,
    iconColor: 'text-cyan-400',
    iconBg: 'from-cyan-500/20 to-blue-500/20',
    description:
      'Arsitektur penalaran canggih dengan efisiensi komputasi tinggi, sangat hemat biaya untuk volume pesan chatting tinggi tanpa mengorbankan kecerdasan.',
    features: [
      'Rasio performa per token paling efisien',
      'Penalaran hitungan budget mahasiswa (misal: menu di bawah Rp 20.000)',
      'Dukungan API DeepSeek & OpenRouter format',
    ],
    latency: '~380 ms',
    statusText: 'Optimal untuk trafik chat tinggi dan penghematan biaya token',
  },
];

export default function AdminAISettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gpt' | 'deepseek'>('gemini');
  const [activeModelInDb, setActiveModelInDb] = useState<string>('gemini');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick Test Playground state
  const [testQuery, setTestQuery] = useState('Menu kopi yang creamy dan manis buat nugas malam ini apa ya?');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

  // Fetch initial setting
  useEffect(() => {
    fetchActiveSetting();
  }, []);

  const fetchActiveSetting = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/ai');
      const data = await res.json();
      if (data.success && data.activeModel) {
        setSelectedModel(data.activeModel);
        setActiveModelInDb(data.activeModel);
      }
    } catch (err) {
      console.error('Failed to load active AI model:', err);
      showToast('Gagal memuat konfigurasi model AI dari server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSaveModel = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
      });
      const data = await res.json();

      if (data.success) {
        setActiveModelInDb(selectedModel);
        showToast(
          `Model AI Barista berhasil diubah ke ${
            selectedModel === 'gemini'
              ? 'Google Gemini'
              : selectedModel === 'gpt'
              ? 'OpenAI GPT'
              : 'DeepSeek'
          }!`,
          'success'
        );
      } else {
        showToast(data.error || 'Gagal menyimpan perubahan model.', 'error');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      showToast('Terjadi kesalahan jaringan saat menyimpan konfigurasi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRunTestQuery = async () => {
    if (!testQuery.trim()) return;
    try {
      setTesting(true);
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
        setTestResponse(`⚠️ Error (${res.status}): ${errJson?.error || 'Gagal mendapatkan jawaban dari AI.'}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setTestResponse('Gagal membaca response stream dari AI.');
        return;
      }

      const decoder = new TextDecoder();
      let fullText = '';

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
                fullText += parsed.chunk;
                setTestResponse((prev) => prev + parsed.chunk);
              }
            } catch {
              // ignore parse errors for non-json lines
            }
          }
        }
      }

      if (!fullText) {
        setTestResponse('Model AI memberikan respon kosong atau respon ditangani oleh fallback.');
      }
    } catch (err: any) {
      console.error('Test query error:', err);
      setTestResponse(`⚠️ Gagal menghubungi endpoint chat: ${err?.message || err}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab="ai-settings"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col lg:pl-[260px] min-w-0 transition-[padding] duration-300">
        <AdminNavbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          pageTitle="🤖 Pengaturan Model AI Barista"
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div
            className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
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
            <span className="font-medium text-sm">{toast.text}</span>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
          {/* Header Banner - Warm Espresso & Gold Accent */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-coffee-950 via-[#1E120B] to-slate-900 border border-amber-600/30 p-6 md:p-8 shadow-2xl">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 left-10 w-60 h-60 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Engine Switcher & Multi-Model Intelligence</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Pilih Model Kecerdasan <span className="text-amber-400">Barista AI</span>
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Pilih engine Large Language Model (LLM) yang digunakan untuk melayani percakapan pelanggan di
                  Chatbot Web dan WhatsApp Business Kopi Mahasiswa. Perubahan berlaku secara instan untuk semua sesi.
                </p>
              </div>

              {/* Status Box */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shrink-0 flex flex-col gap-1.5 shadow-lg backdrop-blur-sm min-w-[200px]">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  Model Aktif Saat Ini
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                  <span className="font-bold text-base text-white">
                    {activeModelInDb === 'gemini'
                      ? 'Google Gemini'
                      : activeModelInDb === 'gpt'
                      ? 'OpenAI GPT'
                      : 'DeepSeek'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Status: Operasional & Siap</span>
              </div>
            </div>
          </div>

          {/* Model Selection Radio Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  Pilihan Engine Model AI
                </h2>
                <p className="text-xs text-slate-400">
                  Klik pada salah satu kartu model untuk memilih, lalu simpan perubahan di bagian bawah.
                </p>
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Memuat konfigurasi...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {MODEL_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedModel === opt.id;
                const isCurrentActive = activeModelInDb === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedModel(opt.id)}
                    className={`relative rounded-2xl p-5 border cursor-pointer transition-all duration-200 flex flex-col justify-between group select-none ${
                      isSelected
                        ? `${opt.borderActive} ${opt.bgActive} shadow-xl shadow-amber-950/20`
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    {/* Active In Database Pill */}
                    {isCurrentActive && (
                      <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Live Aktif</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Top icon and selection indicator */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opt.iconBg} flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform`}
                        >
                          <Icon className={`w-6 h-6 ${opt.iconColor}`} />
                        </div>

                        {/* Radio Check Circle */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400 text-slate-950'
                              : 'border-slate-700 bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Model Titles */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-white">{opt.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${opt.tagColor}`}
                          >
                            {opt.tag}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-amber-400/90">{opt.subName}</p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed">{opt.description}</p>

                      {/* Feature Points */}
                      <ul className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                        {opt.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 shrink-0 font-bold">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bottom Latency & Status */}
                    <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        {opt.latency}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {opt.statusText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Save Bar */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Model Terpilih:{' '}
                  <span className="text-amber-400">
                    {selectedModel === 'gemini'
                      ? 'Google Gemini (Gemini 2.5 Flash)'
                      : selectedModel === 'gpt'
                      ? 'OpenAI GPT (GPT-4o / GPT-3.5)'
                      : 'DeepSeek (DeepSeek V3 / R1)'}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  {selectedModel === activeModelInDb
                    ? 'Model ini sedang aktif digunakan oleh seluruh Chatbot pelanggan.'
                    : 'Konfigurasi belum tersimpan. Klik tombol simpan di samping untuk menerapkan.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini')}
                disabled={saving || selectedModel === 'gemini'}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Default
              </button>

              <button
                type="button"
                id="save-ai-model-btn"
                onClick={handleSaveModel}
                disabled={saving || selectedModel === activeModelInDb}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Model AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Playground / Testing Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-coffee-800 text-amber-300 flex items-center justify-center font-bold text-sm">
                  ☕
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Playground Pengujian Respon AI</h3>
                  <p className="text-xs text-slate-400">
                    Kirim pertanyaan uji coba untuk memvalidasi respon dan akurasi filter kategori menu secara langsung.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Uji Langsung API /api/chat</span>
              </div>
            </div>

            {/* Input prompt */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Ketik pertanyaan untuk Barista AI..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleRunTestQuery}
                  disabled={testing || !testQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-all disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Uji Pertanyaan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preset Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500">Contoh Cepat:</span>
                {[
                  'Menu kopi yang creamy dan manis',
                  'Minuman non-kopi yang segar',
                  'Camilan / snack buat nugas',
                  'Apakah meja nomor 4 kosong?',
                ].map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setTestQuery(sample)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Preview Box */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 min-h-[120px] max-h-[300px] overflow-y-auto font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {testing && !testResponse && (
                <div className="flex items-center gap-2 text-slate-500 italic py-4 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Barista AI sedang meracik jawaban...</span>
                </div>
              )}
              {testResponse ? (
                <div>{testResponse}</div>
              ) : !testing ? (
                <span className="text-slate-600 italic">
                  Belum ada respon. Klik tombol &ldquo;Uji Pertanyaan&rdquo; di atas untuk melihat respon real-time dari model AI yang dipilih.
                </span>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
