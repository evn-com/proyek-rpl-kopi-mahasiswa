'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, User, Phone, GraduationCap, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [campus, setCampus] = useState<string>('');
  const [whatsappConsent, setWhatsappConsent] = useState<boolean>(true);
  const [promoConsent, setPromoConsent] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          campus,
          whatsappConsent,
          promoConsent,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Pendaftaran diajukan! Menunggu persetujuan Admin (notifikasi akan dikirim via WhatsApp)...');
        setTimeout(() => {
          router.push('/menu');
        }, 1800);
      } else {
        setErrorMessage(data.error || 'Pendaftaran member gagal. Silakan periksa kembali data Anda.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kendala jaringan. Mohon coba beberapa saat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-14">
      {/* ======================================================== */}
      {/* 🎓 BANNER PROMO EMAS KHUSUS MAHASISWA (REVISI 4) */}
      {/* ======================================================== */}
      <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-coffee-950 shadow-xl border-2 border-amber-300 flex items-start gap-3.5 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
        <div className="w-10 h-10 rounded-2xl bg-coffee-950 text-amber-300 flex items-center justify-center shrink-0 shadow-md">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-coffee-950/20 px-2 py-0.5 rounded-md inline-block mb-1">
            Program Loyalitas 2026
          </span>
          <p className="text-xs sm:text-sm font-black leading-snug">
            🎓 Khusus Mahasiswa: Daftar sekarang dan langsung dapatkan POTONGAN 10% untuk setiap pemesanan menu!
          </p>
          <p className="text-[11px] font-semibold text-coffee-900/90 mt-1">
            Bonus 50 Poin Sambutan otomatis masuk ke akun member & dikonfirmasi via WhatsApp.
          </p>
        </div>
      </div>

      {/* Card Form Pendaftaran */}
      <div className="bg-white dark:bg-espresso-card rounded-3xl p-6 sm:p-9 border border-coffee-200/80 dark:border-espresso-border shadow-2xl space-y-6 transition-colors">
        {/* Header Form */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coffee-800 to-coffee-950 text-amber-300 flex items-center justify-center mx-auto shadow-md border border-amber-500/20">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-coffee-950 dark:text-cream">
            Daftar Member Kopi Mahasiswa
          </h1>
          <p className="text-xs sm:text-sm text-coffee-700 dark:text-coffee-300">
            Cukup 3 data singkat untuk mengaktifkan diskon 10% seumur hidup.
          </p>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Notifikasi Sukses */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 🎓 FORM REGISTRASI HANYA 3 KOLOM (NAMA, NO WA, KAMPUS) */}
        {/* ======================================================== */}
        <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
          {/* Kolom 1: Nama Lengkap */}
          <div>
            <label className="text-xs font-extrabold text-coffee-900 dark:text-cream block mb-1.5">
              1. Nama Lengkap <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-coffee-500 dark:text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Contoh: Ahmad Rizky Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-3.5 rounded-2xl border border-coffee-200 dark:border-espresso-border bg-coffee-50/50 dark:bg-espresso-deep text-coffee-950 dark:text-cream focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Kolom 2: Nomor Telepon / WhatsApp */}
          <div>
            <label className="text-xs font-extrabold text-coffee-900 dark:text-cream block mb-1.5">
              2. Nomor Telepon / WhatsApp <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-coffee-500 dark:text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-3.5 rounded-2xl border border-coffee-200 dark:border-espresso-border bg-coffee-50/50 dark:bg-espresso-deep text-coffee-950 dark:text-cream focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Pemberitahuan persetujuan membership & voucher akan dikirim ke WhatsApp ini.</span>
            </p>
          </div>

          {/* Kolom 3: Asal Kampus */}
          <div>
            <label className="text-xs font-extrabold text-coffee-900 dark:text-cream block mb-1.5">
              3. Asal Kampus / Institusi <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-coffee-500 dark:text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Contoh: Universitas Indonesia / ITB / UNY dll"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-3.5 rounded-2xl border border-coffee-200 dark:border-espresso-border bg-coffee-50/50 dark:bg-espresso-deep text-coffee-950 dark:text-cream focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Persetujuan WhatsApp & Promo (Opt-in WhatsApp Business Platform) */}
          <div className="space-y-2 pt-1 border-t border-coffee-100 dark:border-espresso-border">
            <label className="flex items-start gap-2.5 text-xs text-coffee-800 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                className="mt-0.5 rounded border-coffee-300 text-amber-600 focus:ring-amber-500"
              />
              <span>
                Saya bersedia menerima notifikasi status membership dan konfirmasi akun melalui WhatsApp.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-coffee-800 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={promoConsent}
                onChange={(e) => setPromoConsent(e.target.checked)}
                className="mt-0.5 rounded border-coffee-300 text-amber-600 focus:ring-amber-500"
              />
              <span>
                Saya bersedia menerima informasi promo harian Kopi Mahasiswa via WhatsApp (dapat dinonaktifkan kapan saja dengan balas STOP).
              </span>
            </label>
          </div>

          {/* Catatan Alur Verifikasi */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
            ℹ️ <strong>Alur Persetujuan:</strong> Pendaftaran akan berstatus <em>PENDING</em> dan diverifikasi oleh Admin. Notifikasi persetujuan resmi dan bonus 50 poin akan otomatis dikirimkan ke nomor WhatsApp Anda setelah disetujui.
          </div>

          {/* Tombol Submit Registrasi */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-coffee-900 via-coffee-950 to-black text-amber-300 dark:from-amber-500 dark:via-amber-400 dark:to-amber-500 dark:text-coffee-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl hover:shadow-amber-glow hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 transition-all border border-amber-500/30"
          >
            <span>{isSubmitting ? 'Mengajukan Pendaftaran...' : 'Ajukan Membership & Klaim Diskon 10% →'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>

        {/* Link ke Login jika sudah punya akun */}
        <div className="text-center pt-3 border-t border-coffee-100 dark:border-espresso-border text-xs">
          <span className="text-coffee-700 dark:text-coffee-400">Sudah terdaftar sebagai member? </span>
          <Link href="/login" className="font-extrabold text-coffee-950 dark:text-amber-300 hover:underline">
            Login di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
