'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export default function FloatingCartBar() {
  const { cart, getCartFinalTotal } = useOrderStore();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = getCartFinalTotal();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom duration-300">
      <Link
        href="/cart"
        className="flex items-center justify-between p-3.5 px-5 rounded-2xl bg-gradient-to-r from-coffee-900 via-coffee-800 to-coffee-950 text-amber-100 shadow-xl border border-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-coffee-950 text-[10px] font-extrabold flex items-center justify-center shadow-xs">
              {totalItems}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-amber-200/80 uppercase tracking-wider block font-medium">
              Keranjang Pesanan
            </span>
            <span className="font-extrabold text-base text-white">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold group-hover:translate-x-1 transition-transform">
          <span>Lihat Keranjang</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
}
