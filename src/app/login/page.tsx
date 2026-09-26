'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Coffee, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [email, setEmail] = useState<string>('');
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
        body: JSON.stringify({ email, password }),
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
        setErrorMessage(data.error || 'Login gagal.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-coffee-200/80 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coffee-800 to-coffee-950 text-amber-200 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-coffee-950">Masuk Sistem Kopi Mahasiswa</h1>
          <p className="text-xs text-coffee-700 mt-1">
            Login staf (Kasir, Barista, Admin, Owner) atau Pelanggan
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-coffee-900 block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-coffee-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@kopimahasiswa.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-coffee-200 bg-cream/30 text-coffee-950 focus:outline-none focus:border-coffee-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-coffee-900 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-coffee-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-coffee-200 bg-cream/30 text-coffee-950 focus:outline-none focus:border-coffee-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-coffee-800 to-coffee-950 text-amber-100 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all"
          >
            <span>{isSubmitting ? 'Memproses...' : 'Masuk Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-950 space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700" /> Klik untuk Isi Akun Demo Cepat:
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
                  setEmail(acc.email);
                  setPassword('password123');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50 text-coffee-950 font-bold text-center transition active:scale-95 shadow-2xs"
              >
                {acc.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-amber-800/80 pt-1 text-center">
            Semua password demo: <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold">password123</code>
          </p>
        </div>

        <div className="text-center pt-2 border-t border-coffee-100 text-xs">
          <span className="text-coffee-700">Pelanggan baru? </span>
          <Link href="/register" className="font-bold text-coffee-900 hover:underline">
            Daftar Akun Mahasiswa
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
