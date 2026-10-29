'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * PublicFooter merender Footer 3-kolom pelanggan ("Kopi Mahasiswa")
 * dan otomatis menyembunyikan dirinya jika pengguna sedang berada di halaman manajemen/staff:
 * (/admin, /owner, /cashier, /barista).
 */
export default function PublicFooter() {
  const pathname = usePathname();

  // Sembunyikan footer di seluruh rute dashboard manajemen / staff
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/cashier') ||
    pathname?.startsWith('/barista')
  ) {
    return null;
  }

  return (
    <footer className="border-t border-coffee-200/60 dark:border-espresso-border bg-coffee-100/50 dark:bg-[#160B08] text-coffee-950 dark:text-cream pt-12 pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 pb-10 border-b border-coffee-200/50 dark:border-espresso-border">
          {/* Kolom 1: Info Kampus / Toko */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coffee-800 to-coffee-950 text-amber-300 flex items-center justify-center font-bold shadow-md">
                ☕
              </div>
              <div>
                <span className="font-extrabold text-base text-coffee-950 dark:text-white block">
                  Kopi <span className="text-amber-600 dark:text-amber-400">Mahasiswa</span>
                </span>
                <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-widest block">
                  Warm Espresso & Study Space
                </span>
              </div>
            </div>
            <p className="text-xs text-coffee-700 dark:text-coffee-300 leading-relaxed">
              Kedai kopi modern ramah kantong mahasiswa dengan sistem QR Order meja bebas antre dan koneksi internet cepat untuk nugas santai.
            </p>
            <div className="text-xs text-coffee-700 dark:text-coffee-300 space-y-1 pt-1">
              <p>📍 Gedung Sentra Mahasiswa Lt. 1, Kampus Utama</p>
              <p>🕒 Buka Setiap Hari: 08.00 - 23.00 WIB</p>
              <p>💬 WhatsApp: +62 812-3456-7890</p>
            </div>
          </div>

          {/* Kolom 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-coffee-950 dark:text-amber-300 uppercase tracking-wider">
              Menu & Navigasi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/menu"
                  className="text-coffee-700 dark:text-coffee-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  • Katalog Lengkap Menu & Minuman
                </Link>
              </li>
              <li>
                <Link
                  href="/menu?category=promo-mahasiswa"
                  className="text-coffee-700 dark:text-coffee-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  • Promo Spesial Mahasiswa 2026
                </Link>
              </li>
              <li>
                <Link
                  href="/order-status"
                  className="text-coffee-700 dark:text-coffee-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  • Lacak Status Pesanan Saya
                </Link>
              </li>
              <li>
                <Link
                  href="/table-select"
                  className="text-coffee-700 dark:text-coffee-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  • Pilih & Ganti Nomor Meja
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-coffee-700 dark:text-coffee-300 hover:text-amber-600 dark:hover:text-amber-400 font-bold transition-colors"
                >
                  • Daftar Member Mahasiswa (Diskon 10%)
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Fasilitas Study Space */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-coffee-950 dark:text-amber-300 uppercase tracking-wider">
              Fasilitas Study Space
            </h4>
            <p className="text-xs text-coffee-700 dark:text-coffee-300 leading-relaxed">
              Nikmati kenyamanan nugas dengan fasilitas lengkap yang kami sediakan untuk seluruh pengunjung dan civitas akademika:
            </p>
            <ul className="space-y-1.5 text-xs text-coffee-700 dark:text-coffee-300">
              <li className="flex items-center gap-2">⚡ Stopkontak & USB Charger di setiap meja</li>
              <li className="flex items-center gap-2">📶 WiFi Kecepatan Tinggi 100 Mbps Gratis</li>
              <li className="flex items-center gap-2">🤖 Chatbot AI Barista 24 Jam via WhatsApp</li>
              <li className="flex items-center gap-2">💳 Pembayaran QRIS, E-Wallet & Kasir</li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-coffee-700 dark:text-coffee-400">
          <p>© 2026 Kopi Mahasiswa Inc. Hak Cipta Dilindungi.</p>
          <p className="text-[11px] font-medium text-amber-800/80 dark:text-amber-400/80">
            Ditenagai oleh Next.js 14, Tailwind CSS & WhatsApp Business AI
          </p>
        </div>
      </div>
    </footer>
  );
}
