'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, MapPin, ShoppingBag, User, LogOut, Sparkles, Heart } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import NotificationCenter from './NotificationCenter';
import AIChatModal from './AIChatModal';

interface HeaderProps {
  title?: string;
  showCart?: boolean;
}

export default function Header({ title, showCart = true }: HeaderProps = {}) {
  const pathname = usePathname();
  const { tableNumber, cart } = useOrderStore();
  const [user, setUser] = useState<any>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-coffee-200/50 shadow-sm transition-all duration-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/menu" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coffee-700 to-coffee-900 text-amber-200 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg leading-tight tracking-tight text-coffee-950 block">
                {title || <>Kopi <span className="text-coffee-600">Mahasiswa</span></>}
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-amber-800/70 block">
                Coffeeshop & Study Space
              </span>
            </div>
          </Link>

          {/* Right Section: AI Barista, Table Badge, Notification, Cart & User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* ✨ Tanya AI Button */}
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-900 text-xs font-bold hover:bg-amber-500/30 transition-all shadow-xs"
              title="Tanya Barista AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-spin" />
              <span className="hidden md:inline">✨ Tanya AI</span>
            </button>

            {/* Table Selector Badge */}
            <Link
              href="/table-select"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coffee-100/90 text-coffee-900 text-xs font-semibold hover:bg-coffee-200 border border-coffee-300/60 transition-colors shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-coffee-600" />
              <span>{tableNumber ? tableNumber : 'Pilih Meja'}</span>
            </Link>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Cart Icon */}
            {showCart && (
              <Link
                href="/cart"
                className="relative p-2 rounded-xl bg-coffee-100/70 text-coffee-900 hover:bg-coffee-200 transition-colors"
                title="Keranjang"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-coffee-600 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                    {totalCartCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Account / Profile / Staff Link */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href={
                    user.role === 'Admin'
                      ? '/admin'
                      : user.role === 'Cashier'
                      ? '/cashier'
                      : user.role === 'Barista'
                      ? '/barista'
                      : user.role === 'Owner'
                      ? '/owner'
                      : '/profile'
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-coffee-900 text-amber-100 text-xs font-semibold hover:bg-coffee-800 transition-colors shadow-xs"
                  title="Akun & Profil"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {user.name.split(' ')[0]} ({user.role === 'Customer' ? `${user.points || 0} Poin` : user.role})
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-coffee-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl bg-coffee-900 text-amber-100 text-xs font-semibold hover:bg-coffee-800 transition-colors shadow-xs"
                >
                  Masuk
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AI Chat Modal */}
      <AIChatModal isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </>
  );
}
