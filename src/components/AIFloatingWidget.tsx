'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, Sparkles, X } from 'lucide-react';
import AIChatModal from './AIChatModal';

export default function AIFloatingWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenEvent);
    return () => window.removeEventListener('open-ai-chat', handleOpenEvent);
  }, []);

  // Sembunyikan floating widget jika berada di halaman admin/staff
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/cashier') ||
    pathname?.startsWith('/barista') ||
    pathname?.startsWith('/owner')
  ) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (Melayang di Pojok Kanan Bawah fixed bottom-6 right-6 z-50) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="ai-chat-trigger-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
          aria-label={isOpen ? 'Tutup Chat AI' : 'Tanya Barista AI Kopi Mahasiswa'}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-coffee-950 via-coffee-900 to-amber-600 dark:from-black dark:via-espresso-card dark:to-amber-500 text-amber-300 shadow-xl hover:shadow-2xl hover:scale-108 active:scale-95 transition-all duration-300 border-2 border-amber-400/80 hover:border-amber-300 focus:outline-none"
        >
          {/* Efek Bercahaya (Glowing Ring) */}
          <span className="absolute -inset-1.5 rounded-full bg-amber-400/30 blur-md group-hover:bg-amber-400/60 animate-pulse pointer-events-none" />

          {/* AI Bot & Sparkles Icon */}
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-6 h-6 text-amber-300 transition-transform duration-200" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Bot className="w-6 h-6 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
                <Sparkles className="w-3.5 h-3.5 text-amber-200 absolute -top-2 -right-2 animate-bounce drop-shadow" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-coffee-950 animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-coffee-950" />
              </div>
            )}
          </div>

          {/* Tooltip on hover */}
          {!isOpen && (
            <span className="absolute right-full mr-3.5 px-3 py-1.5 rounded-xl bg-coffee-950/95 dark:bg-espresso-card text-amber-200 text-xs font-extrabold whitespace-nowrap shadow-xl border border-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden sm:block">
              ✨ Tanya Barista AI (Rekomendasi & Meja)
            </span>
          )}
        </button>
      </div>

      {/* Drawer / Modal Chat AI di atas tombol melayang (fixed bottom-20 right-6) */}
      <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
