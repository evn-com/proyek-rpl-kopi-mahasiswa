'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Coffee,
  DollarSign,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  Check,
  Ban,
  Receipt,
  Layers,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { OrderDetail } from '@/types';

export default function CashierPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'WAITING' | 'ACCEPTED' | 'READY' | 'COMPLETED' | 'CANCELLED'>('WAITING');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cancellation Modal
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderDetail | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Modify Order Modal
  const [editModalOrder, setEditModalOrder] = useState<OrderDetail | null>(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Order Detail View Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

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
      console.error('Error fetching cashier orders:', err);
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
        if (['ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED', 'PAYMENT_UPDATED'].includes(msg.type)) {
          fetchOrders();
        }
      } catch (err) {
        console.error('Error processing SSE:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Confirm order (WAITING -> ACCEPTED)
  const handleConfirmOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED', notes: 'Pesanan dikonfirmasi oleh Kasir (masuk antrean Barista).' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Pesanan berhasil dikonfirmasi dan dikirim ke Barista.`);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Verify Cashier Payment
  const handleVerifyPayment = async (orderId: string) => {
    try {
      const res = await fetch('/api/payments/verify-cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Pembayaran berhasil ditandai LUNAS (PAID).');
      fetchOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Cancel order with mandatory reason
  const handleExecuteCancelOrder = async () => {
    if (!cancelModalOrder || !cancelReason.trim()) {
      showToast('Alasan pembatalan wajib diisi.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${cancelModalOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Pesanan telah dibatalkan.');
      setCancelModalOrder(null);
      setCancelReason('');
      fetchOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Modify Order Save
  const handleSaveModifyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOrder) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/orders/${editModalOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: editTableNumber,
          customerName: editCustomerName,
          notes: editNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Pesanan berhasil diperbarui.');
      setEditModalOrder(null);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Filter orders by active tab and search query
  const filteredOrders = orders.filter((o) => {
    const matchesTab =
      activeTab === 'WAITING'
        ? o.status === 'WAITING' || o.status === 'PENDING_CASHIER'
        : activeTab === 'ACCEPTED'
        ? o.status === 'ACCEPTED' || o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'PREPARING'
        : o.status === activeTab;

    const matchesSearch =
      searchQuery === '' ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const waitingCount = orders.filter((o) => o.status === 'WAITING' || o.status === 'PENDING_CASHIER').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header title="Kasir POS System" showCart={false} />

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

      {/* Cashier Controls & Tabs */}
      <div className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-16 z-30 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
            {[
              { id: 'WAITING', label: 'Order Baru (WAITING)', badge: waitingCount },
              { id: 'ACCEPTED', label: 'Proses Dapur (ACCEPTED)' },
              { id: 'READY', label: 'Siap Disajikan (READY)' },
              { id: 'COMPLETED', label: 'Selesai (COMPLETED)' },
              { id: 'CANCELLED', label: 'Dibatalkan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-rose-500 text-white rounded-full font-black animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari Meja / Order / Nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Order Queue */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Cashier Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Order Baru</span>
            <div className="text-xl font-black text-white mt-0.5">
              {orders.filter((o) => o.status === 'WAITING' || o.status === 'PENDING_CASHIER').length}
            </div>
            <span className="text-[10px] text-slate-400">Menunggu aksi kasir</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Belum Lunas</span>
            <div className="text-xl font-black text-rose-400 mt-0.5">
              {orders.filter((o) => o.paymentStatus === 'UNPAID').length}
            </div>
            <span className="text-[10px] text-slate-400">Pending Kasir/QRIS</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">Sedang Diracik</span>
            <div className="text-xl font-black text-sky-400 mt-0.5">
              {orders.filter((o) => ['ACCEPTED', 'CONFIRMED', 'PROCESSING', 'PREPARING'].includes(o.status)).length}
            </div>
            <span className="text-[10px] text-slate-400">Di dapur barista</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Siap Diambil</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {orders.filter((o) => o.status === 'READY').length}
            </div>
            <span className="text-[10px] text-slate-400">Konter pengantaran</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Transaksi Sukses</span>
            <div className="text-xl font-black text-white mt-0.5">
              {orders.filter((o) => o.paymentStatus === 'PAID').length}
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Lunas (PAID)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-coffee-900 to-coffee-950 border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Omzet Kasir</span>
            <div className="text-lg sm:text-xl font-black text-amber-400 mt-0.5 truncate">
              Rp {orders.filter((o) => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.finalAmount, 0).toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-amber-200/70">Total kasir hari ini</span>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 my-8 space-y-3">
            <Coffee className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">Tidak ada pesanan di kategori ini</h3>
            <p className="text-xs text-slate-500">Pesanan baru yang masuk akan otomatis tampil secara real-time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4 hover:border-slate-700 transition"
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                        {order.tableNumber}
                      </span>
                      <h3 className="font-extrabold text-white text-base mt-0.5">{order.orderNumber}</h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        order.status === 'WAITING' || order.status === 'PENDING_CASHIER'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                          : order.status === 'ACCEPTED'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : order.status === 'READY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : order.status === 'COMPLETED'
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pemesan:</span>
                      <span className="font-bold text-white">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pembayaran:</span>
                      <span className="font-bold text-white">
                        {order.paymentMethod} (
                        <span
                          className={
                            order.paymentStatus === 'PAID'
                              ? 'text-emerald-400 font-bold'
                              : 'text-amber-400 font-bold'
                          }
                        >
                          {order.paymentStatus}
                        </span>
                        )
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Waktu:</span>
                      <span>{new Date(order.createdAt).toLocaleTimeString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 max-h-44 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-xs border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between font-bold text-white">
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {item.variantName && (
                          <div className="text-[11px] text-amber-400 font-medium">Varian: {item.variantName}</div>
                        )}
                        {item.toppings && item.toppings.length > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Topping: {item.toppings.map((t) => t.toppingName).join(', ')}
                          </div>
                        )}
                        {item.notes && <div className="text-[10px] text-slate-400 italic">{item.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer total & actions */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-bold">Total Pembayaran:</span>
                    <span className="font-black text-amber-400 text-lg">
                      Rp {order.finalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Confirm button for WAITING orders */}
                    {(order.status === 'WAITING' || order.status === 'PENDING_CASHIER') && (
                      <button
                        onClick={() => handleConfirmOrder(order.id)}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg transition"
                      >
                        <Check className="w-4 h-4" /> Konfirmasi Order
                      </button>
                    )}

                    {/* Verify payment button if unpaid */}
                    {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleVerifyPayment(order.id)}
                        className="py-2 px-3 bg-emerald-950 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 transition"
                        title="Tandai Lunas"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Lunas
                      </button>
                    )}

                    {/* Detail button */}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Modify Order button */}
                    {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setEditModalOrder(order);
                          setEditTableNumber(order.tableNumber);
                          setEditCustomerName(order.customerName);
                          setEditNotes(order.notes || '');
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition"
                        title="Ubah Pesanan (Modify Order)"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Cancel button */}
                    {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setCancelModalOrder(order);
                          setCancelReason('');
                        }}
                        className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl transition"
                        title="Batalkan Order"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CANCELLATION REASON MODAL */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-rose-400">Pembatalan Pesanan {cancelModalOrder.orderNumber}</h3>
              <button onClick={() => setCancelModalOrder(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Masukkan alasan wajib pembatalan pesanan untuk dicatat di Audit Log dan histori status:
              </p>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-rose-500 focus:outline-none"
                placeholder="e.g. Bahan baku habis / Permintaan pelanggan / Meja batal"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteCancelOrder}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30"
              >
                Batalkan Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODIFY ORDER MODAL */}
      {editModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Ubah Data Pesanan</h3>
                  <span className="text-xs text-slate-400">{editModalOrder.orderNumber}</span>
                </div>
              </div>
              <button
                onClick={() => setEditModalOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModifyOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor Meja
                </label>
                <input
                  type="text"
                  required
                  value={editTableNumber}
                  onChange={(e) => setEditTableNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Meja 05"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Nama customer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Tambahan Pesanan
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Catatan khusus dari kasir / pelanggan"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOrder(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase">{selectedOrder.tableNumber}</span>
                <h3 className="text-lg font-bold text-white">{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Pelanggan:</span>
                  <span className="font-bold text-white">{selectedOrder.customerName}</span>
                </div>
                {selectedOrder.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telepon:</span>
                    <span className="text-slate-200">{selectedOrder.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Metode Bayar:</span>
                  <span className="font-bold text-amber-400">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Pembayaran:</span>
                  <span className="font-bold text-emerald-400">{selectedOrder.paymentStatus}</span>
                </div>
                {selectedOrder.cancellationReason && (
                  <div className="flex justify-between text-rose-400 font-bold pt-2 border-t border-slate-800">
                    <span>Alasan Pembatalan:</span>
                    <span>{selectedOrder.cancellationReason}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">Histori Perubahan Status Order</h4>
                <div className="space-y-2">
                  {selectedOrder.history?.map((h, i) => (
                    <div key={i} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5" />
                      <div>
                        <div className="font-bold text-white">
                          Status: {h.status} <span className="text-[10px] text-slate-500 font-normal">({new Date(h.createdAt).toLocaleTimeString('id-ID')})</span>
                        </div>
                        {h.notes && <div className="text-slate-400 text-[11px]">{h.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
