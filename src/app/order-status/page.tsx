'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Coffee,
  CheckCircle2,
  Clock,
  QrCode,
  DollarSign,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ChefHat,
  BellRing,
} from 'lucide-react';
import { OrderDetail } from '@/types';

function OrderTrackerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id') || searchParams.get('orderNumber');

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  const fetchOrderDetail = async () => {
    if (!orderId) {
      setLoading(false);
      setError('Nomor pesanan tidak ditemukan di URL');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error('Pesanan tidak ditemukan');
      }
      const data = await res.json();
      setOrder(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();

    // Setup SSE Realtime updates for customer
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (
          ['ORDER_STATUS_CHANGED', 'PAYMENT_UPDATED', 'ORDER_CANCELLED'].includes(msg.type) &&
          (msg.data?.orderId === orderId || msg.data?.orderNumber === orderId)
        ) {
          fetchOrderDetail();
        }
      } catch (err) {
        console.error('Error processing SSE in customer tracker:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [orderId]);

  // Simulate online payment callback
  const handleSimulateOnlinePayment = async () => {
    if (!order) return;
    setIsSimulatingPayment(true);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, simulateSuccess: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTimeout(() => {
        fetchOrderDetail();
        setIsSimulatingPayment(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message);
      setIsSimulatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="font-bold">Memuat status pesanan...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <main className="flex-1 max-w-lg mx-auto w-full p-6 text-center flex flex-col items-center justify-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <h2 className="text-xl font-bold text-white">Pesanan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400">{error || 'Silakan cek kembali nomor meja atau riwayat pesanan Anda.'}</p>
          <button
            onClick={() => router.push('/menu')}
            className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400"
          >
            Kembali ke Menu
          </button>
        </main>
      </div>
    );
  }

  const steps = [
    { key: 'WAITING', label: 'Menunggu Kasir', desc: 'Order diterima & menunggu konfirmasi kasir' },
    { key: 'ACCEPTED', label: 'Dikonfirmasi', desc: 'Kasir mengonfirmasi, dikirim ke barista' },
    { key: 'PROCESSING', label: 'Meracik', desc: 'Barista sedang meracik pesanan Anda' },
    { key: 'READY', label: 'Siap Disajikan', desc: 'Pesanan siap disajikan / diambil!' },
    { key: 'COMPLETED', label: 'Selesai', desc: 'Pesanan telah selesai dinikmati' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'PENDING_CASHIER') return 0;
    if (status === 'CONFIRMED') return 1;
    if (status === 'PREPARING') return 2;
    return steps.findIndex((s) => s.key === status);
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
        <button
          onClick={() => router.push('/menu')}
          className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Menu Kopi
        </button>

        {/* Order Header Card */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-extrabold text-xs rounded-full border border-amber-500/30">
                {order.tableNumber}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">{order.orderNumber}</h2>
              <p className="text-xs text-slate-400 mt-1">Pemesan: <strong className="text-slate-200">{order.customerName}</strong></p>
            </div>

            <button
              onClick={fetchOrderDetail}
              className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-800 text-slate-300 transition"
              title="Perbarui Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper */}
          {!isCancelled ? (
            <div className="space-y-6 py-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Status Live Pesanan</h3>
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                          isDone
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                            : 'bg-slate-950 border border-slate-800 text-slate-500'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`font-extrabold text-sm ${isCurrent ? 'text-amber-400' : isDone ? 'text-white' : 'text-slate-500'}`}>
                          {step.label}
                          {isCurrent && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold animate-pulse">Sedang Berlangsung</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="font-extrabold text-rose-400 text-base">Pesanan Dibatalkan</h3>
              <p className="text-xs text-slate-300">Alasan: {order.cancellationReason || 'Tidak ada alasan dicantumkan.'}</p>
            </div>
          )}
        </div>

        {/* Online Payment Card (If QRIS/Online and unpaid) */}
        {order.paymentMethod === 'ONLINE_PAYMENT' && order.paymentStatus !== 'PAID' && !isCancelled && (
          <div className="p-6 bg-slate-900/90 border border-amber-500/40 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <QrCode className="w-6 h-6" />
              <h3 className="font-extrabold text-lg">Pembayaran Online (QRIS Demo)</h3>
            </div>
            <p className="text-xs text-slate-300">Silakan selesaikan pembayaran sebesar <strong className="text-amber-400">Rp {order.finalAmount.toLocaleString('id-ID')}</strong></p>

            <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(order.orderNumber)}`}
                alt="QRIS Code"
                className="w-full h-full object-contain"
              />
            </div>

            <button
              onClick={handleSimulateOnlinePayment}
              disabled={isSimulatingPayment}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              {isSimulatingPayment ? 'Memproses Webhook Gateway...' : 'Simulasi Bayar via Webhook (Mock Gateway)'}
            </button>
          </div>
        )}

        {/* Item Summary */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Rincian Item Pesanan</h3>
          <div className="space-y-3 divide-y divide-slate-800/80">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex justify-between items-start text-xs">
                <div>
                  <div className="font-bold text-white text-sm">{item.quantity}x {item.productName}</div>
                  {item.variantName && <div className="text-amber-400">Varian: {item.variantName}</div>}
                  {item.toppings && item.toppings.length > 0 && (
                    <div className="text-slate-400">Topping: {item.toppings.map((t) => t.toppingName).join(', ')}</div>
                  )}
                  {item.notes && <div className="text-slate-400 italic">{item.notes}</div>}
                </div>
                <div className="font-mono font-bold text-white text-sm">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="font-bold text-slate-300 text-sm">Total Tagihan</span>
            <span className="font-black text-amber-400 text-xl">
              Rp {order.finalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderTrackerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8 text-center">Loading tracker...</div>}>
      <OrderTrackerContent />
    </Suspense>
  );
}
