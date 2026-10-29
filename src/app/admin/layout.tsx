import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel | Kopi Mahasiswa',
  description: 'Panel Pengelolaan Toko, Inventaris, Pesanan & AI Assistant Kopi Mahasiswa',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-[#120D0A] text-white isolate">
      {children}
    </div>
  );
}
