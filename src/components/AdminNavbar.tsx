'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, User, LogOut, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import { clientLogout } from '@/lib/authClient';

interface AdminNavbarProps {
  onToggleSidebar?: () => void;
  pageTitle?: string;
}

export default function AdminNavbar({ onToggleSidebar, pageTitle }: AdminNavbarProps) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setUser(data?.user || null);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  const handleLogout = async () => {
    setUser(null);
    await clientLogout('/login');
  };

  const displayName = user?.name ? user.name.split(' ')[0] : 'Admin';
  const displayRole = user?.role || 'Admin';

  return (
    <header className="sticky top-0 z-30 border-b border-coffee-200/60 dark:border-slate-800 shadow-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-200">
      <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger toggle & optional page title */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coffee-700 to-coffee-900 dark:from-amber-600 dark:to-amber-800 text-amber-200 dark:text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base leading-tight tracking-tight text-coffee-950 dark:text-slate-100 block">
                {pageTitle || 'Admin Dashboard & Inventory'}
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-amber-800/80 dark:text-amber-400/80 block">
                Kopi Mahasiswa Management System
              </span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Toggle Dark Mode */}
          <ThemeToggle />

          {/* Notifikasi */}
          <NotificationCenter />

          {/* Status Akun Admin */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-coffee-900 text-amber-100 dark:bg-amber-500 dark:text-coffee-950 text-xs font-semibold shadow-xs"
            title={`Akun: ${displayName} (${displayRole})`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {displayName} ({displayRole})
            </span>
            <span className="sm:hidden">
              {displayRole}
            </span>
          </div>

          {/* Tombol Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-coffee-700 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors shadow-xs"
            title="Keluar / Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
