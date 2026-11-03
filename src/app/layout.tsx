import './globals.css';
import type { Metadata, Viewport } from 'next';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { ThemeProvider } from '@/components/ThemeProvider';
import AIFloatingWidget from '@/components/AIFloatingWidget';

export const metadata: Metadata = {
  title: 'Kopi Mahasiswa | E-Commerce & QR Ordering Coffee Shop',
  description:
    'Sistem pemesanan kopi digital dari meja dengan QR Code untuk kedai Kopi Mahasiswa. Nikmati racikan espresso & kopi susu kekinian harga hemat mahasiswa.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('km_theme');
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream dark:bg-espresso-deep text-coffee-950 dark:text-cream antialiased selection:bg-coffee-200 dark:selection:bg-amber-900 transition-colors duration-200">
        <ThemeProvider>
          <PublicNavbar />
          <main className="flex-1">{children}</main>
          {/* Public Footer Pelanggan (Otomatis disembunyikan di rute admin/staff) */}
          <PublicFooter />

          {/* Global Floating AI Barista Widget */}
          <AIFloatingWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
