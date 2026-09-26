import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Kopi Mahasiswa | E-Commerce & QR Ordering Coffee Shop',
  description:
    'Sistem pemesanan kopi digital dari meja dengan QR Code untuk kedai Kopi Mahasiswa. Nikmati racikan espresso & kopi susu kekinian harga hemat mahasiswa.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col bg-cream text-coffee-950 antialiased selection:bg-coffee-200">
        <Header />
        <main className="flex-1 pb-20 sm:pb-12">{children}</main>
        <footer className="py-6 border-t border-coffee-200/60 bg-coffee-100/40 text-center text-xs text-coffee-700/80">
          <div className="max-w-6xl mx-auto px-4">
            <p className="font-semibold text-coffee-900 mb-1">☕ Kopi Mahasiswa - Kampus Utama</p>
            <p>© {new Date().getFullYear()} Kopi Mahasiswa Inc. QR Order & Smart Coffee Shop Platform.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
