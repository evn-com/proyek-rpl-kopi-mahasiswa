'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Star, Heart } from 'lucide-react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onFavoriteChange?: (productId: string, isFav: boolean) => void;
}

export default function ProductCard({ product, onSelect, onFavoriteChange }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(product.isFavorite ?? false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavLoading) return;

    setIsFavLoading(true);
    try {
      const res = await fetch('/api/customer/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      if (res.status === 401) {
        window.location.href = '/login?redirect=/menu';
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setIsFavorited(data.favorited);
        onFavoriteChange?.(product.id, data.favorited);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsFavLoading(false);
    }
  };

  const rating = product.averageRating ?? 5.0;
  const reviewCount = product.reviewCount ?? 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative rounded-3xl bg-white border border-coffee-200/70 p-3.5 flex flex-col justify-between shadow-xs hover:shadow-card-hover hover:border-coffee-400 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div>
        {/* Product Image & Badges */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-3 bg-coffee-100/50">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {!product.isAvailable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                Habis
              </span>
            )}
            {product.isBestSeller && product.isAvailable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold badge-bestseller shadow-xs">
                <Star className="w-3 h-3 fill-amber-100" /> Best Seller
              </span>
            )}
            {product.category?.slug === 'promo-mahasiswa' && product.isAvailable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold badge-mahasiswa shadow-xs">
                Hemat
              </span>
            )}
          </div>

          {/* Heart / Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            disabled={isFavLoading}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md z-10 ${
              isFavorited
                ? 'bg-rose-50 text-rose-600 scale-105'
                : 'bg-black/30 hover:bg-black/50 text-white'
            }`}
            title={isFavorited ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isFavorited ? 'fill-rose-600 scale-110' : ''
              }`}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-2">
          <div className="flex items-center gap-1 text-amber-600 text-xs font-bold mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{rating}</span>
            <span className="text-[11px] text-coffee-400 font-normal">
              ({reviewCount > 0 ? reviewCount : 'Baru'})
            </span>
          </div>

          <h3 className="font-extrabold text-coffee-950 text-sm sm:text-base leading-tight group-hover:text-coffee-700 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-coffee-700/80 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer Price & Action */}
      <div className="pt-2.5 flex items-center justify-between border-t border-coffee-100 mt-2">
        <div>
          <span className="text-[10px] text-coffee-500 font-medium block uppercase tracking-wider">
            Mulai Dari
          </span>
          <span className="font-extrabold text-sm sm:text-base text-coffee-950">
            Rp {product.basePrice.toLocaleString('id-ID')}
          </span>
        </div>

        <button
          disabled={!product.isAvailable}
          onClick={(e) => {
            e.stopPropagation();
            if (product.isAvailable) onSelect(product);
          }}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
            product.isAvailable
              ? 'bg-coffee-900 text-amber-200 group-hover:bg-coffee-700 group-hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={product.isAvailable ? 'Tambah ke Pesanan' : 'Stok Habis'}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
