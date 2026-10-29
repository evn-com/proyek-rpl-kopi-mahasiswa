import React from 'react';
import type { Metadata } from 'next';
import OwnerNavbar from '@/components/OwnerNavbar';

export const metadata: Metadata = {
  title: 'Owner Executive Dashboard | Kopi Mahasiswa',
  description: 'Executive dashboard read-only pemantauan omzet, laba estimasi, dan proyeksi bisnis Kopi Mahasiswa.',
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <OwnerNavbar />
      <div className="flex-1 w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
