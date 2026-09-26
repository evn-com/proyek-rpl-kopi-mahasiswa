'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/menu');
      } else {
        setErrorMessage(data.error || 'Pendaftaran gagal.');
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
          <h1 className="text-xl font-extrabold text-coffee-950">Daftar Akun Kopi Mahasiswa</h1>
          <p className="text-xs text-coffee-700 mt-1">
            Dapatkan poin member & promo hemat mahasiswa spesial!
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-coffee-900 block mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-coffee-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Ahmad Rizky"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-coffee-200 bg-cream/30 text-coffee-950 focus:outline-none focus:border-coffee-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-coffee-900 block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-coffee-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="ahmad@mahasiswa.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-coffee-200 bg-cream/30 text-coffee-950 focus:outline-none focus:border-coffee-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-coffee-900 block mb-1">No. WhatsApp / HP</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-coffee-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
            <span>{isSubmitting ? 'Membuat Akun...' : 'Daftar Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-coffee-100 text-xs">
          <span className="text-coffee-700">Sudah punya akun? </span>
          <Link href="/login" className="font-bold text-coffee-900 hover:underline">
            Login di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
