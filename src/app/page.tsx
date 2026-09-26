'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Coffee, QrCode, Sparkles, MapPin, ArrowRight, Zap, Award } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export default function LandingPage() {
  const { tableNumber } = useOrderStore();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-coffee-950 via-coffee-900 to-espresso-dark text-cream p-6 sm:p-12 overflow-hidden shadow-2xl border border-coffee-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-4 border border-amber-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>QR Order Meja • Bebas Antre</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Pesan Kopi Favoritmu <span className="text-amber-400">Langsung dari Meja.</span>
            </h1>

            <p className="text-coffee-200 text-sm sm:text-base leading-relaxed mb-6">
              Selamat datang di Kopi Mahasiswa! Duduk manis di mejamu, pilih menu nikmat racikan barista kami, dan bayar dengan praktis.
            </p>

            {/* Table status banner */}
            <div className="mb-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-200/80 block">
                    Status Meja Anda
                  </span>
                  <span className="font-bold text-base text-white">
                    {tableNumber ? tableNumber : 'Belum Memilih Meja'}
                  </span>
                </div>
              </div>

              <Link
                href="/table-select"
                className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-500 text-coffee-950 hover:bg-amber-400 transition-colors"
              >
                {tableNumber ? 'Ubah' : 'Pilih Meja'}
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={tableNumber ? '/menu' : '/table-select'}
                className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 transition-all"
              >
                <span>{tableNumber ? 'Mulai Pesan Menu' : 'Pilih Nomor Meja Dulu'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Hero Decorative Image */}
          <div className="relative aspect-square max-w-xs mx-auto md:max-w-none rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/30">
            <Image
              src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80"
              alt="Kopi Mahasiswa Study Space"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-coffee-950/80 via-transparent to-transparent flex items-end p-4">
              <div className="flex items-center gap-2 text-amber-200 text-xs font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>100% Bijikopi Arabika Pilihan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-5 rounded-2xl bg-white border border-coffee-200/60 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-coffee-950 text-sm mb-1">Scan & Order Meja</h3>
            <p className="text-xs text-coffee-700 leading-relaxed">
              QR universal memudahkan pelanggan memilih nomor meja secara akurat dan pesanan diantar langsung.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-coffee-200/60 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-coffee-950 text-sm mb-1">Harga Hemat Mahasiswa</h3>
            <p className="text-xs text-coffee-700 leading-relaxed">
              Kualitas rasa standar cafe profesional dengan promo khusus mahasiswa & skripsi booster.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-coffee-200/60 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-coffee-100 text-coffee-800 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-coffee-950 text-sm mb-1">Status Real-time</h3>
            <p className="text-xs text-coffee-700 leading-relaxed">
              Pantau progres pembuatan pesananmu secara langsung dari Kasir hingga Barista.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
