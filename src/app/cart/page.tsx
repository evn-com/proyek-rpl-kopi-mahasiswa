'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, Plus, Minus, Ticket, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export default function CartPage() {
  const {
    cart,
    tableNumber,
    updateQuantity,
    removeFromCart,
    appliedVoucher,
    setAppliedVoucher,
    getCartSubtotal,
    getCartDiscount,
    getCartFinalTotal,
  } = useOrderStore();

  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const subtotal = getCartSubtotal();
  const discount = getCartDiscount();
  const finalTotal = getCartFinalTotal();

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setIsApplying(true);
    setVoucherError(null);
    setVoucherSuccess(null);

    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCodeInput.trim(), subtotal }),
      });
      const data = await res.json();

      if (res.ok && data.voucher) {
        setAppliedVoucher(data.voucher);
        setVoucherSuccess(`Voucher '${data.voucher.code}' berhasil dipasang! Hemat Rp ${data.voucher.discountAmount.toLocaleString('id-ID')}`);
        setVoucherCodeInput('');
      } else {
        setVoucherError(data.error || 'Voucher tidak valid.');
      }
    } catch (err) {
      setVoucherError('Gagal memvalidasi voucher.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherSuccess(null);
    setVoucherError(null);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-coffee-100 text-coffee-700 flex items-center justify-center mx-auto mb-4 border border-coffee-200">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-coffee-950 mb-1">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-coffee-700 mb-6">
          Anda belum menambahkan menu kopi atau snack ke dalam keranjang.
        </p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-coffee-900 text-amber-100 font-bold text-xs hover:bg-coffee-800 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lihat Menu Kopi</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-coffee-800 hover:text-coffee-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Menu
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-bold text-coffee-900 bg-coffee-100 px-3 py-1.5 rounded-full border border-coffee-200">
          <MapPin className="w-3.5 h-3.5 text-coffee-600" />
          <span>{tableNumber || 'Belum Pilih Meja'}</span>
        </div>
      </div>

      <h1 className="text-2xl font-extrabold text-coffee-950 mb-6">Keranjang Pesanan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cart Item List */}
        <div className="md:col-span-2 space-y-3">
          {cart.map((item) => (
            <div
              key={item.cartItemId}
              className="p-4 rounded-2xl bg-white border border-coffee-200/80 shadow-xs flex gap-3.5 items-start justify-between"
            >
              {/* Product Thumbnail */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-coffee-100 shrink-0">
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-coffee-950 text-sm leading-tight">
                  {item.product.name}
                </h3>

                <div className="text-[11px] text-coffee-700/90 mt-1 space-y-0.5">
                  {item.selectedVariant && (
                    <p className="font-medium text-coffee-900">Varian: {item.selectedVariant.name}</p>
                  )}
                  {item.temperature && <p>Suhu: {item.temperature}</p>}
                  {item.sugarLevel && <p>Gula: {item.sugarLevel}</p>}
                  {item.iceLevel && <p>Es: {item.iceLevel}</p>}

                  {item.selectedToppings && item.selectedToppings.length > 0 && (
                    <p className="text-amber-800 font-medium">
                      Topping: {item.selectedToppings.map((t) => t.name).join(', ')}
                    </p>
                  )}

                  {item.notes && (
                    <p className="italic text-gray-500">Catatan: "{item.notes}"</p>
                  )}
                </div>

                <div className="mt-2 font-bold text-sm text-coffee-950">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Quantity Controls & Delete */}
              <div className="flex flex-col items-end justify-between h-full space-y-3">
                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Hapus Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 bg-coffee-100/80 p-1 rounded-xl border border-coffee-200 text-xs font-bold">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="w-6 h-6 rounded-lg bg-white text-coffee-900 flex items-center justify-center shadow-xs hover:bg-coffee-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-white text-coffee-900 flex items-center justify-center shadow-xs hover:bg-coffee-50"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Voucher */}
        <div className="space-y-4">
          {/* Voucher Promo Card */}
          <div className="p-4 rounded-2xl bg-white border border-coffee-200/80 shadow-xs">
            <label className="text-xs font-bold text-coffee-950 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-amber-600" />
              <span>Voucher Promo Mahasiswa</span>
            </label>

            {appliedVoucher ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm block">Voucher '{appliedVoucher.code}'</span>
                  <span className="text-[11px] text-emerald-700">
                    Potongan Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <button
                  onClick={handleRemoveVoucher}
                  className="text-xs font-bold text-red-600 hover:underline ml-2"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Kode: MAHASISWAHEMAT"
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-coffee-200 bg-cream text-coffee-950 focus:outline-none uppercase font-bold"
                  />
                  <button
                    onClick={handleApplyVoucher}
                    disabled={isApplying}
                    className="px-3 py-2.5 rounded-xl bg-coffee-900 text-amber-100 text-xs font-bold hover:bg-coffee-800 disabled:opacity-50 transition-colors"
                  >
                    {isApplying ? '...' : 'Pasang'}
                  </button>
                </div>
                {voucherError && (
                  <p className="text-[11px] font-semibold text-red-600">{voucherError}</p>
                )}
                {voucherSuccess && (
                  <p className="text-[11px] font-semibold text-emerald-600">{voucherSuccess}</p>
                )}
                <div className="text-[10px] text-coffee-600 pt-1">
                  💡 Coba kode promo test: <b>MAHASISWAHEMAT</b> (Hemat Rp 5k) atau <b>DISKON10K</b>
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="p-5 rounded-2xl bg-white border border-coffee-200/80 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-sm text-coffee-950 border-b pb-2 border-coffee-100">
              Ringkasan Pembayaran
            </h3>

            <div className="flex justify-between text-coffee-800">
              <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} item)</span>
              <span className="font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Diskon Voucher</span>
                <span>-Rp {discount.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="flex justify-between text-coffee-800">
              <span>Biaya Layanan & Meja</span>
              <span className="font-semibold text-emerald-600">Gratis (Rp 0)</span>
            </div>

            <div className="border-t border-coffee-100 pt-3 flex justify-between items-center text-coffee-950 font-extrabold text-base">
              <span>Total Tagihan</span>
              <span className="text-coffee-900">Rp {finalTotal.toLocaleString('id-ID')}</span>
            </div>

            <Link
              href="/checkout"
              className="mt-4 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-coffee-800 to-coffee-950 text-amber-100 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-coffee-glow hover:brightness-110 active:scale-98 transition-all"
            >
              <span>Lanjut ke Checkout Meja</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
