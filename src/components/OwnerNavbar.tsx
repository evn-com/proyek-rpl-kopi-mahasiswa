'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Coffee,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Package,
  Sparkles,
  LogOut,
  User,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';

interface NavLinkItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function OwnerNavbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    window.location.href = '/login';
  };

  const navLinks: NavLinkItem[] = [
    { label: 'Ringkasan', href: '/owner#overview', icon: BarChart3 },
    { label: 'Tren Penjualan', href: '/owner#tren-penjualan', icon: TrendingUp },
    { label: 'Stok & Bahan', href: '/owner#stok-bahan', icon: Package },
    { label: 'AI Forecast', href: '/owner#ai-insights', icon: Sparkles },
  ];

  const displayName = user?.name ? user.name.split(' ')[0] : 'Owner';
  const displayRole = user?.role || 'Owner';

  return (
    <header className="sticky top-0 z-40 border-b border-coffee-200/60 dark:border-slate-800/80 shadow-sm bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo & Executive Title */}
        <Link href="/owner" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-coffee-800 via-coffee-900 to-coffee-950 dark:from-amber-600 dark:to-amber-800 text-amber-200 dark:text-white flex items-center justify-center shadow-md group-hover:scale-105 group-hover:shadow-amber-glow transition-all duration-200 border border-amber-500/20">
            <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl leading-tight tracking-tight text-coffee-950 dark:text-cream block">
                Kopi <span className="text-coffee-600 dark:text-amber-400">Mahasiswa</span>
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3" /> Read-Only
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-800/90 dark:text-amber-400/90 block">
              Owner Executive Dashboard
            </span>
          </div>
        </Link>

        {/* Center: Read-Only Executive Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 text-coffee-800 dark:text-slate-300 hover:text-coffee-950 dark:hover:text-amber-300 hover:bg-coffee-100/70 dark:hover:bg-slate-800/80"
            >
              <link.icon className="w-3.5 h-3.5 opacity-80 text-amber-600 dark:text-amber-400" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side: Tools, Owner Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Dark / Light Mode Toggle */}
          <ThemeToggle />

          {/* Notification Center */}
          <NotificationCenter />

          {/* Owner Profile Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-coffee-900 to-coffee-950 text-amber-300 dark:from-slate-900 dark:to-slate-900 dark:text-amber-300 border border-amber-500/20 text-xs font-bold shadow-xs"
            title={`Akun Pemilik: ${displayName} (${displayRole})`}
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              {displayName}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold uppercase tracking-wider">
              {displayRole}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-coffee-700 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors shadow-xs"
            title="Keluar / Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-coffee-800 dark:text-cream hover:bg-coffee-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-coffee-200/50 dark:border-slate-800 bg-white/98 dark:bg-slate-950/98 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Mode Executive Read-Only
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
              {displayRole}
            </span>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-coffee-900 dark:text-slate-200 hover:bg-coffee-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <link.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{link.label}</span>
            </Link>
          ))}

          <div className="pt-2 border-t border-coffee-200/40 dark:border-slate-800 flex items-center justify-between px-3 py-2 text-xs">
            <span className="text-coffee-600 dark:text-slate-400">
              Masuk sebagai: <strong>{displayName}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
