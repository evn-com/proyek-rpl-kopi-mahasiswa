'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldAlert,
  Radio,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  Server,
  Zap,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';

interface NotificationPreferences {
  whatsappNumber: string;
  enableWhatsApp: boolean;
  enableInApp: boolean;
  notifyNewOrder: boolean;
  notifyPayment: boolean;
  notifyLowStock: boolean;
  notifySystemAlert: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  whatsappNumber: '6281234567890',
  enableWhatsApp: true,
  enableInApp: true,
  notifyNewOrder: false,
  notifyPayment: true,
  notifyLowStock: true,
  notifySystemAlert: true,
};

interface AdminNotificationPreferencesProps {
  onShowToast?: (text: string, type?: 'success' | 'error') => void;
}

export default function AdminNotificationPreferences({
  onShowToast,
}: AdminNotificationPreferencesProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [initialPrefs, setInitialPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (onShowToast) {
      onShowToast(message, type);
    } else {
      setLocalToast({ message, type });
      setTimeout(() => setLocalToast(null), 3500);
    }
  };

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPrefs(data.preferences);
          setInitialPrefs(data.preferences);
        }
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      setInitialPrefs(prefs);
      showToast('Preferensi notifikasi berhasil disimpan ke sistem!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrefs(initialPrefs);
    showToast('Perubahan dibatalkan dan dikembalikan ke preferensi sebelumnya', 'success');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-semibold">Memuat preferensi notifikasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast Alert Internal */}
      {localToast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
            localToast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
          }`}
        >
          {localToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{localToast.message}</span>
        </div>
      )}

      {/* Title Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Preferensi Notifikasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Atur saluran penerima pesan notifikasi, nomor WhatsApp aktif, serta jenis event pesanan dan operasional kafe.
        </p>
      </div>

      {/* CARD 1: Saluran Notifikasi */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-lg">📲</span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Saluran Notifikasi
          </h2>
        </div>

        {/* Input Nomor WhatsApp */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Nomor WhatsApp Aktif (Format: 6281234567890)
          </label>
          <input
            type="text"
            value={prefs.whatsappNumber}
            onChange={(e) => setPrefs({ ...prefs, whatsappNumber: e.target.value })}
            placeholder="6281234567890"
            className="w-full sm:max-w-md px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Kosongkan nomor untuk menonaktifkan verifikasi. Format Indonesia wajib diawali 62.
          </p>
        </div>

        {/* Checkbox Options */}
        <div className="space-y-4 pt-1">
          {/* Notifikasi WhatsApp */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={prefs.enableWhatsApp}
                onChange={(e) => setPrefs({ ...prefs, enableWhatsApp: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  prefs.enableWhatsApp
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              >
                {prefs.enableWhatsApp && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Notifikasi WhatsApp
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kirim pesan WhatsApp (Fonnte) untuk event penting pesanan & operasional kafe.
              </p>
            </div>
          </label>

          {/* Notifikasi Sistem In-App */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={prefs.enableInApp}
                onChange={(e) => setPrefs({ ...prefs, enableInApp: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  prefs.enableInApp
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              >
                {prefs.enableInApp && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Notifikasi Sistem In-App
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tampilkan notifikasi di dalam aplikasi (riwayat notifikasi).
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* CARD 2: Notifikasi Operasional (Admin / Owner) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-lg">🛡️</span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Notifikasi Operasional (Admin / Owner)
          </h2>
        </div>

        <div className="space-y-4">
          {/* Pesanan Baru Masuk */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={prefs.notifyNewOrder}
                onChange={(e) => setPrefs({ ...prefs, notifyNewOrder: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  prefs.notifyNewOrder
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              >
                {prefs.notifyNewOrder && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Pesanan Baru Masuk
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Diberi tahu saat pelanggan membuat pesanan baru dari meja.
              </p>
            </div>
          </label>

          {/* Verifikasi Pembayaran */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={prefs.notifyPayment}
                onChange={(e) => setPrefs({ ...prefs, notifyPayment: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  prefs.notifyPayment
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              >
                {prefs.notifyPayment && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Verifikasi Pembayaran
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Notifikasi konfirmasi pembayaran kasir atau status pesanan.
              </p>
            </div>
          </label>

          {/* Stok Bahan Kritis */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={prefs.notifyLowStock}
                onChange={(e) => setPrefs({ ...prefs, notifyLowStock: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  prefs.notifyLowStock
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              >
                {prefs.notifyLowStock && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Stok Bahan Kritis
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Peringatan otomatis saat stok bahan baku di bar/gudang menipis di bawah batas minimum.
              </p>
            </div>
          </label>

          {/* Peringatan Sistem */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={prefs.notifySystemAlert}
                onChange={(e) => setPrefs({ ...prefs, notifySystemAlert: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  prefs.notifySystemAlert
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              >
                {prefs.notifySystemAlert && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Peringatan Sistem
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Alert keamanan dan operasional penting sistem.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* CARD 3: Status Penyedia Pesan */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-lg">📡</span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Status Penyedia Pesan
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Badge Status */}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              FONNTE GATEWAY TERKONEKSI
            </span>

            {/* Badge Mode */}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              MODE: LIVE
            </span>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              Provider WhatsApp terkonfigurasi. Pengiriman nyata dapat dilakukan.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowDetailModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs"
          >
            Detail Sistem
          </button>
        </div>
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Menyimpan...' : 'Simpan Preferensi'}</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-xl text-sm transition"
        >
          Batalkan Perubahan
        </button>
      </div>

      {/* MODAL DETAIL SISTEM */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detail Sistem WhatsApp Gateway
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Gateway Provider:</span>
                <p className="font-bold text-slate-800 dark:text-slate-100">Fonnte API v1 (Official Partner)</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">API Endpoint:</span>
                <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">https://api.fonnte.com/send</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Status Perangkat:</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Koneksi Aktif (Ready to Dispatch)
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Kanal Webhook:</span>
                <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">/api/whatsapp/webhook (Two-Way Handover)</p>
              </div>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

