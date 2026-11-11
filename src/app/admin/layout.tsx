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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200 isolate">
      {children}
    </div>
  );
}
