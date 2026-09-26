'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { Product, ProductVariant, Topping, CartItemTopping } from '@/types';
import { useOrderStore } from '@/store/orderStore';

interface ProductModalProps {
  product: Product | null;
  toppings: Topping[];
  onClose: () => void;
}

export default function ProductModal({ product, toppings, onClose }: ProductModalProps) {
  const { addToCart } = useOrderStore();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [temperature, setTemperature] = useState<string>('Iced');
  const [sugarLevel, setSugarLevel] = useState<string>('Normal (100%)');
  const [iceLevel, setIceLevel] = useState<string>('Normal Ice');
  const [selectedToppings, setSelectedToppings] = useState<CartItemTopping[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setTemperature('Iced');
      setSugarLevel('Normal (100%)');
      setIceLevel('Normal Ice');
      setSelectedToppings([]);
      setNotes('');
      setQuantity(1);
      setToastMessage(null);
    }
  }, [product]);

  if (!product) return null;

  const toggleTopping = (topping: Topping) => {
    const exists = selectedToppings.some((t) => t.id === topping.id);
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, { id: topping.id, name: topping.name, price: topping.price }]);
    }
  };

  const variantAdjustment = selectedVariant ? selectedVariant.priceAdjustment : 0;
  const toppingsTotal = selectedToppings.reduce((acc, t) => acc + t.price, 0);
  const unitPrice = product.basePrice + variantAdjustment + toppingsTotal;
  const grandTotal = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart({
      product,
      selectedVariant,
      selectedToppings,
      temperature: product.category?.slug === 'snack-pastry' ? undefined : temperature,
      sugarLevel: product.category?.slug === 'snack-pastry' || product.category?.slug === 'espresso-series' ? undefined : sugarLevel,
      iceLevel: product.category?.slug === 'snack-pastry' || temperature === 'Hot' ? undefined : iceLevel,
      notes: notes.trim() || undefined,
      quantity,
    });

    setToastMessage('Berhasil ditambahkan!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const isBeverage = product.category?.slug !== 'snack-pastry';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity">
      <div
        className="relative w-full max-w-lg bg-cream rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image Banner */}
        <div className="relative w-full h-48 sm:h-56 bg-coffee-950 shrink-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-coffee-950 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-xs uppercase font-semibold text-amber-300 tracking-wider">
              {product.category?.name || 'Kopi Mahasiswa'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight drop-shadow-md">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <p className="text-xs sm:text-sm text-coffee-800 leading-relaxed bg-white/60 p-3 rounded-xl border border-coffee-200/50">
            {product.description}
          </p>

          {/* Variants (if any) */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="text-xs font-bold text-coffee-950 uppercase tracking-wider block mb-2">
                Pilih Ukuran / Varian
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-xl text-left border text-xs font-medium transition-all flex items-center justify-between ${
                      selectedVariant?.id === variant.id
                        ? 'border-coffee-700 bg-coffee-100 text-coffee-950 shadow-xs'
                        : 'border-coffee-200 bg-white text-coffee-800 hover:bg-coffee-50'
                    }`}
                  >
                    <span>{variant.name}</span>
                    <span className="text-[11px] font-bold text-coffee-600">
                      {variant.priceAdjustment > 0
                        ? `+Rp ${variant.priceAdjustment.toLocaleString('id-ID')}`
                        : 'Standar'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Beverage Options: Temperature, Sugar, Ice */}
          {isBeverage && (
            <>
              {/* Temperature */}
              <div>
                <label className="text-xs font-bold text-coffee-950 uppercase tracking-wider block mb-2">
                  Suhu Penyajian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Iced', 'Hot'].map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setTemperature(temp)}
                      className={`py-2.5 px-4 rounded-xl text-xs font-medium border text-center transition-all ${
                        temperature === temp
                          ? 'border-coffee-700 bg-coffee-800 text-amber-100 font-bold'
                          : 'border-coffee-200 bg-white text-coffee-800'
                      }`}
                    >
                      {temp === 'Iced' ? '🧊 Dingin (Iced)' : '☕ Panas (Hot)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar Level */}
              <div>
                <label className="text-xs font-bold text-coffee-950 uppercase tracking-wider block mb-2">
                  Level Gula Aren / Manis
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Normal (100%)', 'Less Sugar (50%)', 'No Sugar (0%)'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSugarLevel(lvl)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-medium border text-center transition-all ${
                        sugarLevel === lvl
                          ? 'border-coffee-700 bg-coffee-100 font-bold text-coffee-950'
                          : 'border-coffee-200 bg-white text-coffee-800'
                      }`}
                    >
                      {lvl.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice Level (only if Iced) */}
              {temperature === 'Iced' && (
                <div>
                  <label className="text-xs font-bold text-coffee-950 uppercase tracking-wider block mb-2">
                    Level Es Batu
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Normal Ice', 'Less Ice', 'No Ice'].map((ice) => (
                      <button
                        key={ice}
                        type="button"
                        onClick={() => setIceLevel(ice)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-medium border text-center transition-all ${
                          iceLevel === ice
                            ? 'border-coffee-700 bg-coffee-100 font-bold text-coffee-950'
                            : 'border-coffee-200 bg-white text-coffee-800'
                        }`}
                      >
                        {ice}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Toppings / Add-ons */}
          {toppings && toppings.length > 0 && (
            <div>
              <label className="text-xs font-bold text-coffee-950 uppercase tracking-wider block mb-2">
                Tambahan / Topping (Opsional)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {toppings.map((topping) => {
                  const isChecked = selectedToppings.some((t) => t.id === topping.id);
                  return (
                    <button
                      key={topping.id}
                      type="button"
                      onClick={() => toggleTopping(topping)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-coffee-600 bg-coffee-50 font-semibold text-coffee-950'
                          : 'border-coffee-200 bg-white text-coffee-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked ? 'bg-coffee-700 border-coffee-700 text-white' : 'border-gray-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{topping.name}</span>
                      </div>
                      <span className="font-bold text-coffee-700">
                        +Rp {topping.price.toLocaleString('id-ID')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Notes */}
          <div>
            <label className="text-xs font-bold text-coffee-950 uppercase tracking-wider block mb-1">
              Catatan Pesanan Khusus
            </label>
            <input
              type="text"
              placeholder="Contoh: Pisahkan sedotan, less ice bang..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-coffee-200 bg-white text-coffee-950 focus:outline-none focus:border-coffee-600"
            />
          </div>
        </div>

        {/* Modal Footer: Quantity Adjuster & Action */}
        <div className="p-4 sm:p-5 bg-white border-t border-coffee-200/80 flex items-center justify-between gap-4">
          {/* Quantity Counter */}
          <div className="flex items-center gap-3 bg-coffee-100/80 p-1.5 rounded-2xl border border-coffee-200">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-xl bg-white text-coffee-900 flex items-center justify-center shadow-xs hover:bg-coffee-50 active:scale-95 transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-sm text-coffee-950 min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl bg-white text-coffee-900 flex items-center justify-center shadow-xs hover:bg-coffee-50 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!!toastMessage}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-coffee-800 to-coffee-950 text-amber-100 font-bold text-xs sm:text-sm flex items-center justify-between shadow-coffee-glow hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <span>{toastMessage || 'Tambah ke Keranjang'}</span>
            <span className="text-amber-300 font-extrabold text-sm sm:text-base">
              Rp {grandTotal.toLocaleString('id-ID')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
