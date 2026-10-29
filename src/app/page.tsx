'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Coffee,
  QrCode,
  Sparkles,
  MapPin,
  ArrowRight,
  Zap,
  Award,
  Star,
  Plus,
  Check,
  Wifi,
  BatteryCharging,
  Clock,
  Heart,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { Product, Topping } from '@/types';
import ProductModal from '@/components/ProductModal';

// Sample curated items if API is loading or offline
const FALLBACK_FAVORITES: Product[] = [
  {
    id: 'fav-1',
    name: 'Kopi Susu Aren Mahasiswa',
    slug: 'kopi-susu-aren-mahasiswa',
    description: 'Double shot espresso 100% Arabika dipadukan susu creamy dan gula aren organik murni.',
    basePrice: 18000,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop&q=80',
    isBestSeller: true,
    isAvailable: true,
    categoryId: 'kopi',
    variants: [],
    averageRating: 4.9,
    reviewCount: 128,
  },
  {
    id: 'fav-2',
    name: 'Espresso Double Shot Booster',
    slug: 'espresso-double-shot-booster',
    description: 'Ekstraksi pekat dan tebal untuk fokus nugas dan begadang deadline tugas akhir.',
    basePrice: 15000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    isBestSeller: true,
    isAvailable: true,
    categoryId: 'kopi',
    variants: [],
    averageRating: 4.8,
    reviewCount: 94,
  },
  {
    id: 'fav-3',
    name: 'Matcha Creamy Latte',
    slug: 'matcha-creamy-latte',
    description: 'Matcha Uji asli Jepang dengan steamed milk gurih dan aroma floral lembut menenangkan.',
    basePrice: 20000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    isBestSeller: false,
    isAvailable: true,
    categoryId: 'non-kopi',
    variants: [],
    averageRating: 4.9,
    reviewCount: 82,
  },
  {
    id: 'fav-4',
    name: 'Butter Croissant Crispy',
    slug: 'butter-croissant-crispy',
    description: 'Pastry renyah berlapis butter Prancis, dipanggang hangat setiap pagi.',
    basePrice: 16000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
    isBestSeller: true,
    isAvailable: true,
    categoryId: 'camilan',
    variants: [],
    averageRating: 4.9,
    reviewCount: 110,
  },
];

export default function LandingPage() {
  const { tableNumber, addToCart } = useOrderStore();
  const [activeTab, setActiveTab] = useState<string>('Semua');
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedItemName, setAddedItemName] = useState<string | null>(null);

  // Fetch real products from database API
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          setProducts(FALLBACK_FAVORITES);
        }
        if (data.toppings && Array.isArray(data.toppings)) {
          setToppings(data.toppings);
        }
      })
      .catch(() => {
        setProducts(FALLBACK_FAVORITES);
      });
  }, []);

  const displayProducts = products.length > 0 ? products : FALLBACK_FAVORITES;

  // Filter products by selected category tab
  const filteredProducts = displayProducts.filter((p) => {
    if (activeTab === 'Semua') return true;
    const catSlug = p.category?.slug?.toLowerCase() || p.categoryId?.toLowerCase() || '';
    const prodName = p.name.toLowerCase();

    if (activeTab === 'Kopi') {
      return catSlug.includes('kopi') || prodName.includes('kopi') || prodName.includes('espresso') || prodName.includes('latte') || prodName.includes('cappuccino') || prodName.includes('americano');
    }
    if (activeTab === 'Non-Kopi') {
      return catSlug.includes('non') || prodName.includes('matcha') || prodName.includes('tea') || prodName.includes('cokelat') || prodName.includes('chocolate') || prodName.includes('soda');
    }
    if (activeTab === 'Camilan') {
      return catSlug.includes('camilan') || catSlug.includes('snack') || catSlug.includes('pastry') || prodName.includes('croissant') || prodName.includes('kentang') || prodName.includes('toast') || prodName.includes('roti');
    }
    if (activeTab === 'Paket Nugas') {
      return p.isBestSeller || catSlug.includes('promo') || prodName.includes('paket') || prodName.includes('nugas');
    }
    return true;
  });

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
      return;
    }
    addToCart({
      product,
      selectedVariant: null,
      selectedToppings: [],
      quantity: 1,
    });
    setAddedItemName(product.name);
    setTimeout(() => setAddedItemName(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16">
      {/* Toast Alert Saat Item Ditambahkan */}
      {addedItemName && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 bg-gradient-to-r from-coffee-950 to-coffee-900 text-amber-200 px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-coffee-950 flex items-center justify-center font-bold">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{addedItemName}</p>
            <p className="text-[10px] text-amber-300/80">Berhasil masuk ke keranjang pesanan!</p>
          </div>
          <Link
            href="/cart"
            className="ml-2 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400 text-coffee-950 hover:bg-amber-300 transition-colors"
          >
            Lihat
          </Link>
        </div>
      )}

      {/* ======================================================== */}
      {/* ⚡ REVISI 2: HERO BANNER (LAYOUT 2-KOLOM LANDSCAPE) */}
      {/* ======================================================== */}
      <section className="relative rounded-3xl bg-gradient-to-br from-coffee-950 via-[#1E120B] to-black text-cream p-6 sm:p-10 lg:p-14 overflow-hidden shadow-2xl border border-coffee-800/80 dark:border-espresso-border">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-coffee-600/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Sisi Kiri (col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 text-xs font-extrabold border border-amber-500/40 shadow-sm backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>⚡ QR ORDER MEJA — BEBAS ANTRE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight">
              Pesan Kopi Favoritmu{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent underline decoration-amber-500/50 decoration-wavy decoration-2">
                Langsung dari Meja.
              </span>
            </h1>

            <p className="text-coffee-200/90 text-sm sm:text-base leading-relaxed max-w-xl">
              Selamat datang di <b>Kopi Mahasiswa</b>. Duduk nyaman di mejamu, pesan racikan espresso 100% Arabika & kopi susu aren kekinian. Bayar praktis, pesanan langsung diantar ke meja tanpa perlu antre di kasir!
            </p>

            {/* Card Status Meja Interaktif */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 dark:bg-black/50 backdrop-blur-md border border-white/15 dark:border-espresso-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-coffee-950 flex items-center justify-center font-bold shadow-md shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      Status Meja Anda
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <span className="font-extrabold text-base sm:text-lg text-white block">
                    {tableNumber ? (tableNumber.toLowerCase().includes('meja') ? tableNumber : `Meja ${tableNumber}`) : 'Meja 04'}
                  </span>
                  <span className="text-[11px] text-coffee-300/80">Terhubung ke Barista & Kasir</span>
                </div>
              </div>

              <Link
                href="/table-select"
                className="self-start sm:self-center px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-amber-200 hover:text-white border border-amber-500/30 text-xs font-bold transition-all"
              >
                {tableNumber ? 'Ubah Nomor Meja' : 'Pilih Meja Lain'}
              </Link>
            </div>

            {/* Tombol Aksi Utama */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <a
                href="#katalog-favorit"
                className="py-4 px-7 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-coffee-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl hover:shadow-amber-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Mulai Pesan Menu</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </a>

              <Link
                href="/register"
                className="py-4 px-6 rounded-2xl bg-coffee-900/90 hover:bg-coffee-800 text-amber-200 border border-amber-500/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>🎓 Gabung Member (Diskon 10%)</span>
              </Link>
            </div>
          </div>

          {/* Sisi Kanan (col-span-5) - Image Showcase & Floating Badges */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 group">
              <Image
                src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80"
                alt="Kopi Mahasiswa Warm Espresso Atmosphere"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-coffee-950/90 via-coffee-950/20 to-transparent" />

              {/* Floating Badge Atas: 80% Match */}
              <div className="absolute top-4 left-4 p-3 rounded-2xl bg-coffee-950/85 backdrop-blur-md border border-amber-500/40 text-cream shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-coffee-950 flex items-center justify-center font-bold">
                  <Star className="w-5 h-5 fill-coffee-950" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-400 block">
                    ⭐ 80% Match Mahasiswa
                  </span>
                  <span className="text-xs font-bold text-white block">Kopi Susu Aren Spesial</span>
                </div>
              </div>

              {/* Floating Badge Bawah: Diskon 10% Mahasiswa */}
              <div className="absolute bottom-4 right-4 left-4 p-3.5 rounded-2xl bg-gradient-to-r from-coffee-950/90 to-coffee-900/90 backdrop-blur-md border border-amber-400/50 text-white shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-amber-300 block">
                      🎓 Diskon 10% Mahasiswa
                    </span>
                    <span className="text-[11px] text-coffee-200">
                      Potongan langsung otomatis setiap pesanan!
                    </span>
                  </div>
                </div>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-coffee-950 font-extrabold text-xs hover:bg-amber-400 shrink-0 transition-colors"
                >
                  Klaim
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* ⚡ 3 FEATURE CARDS (GRID HORIZONTAL MODERN) */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* Card 1 */}
        <div className="group p-6 rounded-3xl bg-white dark:bg-espresso-card border border-coffee-200/70 dark:border-espresso-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-600/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-coffee-950 dark:text-cream mb-2">
            Scan & Order Meja
          </h3>
          <p className="text-xs sm:text-sm text-coffee-700 dark:text-coffee-300 leading-relaxed">
            Pindai QR di mejamu, pilih kopi dan camilan favorit, lalu bayar tanpa perlu beranjak atau antre panjang di kasir.
          </p>
        </div>

        {/* Card 2 */}
        <div className="group p-6 rounded-3xl bg-white dark:bg-espresso-card border border-coffee-200/70 dark:border-espresso-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-coffee-950 dark:text-cream mb-2">
            Harga Hemat Mahasiswa
          </h3>
          <p className="text-xs sm:text-sm text-coffee-700 dark:text-coffee-300 leading-relaxed">
            Biji kopi 100% Arabika racikan standar kafe dengan harga ramah kantong mahasiswa plus diskon 10% member.
          </p>
        </div>

        {/* Card 3 */}
        <div className="group p-6 rounded-3xl bg-white dark:bg-espresso-card border border-coffee-200/70 dark:border-espresso-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-coffee-800/20 to-coffee-950/30 text-coffee-900 dark:text-amber-300 border border-coffee-800/20 dark:border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Coffee className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-coffee-950 dark:text-cream mb-2">
            Status Real-time & WA
          </h3>
          <p className="text-xs sm:text-sm text-coffee-700 dark:text-coffee-300 leading-relaxed">
            Pantau progres racikan pesanan secara live di layar dan dapatkan pesan notifikasi WhatsApp saat kopi siap diambil.
          </p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* ☕ REVISI 3: SECTION KATALOG MENU KOPI & CAMILAN FAVORIT */}
      {/* ======================================================== */}
      <section id="katalog-favorit" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-coffee-200/60 dark:border-espresso-border pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Pilihan Terlaris Hari Ini
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-coffee-950 dark:text-cream">
              Menu Kopi & Camilan Favorit
            </h2>
            <p className="text-xs sm:text-sm text-coffee-700 dark:text-coffee-300 mt-1">
              Diseduh dari biji kopi sangrai segar dan bahan pilihan untuk menemani nugas serta diskusi santai.
            </p>
          </div>

          <Link
            href="/menu"
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
          >
            <span>Lihat Semua Menu (Katalog Lengkap)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Kategori Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['Semua', 'Kopi', 'Non-Kopi', 'Camilan', 'Paket Nugas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-coffee-900 to-coffee-950 text-amber-300 dark:from-amber-500 dark:to-amber-600 dark:text-coffee-950 shadow-md scale-102'
                  : 'bg-white dark:bg-espresso-card text-coffee-800 dark:text-coffee-200 border border-coffee-200/60 dark:border-espresso-border hover:bg-coffee-100 dark:hover:bg-coffee-950'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid Card Produk 4-Kolom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.slice(0, 8).map((product) => {
            const rating = product.averageRating || 4.9;
            const reviewCount = product.reviewCount || 45;

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group relative rounded-3xl bg-white dark:bg-espresso-card border border-coffee-200/70 dark:border-espresso-border p-4 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div>
                  {/* Gambar Produk */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-3.5 bg-coffee-100/50 dark:bg-espresso-deep">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                    />

                    {/* Badge Best Seller / Hemat */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                      {product.isBestSeller && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-coffee-950 shadow-md">
                          <Star className="w-3 h-3 fill-coffee-950" /> Terlaris
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating & Review */}
                  <div className="flex items-center gap-1.5 text-xs text-coffee-600 dark:text-coffee-400 mb-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-coffee-950 dark:text-white">{rating}</span>
                    <span className="text-[11px]">({reviewCount} ulasan)</span>
                  </div>

                  {/* Judul & Deskripsi */}
                  <h3 className="font-extrabold text-base text-coffee-950 dark:text-cream group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-coffee-700 dark:text-coffee-300 line-clamp-2 leading-relaxed mb-4">
                    {product.description}
                  </p>
                </div>

                {/* Footer Card: Harga & Tombol Tambah */}
                <div className="flex items-center justify-between pt-3 border-t border-coffee-100 dark:border-espresso-border/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-coffee-600 dark:text-amber-300/80 block">
                      Harga
                    </span>
                    <span className="font-black text-base text-coffee-950 dark:text-cream">
                      Rp {product.basePrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="p-2.5 rounded-2xl bg-coffee-900 hover:bg-amber-500 text-amber-300 hover:text-coffee-950 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-coffee-950 shadow-md hover:scale-108 active:scale-95 transition-all flex items-center justify-center"
                    title="Tambah ke Keranjang"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-6">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-coffee-100 hover:bg-coffee-200 dark:bg-espresso-card dark:hover:bg-coffee-950 text-coffee-950 dark:text-amber-300 font-extrabold text-xs sm:text-sm border border-coffee-300/80 dark:border-espresso-border transition-all shadow-sm"
          >
            <span>Buka Katalog Lengkap (20+ Menu & Minuman)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 📚 SECTION TENTANG KAMI & STUDY SPACE */}
      {/* ======================================================== */}
      <section
        id="tentang-kami"
        className="rounded-3xl bg-gradient-to-br from-coffee-100/80 via-white to-amber-50/60 dark:from-espresso-card dark:via-[#160B08] dark:to-coffee-950 p-8 sm:p-12 border border-coffee-200/80 dark:border-espresso-border shadow-sm space-y-8"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-bold mb-3">
            ☕ Ruang Kreatif & Kolaborasi
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-coffee-950 dark:text-cream">
            Study Space Nyaman Buat Nugas & Diskusi
          </h2>
          <p className="text-xs sm:text-sm text-coffee-700 dark:text-coffee-300 mt-2 leading-relaxed">
            Kopi Mahasiswa dirancang khusus untuk memenuhi kebutuhan mahasiswa dan anak muda. Suasana tenang dengan musik lo-fi, colokan listrik di setiap meja, dan WiFi cepat untuk mendukung skripsi atau kerja kelompok.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-espresso-deep border border-coffee-200/60 dark:border-espresso-border text-center space-y-1.5">
            <Wifi className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto" />
            <h4 className="font-extrabold text-xs text-coffee-950 dark:text-cream">WiFi 100 Mbps</h4>
            <p className="text-[11px] text-coffee-600 dark:text-coffee-400">Gratis tanpa batas waktu</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-espresso-deep border border-coffee-200/60 dark:border-espresso-border text-center space-y-1.5">
            <BatteryCharging className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h4 className="font-extrabold text-xs text-coffee-950 dark:text-cream">Stopkontak Lengkap</h4>
            <p className="text-[11px] text-coffee-600 dark:text-coffee-400">Tersedia di setiap meja</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-espresso-deep border border-coffee-200/60 dark:border-espresso-border text-center space-y-1.5">
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mx-auto" />
            <h4 className="font-extrabold text-xs text-coffee-950 dark:text-cream">Buka Tiap Hari</h4>
            <p className="text-[11px] text-coffee-600 dark:text-coffee-400">08.00 - 23.00 WIB</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-espresso-deep border border-coffee-200/60 dark:border-espresso-border text-center space-y-1.5">
            <Award className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
            <h4 className="font-extrabold text-xs text-coffee-950 dark:text-cream">10% Off Member</h4>
            <p className="text-[11px] text-coffee-600 dark:text-coffee-400">Diskon khusus mahasiswa</p>
          </div>
        </div>
      </section>

      {/* Modal Customization Produk saat diklik */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          toppings={toppings}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
