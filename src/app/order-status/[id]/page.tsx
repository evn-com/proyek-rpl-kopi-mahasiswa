'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Coffee, Sparkles, MapPin, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { OrderDetail, OrderStatus } from '@/types';

export default function OrderStatusPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderStatus = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        setError(null);
      } else {
        setError(data.error || 'Gagal memuat status pesanan.');
      }
    } catch (err) {
      setError('Kesalahan koneksi saat mengambil status.');
    } finally {
      setLoading(false);
    }
  };

  // Poll every 5 seconds for live status updates
  useEffect(() => {
    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-8 h-8 text-coffee-600 animate-spin mx-auto mb-3" />
        <p className="text-xs text-coffee-800 font-bold">Memuat status pesanan...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-coffee-950">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-coffee-700 mt-1 mb-6">{error}</p>
        <Link href="/menu" className="px-4 py-2 rounded-xl bg-coffee-900 text-amber-100 text-xs font-bold">
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  // Calculate current status step (1..4)
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_CASHIER': return 1;
      case 'CONFIRMED': return 2;
      case 'PREPARING': return 2;
      case 'READY': return 3;
      case 'COMPLETED': return 4;
      case 'CANCELLED': return 0;
      default: return 1;
    }
  };

  const currentStep = getStepIndex(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-coffee-800 hover:text-coffee-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Ke Menu Utama
        </Link>

        <button
          onClick={fetchOrderStatus}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-coffee-700 bg-white px-2.5 py-1 rounded-lg border border-coffee-200 hover:bg-coffee-50"
        >
          <RefreshCw className="w-3 h-3" /> Update Status
        </button>
      </div>

      {/* Main Card Header */}
      <div className="rounded-3xl bg-gradient-to-br from-coffee-950 via-coffee-900 to-coffee-800 text-white p-6 sm:p-8 shadow-xl border border-coffee-700 mb-6">
        <div className="flex items-center justify-between border-b border-coffee-800 pb-4 mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
              Nomor Pesanan
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {order.orderNumber}
            </h1>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <MapPin className="w-3.5 h-3.5" /> {order.tableNumber}
            </span>
          </div>
        </div>

        {/* Real-Time Progress Bar */}
        {order.status === 'CANCELLED' ? (
          <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-bold text-center">
            ❌ Pesanan telah dibatalkan. Silakan hubungi kasir jika ada pertanyaan.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-coffee-800 z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-400 z-0 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {[
                { step: 1, label: 'Menunggu Kasir' },
                { step: 2, label: 'Racik Barista' },
                { step: 3, label: 'Siap Disajikan' },
                { step: 4, label: 'Selesai' },
              ].map((st) => {
                const isActive = currentStep >= st.step;
                const isCurrent = currentStep === st.step;

                return (
                  <div key={st.step} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isActive
                          ? 'bg-amber-400 text-coffee-950 shadow-md ring-4 ring-coffee-900'
                          : 'bg-coffee-800 text-coffee-400 border border-coffee-700'
                      } ${isCurrent ? 'animate-bounce' : ''}`}
                    >
                      {isActive ? <CheckCircle2 className="w-4 h-4" /> : st.step}
                    </div>
                    <span className={`text-[10px] font-semibold mt-2 ${isActive ? 'text-amber-200' : 'text-coffee-400'}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Current Status Message Box */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-amber-100 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold block text-sm text-white">
                  {order.status === 'PENDING_CASHIER' && 'Menunggu Konfirmasi Pembayaran Kasir'}
                  {order.status === 'CONFIRMED' && 'Pesanan Dikonfirmasi Kasir! Memasuki Antrean Barista'}
                  {order.status === 'PREPARING' && 'Barista Sedang Meracik Kopi Pesananmu ☕'}
                  {order.status === 'READY' && '🎉 Pesanan Siap! Silakan Ambil atau Ditunggu di Meja'}
                  {order.status === 'COMPLETED' && 'Pesanan Selesai. Selamat Menikmati!'}
                </span>
                <span className="text-[11px] text-amber-200/80">
                  Status diperbarui secara otomatis secara real-time.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Itemized Order Details */}
      <div className="p-5 rounded-3xl bg-white border border-coffee-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-coffee-950 border-b border-coffee-100 pb-2">
          Rincian Pesanan
        </h3>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs border-b border-coffee-50 pb-2">
              <div>
                <span className="font-bold text-coffee-950">{item.productName}</span>
                <span className="text-coffee-600 font-semibold ml-1.5">x{item.quantity}</span>
                {item.variantName && (
                  <p className="text-[11px] text-coffee-700">Varian: {item.variantName}</p>
                )}
                {item.toppings && item.toppings.length > 0 && (
                  <p className="text-[11px] text-amber-800">
                    Topping: {item.toppings.map((t) => t.toppingName).join(', ')}
                  </p>
                )}
                {item.notes && <p className="text-[11px] italic text-gray-500">{item.notes}</p>}
              </div>

              <span className="font-bold text-coffee-950">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Totals */}
        <div className="pt-2 space-y-1.5 text-xs text-coffee-800 border-t border-coffee-100">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Diskon Promo</span>
              <span>-Rp {order.discountAmount.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="flex justify-between items-center font-extrabold text-sm text-coffee-950 pt-2 border-t border-coffee-100">
            <span>Total Akhir ({order.paymentMethod})</span>
            <span className="text-coffee-900">Rp {order.finalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
