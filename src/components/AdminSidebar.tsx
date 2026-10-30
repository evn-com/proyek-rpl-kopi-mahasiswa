'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Coffee, TrendingUp, Package, Layers, Sparkles, FlaskConical,
  BookOpen, Boxes, Tag, Ticket, Users, X, ShieldCheck, MessageSquare, Bot, LogOut,
} from 'lucide-react';
import { clientLogout } from '@/lib/authClient';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  lowStockCount?: number;
  pendingMembersCount?: number;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
}

interface SidebarSection {
  title: string | null;
  items: SidebarItem[];
}

const SECTIONS: SidebarSection[] = [
  {
    title: null,
    items: [
      { id: 'overview', label: 'Dashboard', icon: TrendingUp },
    ],
  },
  {
    title: 'PRODUK',
    items: [
      { id: 'products', label: 'Produk', icon: Package },
      { id: 'categories', label: 'Kategori', icon: Layers },
      { id: 'toppings', label: 'Toppings', icon: Sparkles },
    ],
  },
  {
    title: 'INVENTARIS',
    items: [
      { id: 'ingredients', label: 'Bahan Baku', icon: FlaskConical },
      { id: 'recipes', label: 'Resep (BOM)', icon: BookOpen },
      { id: 'inventory', label: 'Riwayat Inventaris', icon: Boxes },
    ],
  },
  {
    title: 'PEMASARAN',
    items: [
      { id: 'promotions', label: 'Promosi', icon: Tag },
      { id: 'vouchers', label: 'Vouchers', icon: Ticket },
    ],
  },
  {
    title: 'KOMUNIKASI & PENGGUNA',
    items: [
      { id: 'inbox', label: 'WhatsApp Live Chat & Handover', icon: MessageSquare },
      { id: 'users', label: 'Manajemen Pengguna', icon: Users },
    ],
  },
  {
    title: 'PENGATURAN SISTEM',
    items: [
      { id: 'ai-settings', label: '🤖 Pengaturan AI', icon: Bot, href: '/admin/settings/ai' },
    ],
  },
];

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  lowStockCount = 0,
  pendingMembersCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleItemClick = (item: SidebarItem) => {
    if (item.href) {
      onClose();
      router.push(item.href);
      return;
    }

    if (pathname !== '/admin') {
      onClose();
      router.push(item.id === 'overview' ? '/admin' : `/admin?tab=${item.id}`);
      return;
    }

    if (setActiveTab) {
      setActiveTab(item.id);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[260px] bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <Link href="/admin" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20 group-hover:scale-105 transition-transform">
              <Coffee className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <span className="font-bold text-[13px] text-white block leading-tight tracking-tight">
                Kopi Mahasiswa
              </span>
              <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-amber-400/70 block">
                Admin Panel
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Tutup Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items (scrollable) */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5 sidebar-nav">
          {SECTIONS.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-600">
                    {section.title}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isCurrentRoute = item.href ? pathname === item.href : false;
                  const active = activeTab === item.id || isCurrentRoute;
                  let badgeCount = 0;
                  let badgeColor = '';
                  if (item.id === 'ingredients') {
                    badgeCount = lowStockCount;
                    badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
                  }
                  if (item.id === 'users') {
                    badgeCount = pendingMembersCount;
                    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group relative ${
                        active
                          ? 'bg-amber-500/10 text-amber-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                      )}
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          active ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {badgeCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold border ${badgeColor} ${
                            item.id === 'users' ? 'animate-pulse' : ''
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-amber-500/70 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 font-medium leading-tight block">
                Admin Dashboard
              </span>
              <span className="text-[9px] text-slate-600 block">
                Kopi Mahasiswa &copy; 2026
              </span>
            </div>
          </div>

          <button
            onClick={() => clientLogout('/login')}
            type="button"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
