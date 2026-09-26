'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Wallet, QrCode, CheckCircle, ArrowLeft, Loader2, ShieldCheck, User } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    tableNumber,
    appliedVoucher,
    customerName,
    customerPhone,
    setCustomerInfo,
    getCartSubtotal,
    getCartDiscount,
    getCartFinalTotal,
    clearCart,
  } = useOrderStore();

  const [nameInput, setNameInput] = useState<string>(customerName || '');
  const [phoneInput, setPhoneInput] = useState<string>(customerPhone || '');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const subtotal = getCartSubtotal();
  const discount = getCartDiscount();
  const finalTotal = getCartFinalTotal();

  // Check logged-in user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setLoggedInUser(data.user);
          if (!nameInput) setNameInput(data.user.name);
          if (!phoneInput && data.user.phone) setPhoneInput(data.user.phone);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!tableNumber) {
      setErrorMessage('Silakan tentukan nomor meja Anda terlebih dahulu.');
      return;
    }

    if (!nameInput.trim()) {
      setErrorMessage('Nama pemesan wajib diisi.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Keranjang Anda kosong.');
      return;
    }

    setIsSubmitting(true);
    setCustomerInfo({ name: nameInput.trim(), phone: phoneInput.trim() });

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          customerName: nameInput.trim(),
          customerPhone: phoneInput.trim() || undefined,
          items: cart,
          voucherCode: appliedVoucher?.code || undefined,
          paymentMethod: paymentMethod === 'QRIS' ? 'ONLINE_PAYMENT' : 'PAY_AT_CASHIER',
          notes: orderNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.order) {
        clearCart();
        router.push(`/order-status?id=${data.order.id}`);
      } else {
        setErrorMessage(data.error || 'Gagal membuat pesanan. Silakan coba lagi.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-coffee-950 mb-2">Keranjang Kosong</h2>
        <p className="text-xs text-coffee-700 mb-4">Silakan pilih menu kopi terlebih dahulu.</p>
        <Link
          href="/menu"
          className="px-4 py-2 rounded-xl bg-coffee-900 text-amber-100 text-xs font-bold"
        >
          Lihat Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-coffee-800 hover:text-coffee-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Keranjang
        </Link>
      </div>

      <h1 className="text-2xl font-extrabold text-coffee-950 mb-2">Konfirmasi & Checkout Pesanan</h1>
      <p className="text-xs text-coffee-700 mb-6">
        Periksa kembali nomor meja, nama pemesan, dan metode pembayaran sebelum membuat pesanan.
      </p>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="space-y-6">
        {/* 1. Table Number Banner */}
        <div className="p-4 rounded-2xl bg-white border border-coffee-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 text-coffee-800 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5 text-coffee-700" />
            </div>
            <div>
              <span className="text-[10px] text-coffee-600 uppercase font-semibold block">
                Lokasi Meja Pengantaran
              </span>
              <span className="font-extrabold text-base text-coffee-950">
                {tableNumber || 'Belum Ditetapkan'}
              </span>
            </div>
          </div>
          <Link
            href="/table-select"
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-coffee-300 text-coffee-800 hover:bg-coffee-50"
          >
            Ubah Meja
          </Link>
        </div>

        {/* 2. Customer Identity Form */}
        <div className="p-5 rounded-2xl bg-white border border-coffee-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-coffee-100 pb-3">
            <h3 className="font-bold text-sm text-coffee-950 flex items-center gap-2">
              <User className="w-4 h-4 text-coffee-700" />
              <span>Data Pemesan</span>
            </h3>
            {loggedInUser ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Akun Terdaftar ({loggedInUser.name.split(' ')[0]})
              </span>
            ) : (
              <Link href="/login" className="text-[11px] font-bold text-coffee-600 hover:underline">
                Punya akun? Login di sini
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-coffee-900 block mb-1">
                Nama Pemesan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Prasetyo"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-cream/40 text-coffee-950 focus:outline-none focus:border-coffee-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-coffee-900 block mb-1">
                No. WhatsApp / HP (Opsional)
              </label>
              <input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-cream/40 text-coffee-950 focus:outline-none focus:border-coffee-600"
              />
            </div>
          </div>
        </div>

        {/* 3. Payment Method Selection */}
        <div className="p-5 rounded-2xl bg-white border border-coffee-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-coffee-950 border-b border-coffee-100 pb-3">
            Pilih Metode Pembayaran
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                paymentMethod === 'CASH'
                  ? 'border-coffee-700 bg-coffee-50/80 ring-2 ring-coffee-600/30'
                  : 'border-coffee-200 bg-white hover:bg-coffee-50/40'
              }`}
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-coffee-950 block">Bayar di Kasir</span>
                  <span className="text-[11px] text-coffee-700 leading-tight block mt-0.5">
                    Bayar tunai/debit di konter kasir saat pesanan dikonfirmasi.
                  </span>
                </div>
              </div>
              {paymentMethod === 'CASH' && (
                <CheckCircle className="w-4 h-4 text-coffee-700 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('QRIS')}
              className={`p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                paymentMethod === 'QRIS'
                  ? 'border-coffee-700 bg-coffee-50/80 ring-2 ring-coffee-600/30'
                  : 'border-coffee-200 bg-white hover:bg-coffee-50/40'
              }`}
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-coffee-950 block">QRIS Instant</span>
                  <span className="text-[11px] text-coffee-700 leading-tight block mt-0.5">
                    Scan QRIS via GoPay, OVO, Dana, BCA Mobile, dll.
                  </span>
                </div>
              </div>
              {paymentMethod === 'QRIS' && (
                <CheckCircle className="w-4 h-4 text-coffee-700 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* 4. Notes for Kitchen/Cashier */}
        <div className="p-5 rounded-2xl bg-white border border-coffee-200/80 shadow-xs">
          <label className="text-xs font-bold text-coffee-950 block mb-1">
            Catatan Tambahan Keseluruhan Pesanan
          </label>
          <textarea
            rows={2}
            placeholder="Contoh: Tolong antarkan jika esnya mulai mencair ya mas..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-cream/40 text-coffee-950 focus:outline-none focus:border-coffee-600"
          />
        </div>

        {/* 5. Checkout Final Summary Card */}
        <div className="p-5 rounded-2xl bg-coffee-950 text-amber-100 shadow-xl space-y-3">
          <div className="flex justify-between text-xs text-amber-200/80">
            <span>Subtotal Pesanan</span>
            <span className="font-semibold text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400 font-semibold">
              <span>Diskon Voucher ('{appliedVoucher?.code}')</span>
              <span>-Rp {discount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="border-t border-coffee-800 pt-3 flex justify-between items-center text-white font-extrabold text-base">
            <span>Total yang Harus Dibayar</span>
            <span className="text-amber-300 text-lg">Rp {finalTotal.toLocaleString('id-ID')}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 disabled:opacity-50 transition-all mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses Pesanan...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-coffee-950" />
                <span>Kirim Pesanan ke Kasir</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
