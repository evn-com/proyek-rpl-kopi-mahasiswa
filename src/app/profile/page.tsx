'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShoppingBag,
  Heart,
  Ticket,
  Star,
  Clock,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Lock,
  Phone,
  Mail,
  Calendar,
  Award,
  ChevronRight,
  MessageSquare,
  X,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { addToCart, setTableNumber } = useOrderStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'favorites' | 'vouchers'>('orders');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Review Modal State
  const [reviewModalOrder, setReviewModalOrder] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchProfileData = async () => {
    try {
      const res = await fetch('/api/customer/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setEditName(data.user.name);
        setEditPhone(data.user.phone || '');
      } else if (res.status === 401) {
        router.push('/login?redirect=/profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/customer/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/customer/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfileData(), fetchOrders(), fetchFavorites()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Re-Order logic
  const handleReOrder = (order: any) => {
    if (!order.items || order.items.length === 0) return;

    if (order.tableNumber) {
      setTableNumber(order.tableNumber);
    }

    order.items.forEach((item: any) => {
      addToCart({
        product: {
          id: item.productId,
          categoryId: '',
          name: item.productName,
          slug: '',
          description: '',
          basePrice: item.unitPrice,
          image: item.product?.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
          isBestSeller: false,
          isAvailable: true,
          variants: [],
        },
        selectedVariant: item.variantName ? { name: item.variantName, priceAdjustment: 0 } : null,
        selectedToppings: item.toppings?.map((t: any) => ({
          id: t.toppingId || t.id,
          name: t.toppingName,
          price: t.price,
        })) || [],
        notes: item.notes || '',
        quantity: item.quantity,
      });
    });

    showToast('Menu pesanan sebelumnya berhasil dimasukkan ke keranjang!');
    router.push('/cart');
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: reviewModalOrder.id,
          productId: reviewModalOrder.items[0]?.productId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim ulasan');

      showToast('Ulasan dan rating Anda berhasil disimpan! +10 Poin');
      setReviewModalOrder(null);
      setReviewComment('');
      fetchOrders();
      fetchProfileData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui profil');

      showToast('Profil berhasil diperbarui!');
      setIsEditingProfile(false);
      setCurrentPassword('');
      setNewPassword('');
      fetchProfileData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream/40 flex flex-col font-sans pb-16">

      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-extrabold flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        {/* User Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-coffee-950 via-coffee-900 to-coffee-800 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-coffee-950 flex items-center justify-center font-extrabold text-2xl shadow-lg">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                  Member Kopi Mahasiswa
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white">{profile?.name || 'Pelanggan'}</h1>
                <p className="text-xs text-amber-100/70 mt-0.5">{profile?.email}</p>
              </div>
            </div>

            {/* Loyalty Points Card */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-right w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-end gap-2 text-amber-300 text-xs font-bold">
                <Award className="w-4 h-4" />
                <span>Poin Loyalitas</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {profile?.points || 0} <span className="text-xs font-semibold text-amber-300">Pts</span>
              </div>
              <p className="text-[10px] text-amber-100/70 mt-1">Dapatkan diskon untuk setiap order!</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar border-b border-coffee-200/60">
          {[
            { id: 'orders', label: 'Riwayat Pesanan', icon: Clock, badge: orders.length },
            { id: 'favorites', label: 'Produk Favorit', icon: Heart, badge: favorites.length },
            { id: 'vouchers', label: 'Voucher & Kupon', icon: Ticket },
            { id: 'profile', label: 'Pengaturan Akun', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                  isActive
                    ? 'bg-coffee-900 text-amber-200 shadow-md'
                    : 'bg-white text-coffee-800 hover:bg-coffee-100/80 border border-coffee-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-amber-400 text-coffee-950' : 'bg-coffee-100 text-coffee-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-coffee-200/80">
                <ShoppingBag className="w-12 h-12 text-coffee-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-coffee-950">Belum Ada Riwayat Pesanan</h3>
                <p className="text-xs text-coffee-600 mt-1 mb-4">
                  Pesanan yang Anda buat di kedai akan tercatat di sini.
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coffee-900 text-amber-200 text-xs font-bold hover:bg-coffee-800"
                >
                  Pesan Kopi Sekarang
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const hasReviewed = order.reviews && order.reviews.length > 0;
                const isCompleted = order.status === 'COMPLETED';

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl bg-white border border-coffee-200/80 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-coffee-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-coffee-950">{order.orderNumber}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-coffee-100 text-coffee-800 text-[11px] font-bold">
                            {order.tableNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-coffee-500">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'READY'
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-coffee-100 text-coffee-800'
                          }`}
                        >
                          {order.status === 'COMPLETED'
                            ? 'Selesai'
                            : order.status === 'READY'
                            ? 'Siap Diambil'
                            : order.status === 'PROCESSING'
                            ? 'Diracik'
                            : order.status === 'ACCEPTED'
                            ? 'Dikonfirmasi'
                            : order.status === 'CANCELLED'
                            ? 'Dibatalkan'
                            : 'Menunggu'}
                        </span>

                        <Link
                          href={`/order-status?id=${order.id}`}
                          className="text-xs font-bold text-coffee-700 hover:text-coffee-950 flex items-center gap-1 border border-coffee-200 px-3 py-1 rounded-xl"
                        >
                          Lacak Live <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 text-xs">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-coffee-900">
                          <div>
                            <span className="font-bold">{item.quantity}x</span> {item.productName}
                            {item.variantName && (
                              <span className="text-coffee-500 ml-1">({item.variantName})</span>
                            )}
                          </div>
                          <span className="font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Total & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-coffee-100">
                      <div>
                        <span className="text-[11px] text-coffee-600 block">Total Akhir:</span>
                        <span className="font-black text-sm text-coffee-950">
                          Rp {order.finalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Re-order Button */}
                        <button
                          onClick={() => handleReOrder(order)}
                          className="px-3.5 py-2 rounded-xl bg-coffee-100 hover:bg-coffee-200 text-coffee-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pesan Lagi (Re-order)</span>
                        </button>

                        {/* Review Button - ONLY for COMPLETED orders */}
                        {isCompleted && !hasReviewed && (
                          <button
                            onClick={() => {
                              setReviewModalOrder(order);
                              setReviewRating(5);
                              setReviewComment('');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-coffee-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Star className="w-3.5 h-3.5 fill-coffee-950" />
                            <span>Beri Ulasan & Rating</span>
                          </button>
                        )}

                        {hasReviewed && (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                            <span>Sudah Diulas ({order.reviews[0].rating}★)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB CONTENT: FAVORITES */}
        {activeTab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-coffee-200/80">
                <Heart className="w-12 h-12 text-coffee-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-coffee-950">Belum Ada Produk Favorit</h3>
                <p className="text-xs text-coffee-600 mt-1 mb-4">
                  Klik ikon hati pada produk di menu untuk menyimpannya ke daftar ini.
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coffee-900 text-amber-200 text-xs font-bold hover:bg-coffee-800"
                >
                  Jelajahi Menu
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="p-4 rounded-3xl bg-white border border-coffee-200/80 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-coffee-100">
                        <img
                          src={fav.product.image}
                          alt={fav.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-extrabold text-sm text-coffee-950">{fav.product.name}</h4>
                      <p className="text-xs text-coffee-600 line-clamp-2 mt-1">{fav.product.description}</p>
                    </div>

                    <div className="pt-3 border-t border-coffee-100 mt-3 flex items-center justify-between">
                      <span className="font-black text-sm text-coffee-950">
                        Rp {fav.product.basePrice.toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => {
                          addToCart({
                            product: fav.product,
                            selectedVariant: null,
                            selectedToppings: [],
                            quantity: 1,
                          });
                          showToast(`${fav.product.name} ditambahkan ke keranjang!`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-coffee-900 text-amber-200 text-xs font-bold hover:bg-coffee-800"
                      >
                        + Keranjang
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: VOUCHERS */}
        {activeTab === 'vouchers' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              💡 Masukkan kode voucher berikut di halaman keranjang/checkout saat memesan.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  code: 'MAHASISWAHEMAT',
                  title: 'Potongan Rp 5.000',
                  desc: 'Hemat Rp 5.000 untuk minimal belanja Rp 20.000',
                  exp: '31 Des 2027',
                },
                {
                  code: 'DISKON10K',
                  title: 'Potongan Rp 10.000',
                  desc: 'Potongan Rp 10.000 untuk minimal belanja Rp 35.000',
                  exp: '31 Des 2027',
                },
                {
                  code: 'KOPIPERTAMA',
                  title: 'Diskon Sambutan Rp 7.000',
                  desc: 'Voucher spesial pelanggan baru untuk minimal transaksi Rp 25.000',
                  exp: '31 Des 2027',
                },
              ].map((v) => (
                <div
                  key={v.code}
                  className="p-5 rounded-3xl bg-white border border-coffee-200/80 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[11px] mb-1">
                      <Ticket className="w-3 h-3" /> {v.code}
                    </div>
                    <h4 className="font-extrabold text-sm text-coffee-950">{v.title}</h4>
                    <p className="text-xs text-coffee-600 mt-0.5">{v.desc}</p>
                    <span className="text-[10px] text-coffee-400 block mt-1">Berlaku s/d {v.exp}</span>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(v.code);
                      showToast(`Kode '${v.code}' disalin!`);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-coffee-300 text-xs font-bold text-coffee-800 hover:bg-coffee-100"
                  >
                    Salin
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-coffee-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-coffee-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-coffee-950">Informasi Pribadi</h3>
                <p className="text-xs text-coffee-600">Perbarui nama, nomor telepon, atau kata sandi Anda.</p>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-3 py-1.5 rounded-xl border border-coffee-300 text-xs font-bold text-coffee-800 hover:bg-coffee-50 flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? 'Batal' : 'Edit Profil'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-coffee-900 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-cream/40 text-coffee-950 focus:outline-none focus:border-coffee-700 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-coffee-900 block mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-coffee-900 block mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  disabled={!isEditingProfile}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-cream/40 text-coffee-950 focus:outline-none focus:border-coffee-700 disabled:opacity-60"
                />
              </div>

              {isEditingProfile && (
                <div className="pt-4 border-t border-coffee-100 space-y-4">
                  <h4 className="font-bold text-xs text-coffee-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Ganti Kata Sandi (Opsional)
                  </h4>

                  <div>
                    <label className="text-xs text-coffee-700 block mb-1">Password Saat Ini</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-cream/40 text-coffee-950 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-coffee-700 block mb-1">Password Baru</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-cream/40 text-coffee-950 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-3 rounded-2xl bg-coffee-900 text-amber-200 font-extrabold text-xs hover:bg-coffee-800 disabled:opacity-50 transition-colors shadow-md"
                  >
                    {isSavingProfile ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </main>

      {/* RATING & REVIEW MODAL */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-coffee-200 space-y-4">
            <div className="flex items-center justify-between border-b border-coffee-100 pb-3">
              <div>
                <h3 className="font-black text-base text-coffee-950">Beri Ulasan & Rating</h3>
                <p className="text-xs text-coffee-600">Pesanan: {reviewModalOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setReviewModalOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-coffee-900 block mb-2 text-center">
                  Berapa bintang untuk rasa & pelayanan kami?
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-2 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs font-extrabold text-amber-700 mt-1">
                  {reviewRating === 5 && 'Luar Biasa! (5/5)'}
                  {reviewRating === 4 && 'Sangat Enak (4/5)'}
                  {reviewRating === 3 && 'Cukup Baik (3/5)'}
                  {reviewRating === 2 && 'Kurang Memuaskan (2/5)'}
                  {reviewRating === 1 && 'Perlu Peningkatan (1/5)'}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-coffee-900 block mb-1">
                  Komentar / Ulasan Anda
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Kopinya pas, creamy, dan croissant-nya garing hangat! Cocok banget buat temen nugas."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-coffee-200 bg-cream/40 text-coffee-950 focus:outline-none focus:border-coffee-700"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950 font-black text-xs sm:text-sm hover:brightness-110 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmittingReview ? 'Mengirim Ulasan...' : 'Kirim Ulasan Sekarang (+10 Poin)'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
