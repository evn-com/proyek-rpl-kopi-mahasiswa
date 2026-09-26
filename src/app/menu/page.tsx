'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Sparkles, Coffee, Zap, Bot, Star, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import FloatingCartBar from '@/components/FloatingCartBar';
import AIChatModal from '@/components/AIChatModal';
import { Product, Category, Topping } from '@/types';
import { useOrderStore } from '@/store/orderStore';

export default function MenuPage() {
  const { tableNumber } = useOrderStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Fetch Categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch((err) => console.error('Categories error:', err));
  }, []);

  // Fetch Products & Toppings
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
        if (data.toppings) setToppings(data.toppings);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Products fetch error:', err);
        setIsLoading(false);
      });
  }, [activeCategory, searchQuery]);

  // Fetch AI Recommendations
  useEffect(() => {
    fetch('/api/ai/recommendations')
      .then((res) => res.json())
      .then((data) => {
        if (data.recommendations) setAiRecommendations(data.recommendations);
      })
      .catch((err) => console.error('AI Recommendations error:', err));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 pb-24">
      {/* Top Banner: Table Alert */}
      {!tableNumber && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-coffee-950 flex items-center justify-between gap-2 text-xs sm:text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <b>Perhatian:</b> Anda belum memilih nomor meja! Pilih meja agar pesanan dapat diantar.
            </span>
          </div>
          <Link
            href="/table-select"
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shrink-0 hover:bg-amber-700 transition-colors"
          >
            Pilih Meja
          </Link>
        </div>
      )}

      {/* Hero Mini Banner & AI Assistant Callout */}
      <div className="relative mb-6 rounded-3xl bg-gradient-to-r from-coffee-950 via-coffee-900 to-coffee-800 text-amber-100 p-5 sm:p-7 overflow-hidden shadow-xl border border-coffee-700/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold mb-2">
              <Zap className="w-3.5 h-3.5" /> Special Mahasiswa Promo 2026
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Menu Kopi & Camilan Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
              Espresso bold 100% Arabika, gula aren murni, dan croissant hangat siap menemani sesi nugasmu!
            </p>
          </div>

          <button
            onClick={() => setIsAIChatOpen(true)}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-coffee-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-coffee-950" />
            <span>✨ Tanya AI Kopi Mahasiswa</span>
          </button>
        </div>
      </div>

      {/* SECTION: ✨ REKOMENDASI UNTUK ANDA (AI RECOMMENDATIONS) */}
      {aiRecommendations.length > 0 && activeCategory === 'all' && !searchQuery && (
        <div className="mb-8 p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-coffee-50 border border-amber-300/60 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-coffee-950 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 fill-coffee-950" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-coffee-950">
                  ✨ Rekomendasi Untuk Anda
                </h2>
                <span className="text-[11px] text-coffee-700">Dikurasi khusus oleh Barista AI berdasarkan tren & selera</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {aiRecommendations.map((rec) => (
              <div
                key={rec.product.id}
                onClick={() => setSelectedProduct(rec.product)}
                className="p-3 bg-white rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-coffee-100">
                    <Image
                      src={rec.product.image}
                      alt={rec.product.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-coffee-950/80 backdrop-blur-xs text-amber-300 font-extrabold text-[10px]">
                      {rec.matchScore}% Match
                    </div>
                  </div>

                  <h3 className="font-extrabold text-xs text-coffee-950 line-clamp-1">{rec.product.name}</h3>
                  <p className="text-[11px] text-amber-800 font-medium mt-0.5 line-clamp-1">
                    💡 {rec.reason}
                  </p>
                </div>

                <div className="pt-2 border-t border-coffee-100 mt-2 flex items-center justify-between">
                  <span className="font-black text-xs text-coffee-950">
                    Rp {rec.product.basePrice.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[11px] font-bold text-coffee-700 hover:text-coffee-950 flex items-center gap-0.5">
                    Pilih <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Tabs */}
      <div className="sticky top-16 z-30 pt-2 pb-3 bg-cream/95 backdrop-blur-md space-y-3 border-b border-coffee-200/40 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-coffee-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kopi susu, matcha, croissant, americano..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-coffee-200 text-xs sm:text-sm text-coffee-950 focus:outline-none focus:border-coffee-600 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-coffee-500 font-bold hover:text-coffee-800"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-coffee-900 text-amber-100 shadow-xs'
                : 'bg-white text-coffee-800 border border-coffee-200 hover:bg-coffee-100/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semua Menu</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategory === cat.slug
                  ? 'bg-coffee-900 text-amber-100 shadow-xs'
                  : 'bg-white text-coffee-800 border border-coffee-200 hover:bg-coffee-100/60'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-coffee-200/40 animate-pulse border border-coffee-200/60"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-3xl border border-coffee-200/60 p-6">
          <Coffee className="w-12 h-12 text-coffee-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-coffee-950">Menu Tidak Ditemukan</h3>
          <p className="text-xs text-coffee-700 mt-1 max-w-xs mx-auto">
            Coba gunakan kata kunci pencarian lain atau pilih kategori menu di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onSelect={(p) => setSelectedProduct(p)}
              onFavoriteChange={(pId, isFav) => {
                setProducts((prev) =>
                  prev.map((item) => (item.id === pId ? { ...item, isFavorite: isFav } : item))
                );
              }}
            />
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          toppings={toppings}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Floating Bottom Cart Bar for Mobile */}
      <FloatingCartBar />

      {/* Floating AI Barista Button */}
      <button
        onClick={() => setIsAIChatOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-coffee-900 to-coffee-950 text-amber-300 font-extrabold text-xs shadow-2xl border border-amber-400/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
      >
        <Sparkles className="w-4 h-4 fill-amber-400 text-amber-400 animate-spin" />
        <span>✨ Tanya AI Kopi Mahasiswa</span>
      </button>

      {/* AI Chat Modal */}
      <AIChatModal isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  );
}
