'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Coffee, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, phone: identifier, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        const role = data.user.role;
        if (redirectPath) {
          router.push(redirectPath);
        } else if (role === 'Admin') {
          router.push('/admin');
        } else if (role === 'Cashier') {
          router.push('/cashier');
        } else if (role === 'Barista') {
          router.push('/barista');
        } else if (role === 'Owner') {
          router.push('/owner');
        } else {
          router.push('/menu');
        }
      } else {
        setErrorMessage(data.error || 'Login gagal. Periksa kembali Email atau Nomor WhatsApp Anda.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kendala jaringan. Mohon coba beberapa saat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      {/* Golden Banner Promo Mahasiswa */}
      <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-coffee-950 shadow-lg border border-amber-300 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-coffee-950 shrink-0" />
          <span className="text-xs font-black">
            Belum jadi member? Dapatkan diskon 10% di setiap pesanan!
          </span>
        </div>
        <Link
          href="/register"
          className="px-3 py-1.5 rounded-xl bg-coffee-950 text-amber-300 font-extrabold text-xs whitespace-nowrap hover:bg-black transition-colors"
        >
          Daftar Member
        </Link>
      </div>

      <div className="bg-white dark:bg-espresso-card rounded-3xl p-6 sm:p-8 border border-coffee-200/80 dark:border-espresso-border shadow-2xl space-y-6 transition-colors">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coffee-800 to-coffee-950 text-amber-300 flex items-center justify-center mx-auto shadow-md border border-amber-500/20">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-coffee-950 dark:text-cream">
            Login Kopi Mahasiswa
          </h1>
          <p className="text-xs text-coffee-700 dark:text-coffee-300">
            Masuk dengan Email atau Nomor WhatsApp terdaftar
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-coffee-900 dark:text-cream block mb-1.5">
              Email atau No. WhatsApp / HP
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-coffee-500 dark:text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="081234567890 atau email@kampus.ac.id"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-3.5 rounded-2xl border border-coffee-200 dark:border-espresso-border bg-coffee-50/50 dark:bg-espresso-deep text-coffee-950 dark:text-cream focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-coffee-900 dark:text-cream">
                Password (Khusus Staf / Member Ber-password)
              </label>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Opsional jika member baru</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-coffee-500 dark:text-coffee-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-3.5 rounded-2xl border border-coffee-200 dark:border-espresso-border bg-coffee-50/50 dark:bg-espresso-deep text-coffee-950 dark:text-cream focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-coffee-900 via-coffee-950 to-black text-amber-300 dark:from-amber-500 dark:via-amber-400 dark:to-amber-500 dark:text-coffee-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl hover:shadow-amber-glow hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 transition-all border border-amber-500/30"
          >
            <span>{isSubmitting ? 'Memproses Masuk...' : 'Masuk Sekarang →'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>

        {/* Demo Accounts Quick Fill */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-espresso-deep border border-amber-200/70 dark:border-espresso-border text-[11px] text-coffee-950 dark:text-cream space-y-2">
          <p className="font-extrabold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" /> Akun Demo Cepat:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
            {[
              { label: 'Admin', email: 'admin@kopimahasiswa.id' },
              { label: 'Kasir', email: 'cashier@kopimahasiswa.id' },
              { label: 'Barista', email: 'barista@kopimahasiswa.id' },
              { label: 'Owner', email: 'owner@kopimahasiswa.id' },
              { label: 'Customer', email: 'customer@kopimahasiswa.id' },
            ].map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => {
                  setIdentifier(acc.email);
                  setPassword('password123');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-espresso-card border border-amber-200 dark:border-espresso-border hover:border-amber-400 text-coffee-950 dark:text-cream font-bold text-center transition active:scale-95 shadow-2xs"
              >
                {acc.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80 pt-1 text-center font-medium">
            Password demo staf: <code className="bg-white/80 dark:bg-black/50 px-1 py-0.5 rounded font-mono font-bold">password123</code>
          </p>
        </div>

        <div className="text-center pt-3 border-t border-coffee-100 dark:border-espresso-border text-xs">
          <span className="text-coffee-700 dark:text-coffee-400">Belum mendaftar member? </span>
          <Link href="/register" className="font-black text-amber-700 dark:text-amber-300 hover:underline">
            Daftar Member Mahasiswa (Diskon 10%)
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Memuat login page...</div>}>
      <LoginForm />
    </Suspense>
  );
}
