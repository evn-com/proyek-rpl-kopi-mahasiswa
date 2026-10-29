'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * PublicNavbar merender Navbar pelanggan ("Kopi Mahasiswa")
 * dan otomatis menyembunyikan dirinya jika pengguna sedang berada di halaman dashboard manajemen/staff (/admin, /owner).
 */
export default function PublicNavbar() {
  const pathname = usePathname();

  // Jika sedang berada di rute dashboard admin, owner, cashier, atau barista, sembunyikan Navbar pelanggan
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/owner') ||
    pathname?.startsWith('/cashier') ||
    pathname?.startsWith('/barista')
  ) {
    return null;
  }

  return <Header />;
}
