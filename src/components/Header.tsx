'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, MapPin, ShoppingBag, User, LogOut, Tag, Clock, Info, Menu as MenuIcon, X } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import { clientLogout } from '@/lib/authClient';

interface HeaderProps {
  title?: string;
  showCart?: boolean;
}

export default function Header({ title, showCart = true }: HeaderProps = {}) {
  const pathname = usePathname();
  const { tableNumber, cart } = useOrderStore();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setUser(data?.user || null);
      })
      .catch(() => {
        setUser(null);
      });
  }, [pathname]);

  const handleLogout = async () => {
    setUser(null);
    await clientLogout('/login');
  };

  // Sembunyikan Header pelanggan jika berada di halaman admin atau owner
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/owner')) {
    return null;
  }

  const navLinks = [
    { label: 'Katalog Menu', href: '/menu', icon: Coffee },
    { label: 'Promo', href: '/menu?category=promo-mahasiswa', icon: Tag },
    { label: 'Pesanan Saya', href: '/order-status', icon: Clock },
    { label: 'Tentang Kami', href: '/#tentang-kami', icon: Info },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-coffee-200/50 dark:border-espresso-border shadow-sm transition-all duration-200 bg-cream/90 dark:bg-[#120D0A]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* Sisi Kiri: Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-coffee-800 via-coffee-900 to-coffee-950 dark:from-amber-600 dark:to-amber-800 text-amber-200 dark:text-white flex items-center justify-center shadow-md group-hover:scale-105 group-hover:shadow-amber-glow transition-all duration-200 border border-amber-500/20">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl leading-tight tracking-tight text-coffee-950 dark:text-cream block">
                {title || (
                  <>
                    Kopi <span className="text-coffee-600 dark:text-amber-400">Mahasiswa</span>
                  </>
                )}
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-800/80 dark:text-amber-400/90 block">
                Warm Espresso & Study Space
              </span>
            </div>
          </Link>

          {/* Area Tengah: Link Navigasi Utama */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href.split('?')[0]));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-coffee-900 text-amber-300 dark:bg-amber-500 dark:text-coffee-950 shadow-xs'
                      : 'text-coffee-800 dark:text-coffee-200 hover:text-coffee-950 dark:hover:text-amber-300 hover:bg-coffee-100/70 dark:hover:bg-espresso-card'
                  }`}
                >
                  <link.icon className="w-3.5 h-3.5 opacity-80" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Area Kanan: Action Badges & Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Pill Badge Meja (contoh: "Meja 04") */}
            <Link
              href="/table-select"
              className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coffee-100/90 dark:bg-espresso-card text-coffee-950 dark:text-amber-200 text-xs font-bold hover:bg-coffee-200 dark:hover:bg-coffee-900 border border-coffee-300/70 dark:border-espresso-border transition-all shadow-xs"
              title="Ganti atau Pilih Nomor Meja"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{tableNumber ? (tableNumber.toLowerCase().includes('meja') ? tableNumber : `Meja ${tableNumber}`) : 'Meja 04'}</span>
            </Link>

            {/* Dark / Light Mode Toggle Button */}
            <ThemeToggle />

            {/* Notification Center */}
            <NotificationCenter />

            {/* Cart Icon */}
            {showCart && (
              <Link
                href="/cart"
                className="relative p-2.5 rounded-xl bg-coffee-100/80 hover:bg-coffee-200 text-coffee-900 dark:bg-espresso-card dark:hover:bg-coffee-900 dark:text-amber-200 border border-coffee-300/50 dark:border-espresso-border transition-all shadow-xs hover:scale-105"
                title="Keranjang Pesanan"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950 text-[11px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
                    {totalCartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Profil Member / Tombol Login/Daftar Member */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1 border-l border-coffee-200/60 dark:border-espresso-border">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-coffee-900 to-coffee-950 text-amber-300 dark:from-amber-500 dark:to-amber-600 dark:text-coffee-950 text-xs font-bold hover:brightness-110 transition-all shadow-xs border border-amber-500/20"
                  title="Akun & Profil Member"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="inline">
                    {user.name.split(' ')[0]} ({user.role === 'Customer' ? `${user.points || 50} Poin` : user.role})
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-coffee-700 hover:bg-rose-50 hover:text-rose-600 dark:text-coffee-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-1 border-l border-coffee-200/60 dark:border-espresso-border">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-coffee-900 to-coffee-950 text-amber-300 dark:from-amber-500 dark:to-amber-600 dark:text-coffee-950 text-xs sm:text-sm font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-md border border-amber-500/30 whitespace-nowrap"
                >
                  Login/Daftar Member
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-coffee-800 dark:text-cream hover:bg-coffee-100 dark:hover:bg-espresso-card"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-coffee-200/50 dark:border-espresso-border bg-cream/95 dark:bg-[#120D0A]/95 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-coffee-900 dark:text-cream hover:bg-coffee-100 dark:hover:bg-espresso-card"
              >
                <link.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="pt-2 border-t border-coffee-200/40 dark:border-espresso-border">
              <Link
                href="/table-select"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-900 dark:text-amber-300"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Status Meja:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-coffee-950">
                  {tableNumber ? tableNumber : 'Meja 04'}
                </span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
