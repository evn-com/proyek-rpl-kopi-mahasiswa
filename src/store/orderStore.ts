import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, AppliedVoucher, Product, ProductVariant, CartItemTopping } from '@/types';

interface OrderState {
  tableNumber: string | null;
  setTableNumber: (tableNumber: string | null) => void;
  
  cart: CartItem[];
  addToCart: (params: {
    product: Product;
    selectedVariant?: ProductVariant | null;
    selectedToppings: CartItemTopping[];
    temperature?: string;
    sugarLevel?: string;
    iceLevel?: string;
    notes?: string;
    quantity: number;
  }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;

  appliedVoucher: AppliedVoucher | null;
  setAppliedVoucher: (voucher: AppliedVoucher | null) => void;

  customerName: string;
  customerPhone: string;
  setCustomerInfo: (info: { name?: string; phone?: string }) => void;

  getCartSubtotal: () => number;
  getCartDiscount: () => number;
  getCartFinalTotal: () => number;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      tableNumber: null,
      setTableNumber: (tableNumber) => set({ tableNumber }),

      cart: [],
      addToCart: ({ product, selectedVariant, selectedToppings, temperature, sugarLevel, iceLevel, notes, quantity }) => {
        const variantPrice = selectedVariant ? selectedVariant.priceAdjustment : 0;
        const toppingsPrice = selectedToppings.reduce((acc, t) => acc + t.price, 0);
        const unitPrice = product.basePrice + variantPrice + toppingsPrice;
        const subtotal = unitPrice * quantity;

        const cartItemId = `${product.id}-${selectedVariant?.id || 'std'}-${temperature || ''}-${sugarLevel || ''}-${iceLevel || ''}-${selectedToppings.map(t => t.id).sort().join(',')}`;

        const existingIndex = get().cart.findIndex(i => i.cartItemId === cartItemId);
        if (existingIndex > -1) {
          const updatedCart = [...get().cart];
          const newQty = updatedCart[existingIndex].quantity + quantity;
          updatedCart[existingIndex].quantity = newQty;
          updatedCart[existingIndex].subtotal = updatedCart[existingIndex].unitPrice * newQty;
          set({ cart: updatedCart });
        } else {
          const newItem: CartItem = {
            cartItemId,
            product,
            selectedVariant,
            selectedToppings,
            temperature,
            sugarLevel,
            iceLevel,
            notes,
            quantity,
            unitPrice,
            subtotal,
          };
          set({ cart: [...get().cart, newItem] });
        }
      },

      removeFromCart: (cartItemId) => {
        set({ cart: get().cart.filter(item => item.cartItemId !== cartItemId) });
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }
        set({
          cart: get().cart.map(item =>
            item.cartItemId === cartItemId
              ? { ...item, quantity, subtotal: item.unitPrice * quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ cart: [], appliedVoucher: null }),

      appliedVoucher: null,
      setAppliedVoucher: (appliedVoucher) => set({ appliedVoucher }),

      customerName: '',
      customerPhone: '',
      setCustomerInfo: (info) =>
        set((state) => ({
          customerName: info.name !== undefined ? info.name : state.customerName,
          customerPhone: info.phone !== undefined ? info.phone : state.customerPhone,
        })),

      getCartSubtotal: () => {
        return get().cart.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getCartDiscount: () => {
        const voucher = get().appliedVoucher;
        if (!voucher) return 0;
        return voucher.discountAmount;
      },

      getCartFinalTotal: () => {
        const subtotal = get().getCartSubtotal();
        const discount = get().getCartDiscount();
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'kopi-mahasiswa-order-store',
    }
  )
);
