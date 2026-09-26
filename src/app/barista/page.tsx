'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  Coffee,
  CheckCircle2,
  Clock,
  Play,
  Check,
  RefreshCw,
  Search,
  Sparkles,
  AlertTriangle,
  Flame,
  Timer,
  CheckCheck,
} from 'lucide-react';
import { OrderDetail } from '@/types';

export default function BaristaPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'KITCHEN' | 'READY' | 'HISTORY'>('KITCHEN');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick clock every 10 seconds for relative prep timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching barista orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Listen to real-time SSE updates
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (['ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED', 'NOTIFICATION'].includes(msg.type)) {
          fetchOrders();
        }
      } catch (err) {
        console.error('Error processing SSE in Barista:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: 'PROCESSING' | 'READY' | 'COMPLETED') => {
    try {
      const notes =
        nextStatus === 'PROCESSING'
          ? 'Barista mulai meracik pesanan.'
          : nextStatus === 'READY'
          ? 'Barista telah meracik pesanan (Pesanan Siap Disajikan / READY).'
          : 'Pesanan telah selesai diserahkan ke pelanggan.';

      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Status pesanan diperbarui menjadi ${nextStatus}`);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const incomingOrders = orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'CONFIRMED');
  const processingOrders = orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');
  const kitchenOrders = [...incomingOrders, ...processingOrders];
  const historyOrders = orders.filter((o) => o.status === 'COMPLETED');

  // Calculate Average Preparation Time
  const completedWithHistory = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'READY');
  let totalPrepMinutes = 0;
  let prepCount = 0;

  completedWithHistory.forEach((o) => {
    const acceptedHist = o.history?.find((h) => h.status === 'ACCEPTED' || h.status === 'CONFIRMED');
    const readyHist = o.history?.find((h) => h.status === 'READY' || h.status === 'COMPLETED');
    if (acceptedHist && readyHist) {
      const diffMs = new Date(readyHist.createdAt).getTime() - new Date(acceptedHist.createdAt).getTime();
      const mins = Math.max(1, Math.round(diffMs / 60000));
      if (mins < 60) {
        totalPrepMinutes += mins;
        prepCount++;
      }
    }
  });

  const avgPrepTime = prepCount > 0 ? (totalPrepMinutes / prepCount).toFixed(1) : '4.5';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      <Header title="Barista Kitchen Display System (KDS)" showCart={false} />

      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span className="font-medium text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Barista Controls Header */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-16 z-30 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('KITCHEN')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'KITCHEN'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Antrean Dapur ({kitchenOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('READY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'READY'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Siap Diambil ({readyOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'HISTORY'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Riwayat Selesai ({historyOrders.length})</span>
            </button>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Refresh KDS"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">Antrean Masuk</span>
            <div className="text-2xl font-black text-white mt-1">{incomingOrders.length}</div>
            <span className="text-[10px] text-slate-400">Menunggu barista</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Sedang Diracik</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{processingOrders.length}</div>
            <span className="text-[10px] text-slate-400">Di meja bar</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Siap Disajikan</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{readyOrders.length}</div>
            <span className="text-[10px] text-slate-400">Tersaji di pick-up bar</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-coffee-900 to-coffee-950 border border-amber-500/40">
            <span className="text-[10px] uppercase font-bold text-amber-300 block flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> Rata-rata Racik
            </span>
            <div className="text-2xl font-black text-white mt-1">
              ~{avgPrepTime} <span className="text-xs font-semibold text-amber-300">Menit</span>
            </div>
            <span className="text-[10px] text-amber-200/70">Average Preparation Time</span>
          </div>
        </div>

        {/* Tab 1: Kitchen Orders Queue */}
        {activeTab === 'KITCHEN' && (
          <div>
            {kitchenOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 my-8 space-y-3">
                <Coffee className="w-12 h-12 text-amber-500/50 mx-auto animate-pulse" />
                <h3 className="text-lg font-bold text-white">Antrean Dapur Kosong</h3>
                <p className="text-xs text-slate-500">Semua pesanan sudah diracik. Siap menerima pesanan baru.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kitchenOrders.map((order) => {
                  const isProcessing = order.status === 'PROCESSING' || order.status === 'PREPARING';
                  const elapsedMinutes = Math.floor((now - new Date(order.createdAt).getTime()) / 60000);

                  const isUrgent = elapsedMinutes > 10;
                  const isWarning = elapsedMinutes >= 5 && elapsedMinutes <= 10;

                  return (
                    <div
                      key={order.id}
                      className={`bg-slate-900/80 border rounded-3xl p-5 flex flex-col justify-between shadow-2xl space-y-4 transition ${
                        isUrgent
                          ? 'border-rose-500/80 shadow-rose-500/10 ring-2 ring-rose-500/30'
                          : isProcessing
                          ? 'border-amber-500/80 shadow-amber-500/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                              {order.tableNumber}
                            </span>
                            <h3 className="font-extrabold text-white text-base mt-0.5">{order.orderNumber}</h3>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                                isProcessing
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-pulse'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                              }`}
                            >
                              {isProcessing ? 'SEDANG DIRACIK' : 'ANTREAN MASUK'}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-extrabold flex items-center gap-1 ${
                                isUrgent
                                  ? 'text-rose-400 animate-pulse'
                                  : isWarning
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              <Timer className="w-3 h-3" /> {elapsedMinutes}m yang lalu
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Pemesan: <strong className="text-white">{order.customerName}</strong></span>
                          <span>Jam: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Items to prepare */}
                        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="border-b border-slate-800/80 pb-2.5 last:border-0 last:pb-0 space-y-1">
                              <div className="flex items-start justify-between">
                                <span className="font-black text-white text-sm">
                                  {item.quantity}x {item.productName}
                                </span>
                              </div>

                              {item.variantName && (
                                <div className="text-xs text-amber-400 font-bold">
                                  Varian: {item.variantName}
                                </div>
                              )}

                              {item.toppings && item.toppings.length > 0 && (
                                <div className="text-xs text-indigo-300">
                                  Topping: {item.toppings.map((t) => t.toppingName).join(', ')}
                                </div>
                              )}

                              {item.notes && (
                                <div className="text-xs text-slate-300 italic bg-slate-900 p-2 rounded-xl border border-slate-800 mt-1">
                                  📝 {item.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Barista Status Button */}
                      <div className="pt-3 border-t border-slate-800">
                        {!isProcessing ? (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
                          >
                            <Play className="w-4 h-4 fill-slate-950" /> Mulai Racik (PROCESSING)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'READY')}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                          >
                            <Check className="w-4 h-4" /> Selesai Meracik (READY)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Ready Orders (Tersaji di pick-up) */}
        {activeTab === 'READY' && (
          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
                <Check className="w-12 h-12 text-emerald-500/40 mx-auto" />
                <h3 className="text-base font-bold text-white">Tidak ada pesanan menunggu diambil</h3>
                <p className="text-xs text-slate-500">Semua racikan telah diserahkan ke pelanggan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-black text-amber-400">{order.tableNumber}</span>
                        <h4 className="text-sm font-bold text-white">{order.orderNumber}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold border border-emerald-500/40">
                        READY
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-400">Pemesan: <strong className="text-white">{order.customerName}</strong></p>
                      <div className="text-slate-300">
                        {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <CheckCheck className="w-4 h-4" /> Serahkan ke Pelanggan (COMPLETED)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Riwayat Racikan Selesai (COMPLETED)</h2>
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Meja / No. Order</th>
                    <th className="px-6 py-4">Pemesan</th>
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Waktu Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {historyOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-bold text-amber-400">{o.tableNumber}</div>
                        <div className="text-xs text-slate-400 font-mono">{o.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{o.customerName}</td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(o.createdAt).toLocaleTimeString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
