export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  displayOrder: number;
  _count?: { products: number };
}

export interface ProductVariant {
  id?: string;
  productId?: string;
  name: string;
  priceAdjustment: number;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Recipe {
  id?: string;
  productId?: string;
  ingredientId: string;
  quantityRequired: number;
  ingredient?: Ingredient;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  image: string;
  isBestSeller: boolean;
  isAvailable: boolean;
  variants: ProductVariant[];
  recipes?: Recipe[];
  category?: Category;
  isFavorite?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  minimumStock: number;
  purchasePrice?: number | null;
  supplier?: string | null;
  expiryDate?: string | null;
  currentStock?: number;
  isLowStock?: boolean;
  recipesCount?: number;
}

export interface InventoryTransaction {
  id: string;
  inventoryId: string;
  inventory?: {
    ingredient?: Ingredient;
  };
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'USAGE';
  amount: number;
  notes?: string | null;
  createdAt: string;
  createdBy?: { name: string; email?: string };
}

export interface Inventory {
  id: string;
  branchId: string;
  ingredientId: string;
  stockQuantity: number;
  ingredient: Ingredient;
  transactions?: InventoryTransaction[];
}

export interface CartItemTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  selectedVariant?: ProductVariant | null;
  selectedToppings: CartItemTopping[];
  temperature?: 'Hot' | 'Iced' | string;
  sugarLevel?: string;
  iceLevel?: string;
  notes?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface AppliedVoucher {
  id: string;
  code: string;
  discountAmount: number;
}

export type OrderStatus =
  | 'WAITING'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING_CASHIER'
  | 'CONFIRMED'
  | 'PREPARING';

export interface OrderItem {
  id: string;
  productName: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
  toppings: { toppingName: string; price: number }[];
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string | null;
  isGuest: boolean;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  cancellationReason?: string | null;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' | 'PENDING' | 'EXPIRED' | 'FAILED';
  paymentMethod: 'PAY_AT_CASHIER' | 'ONLINE_PAYMENT' | 'CASH' | 'QRIS';
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
  payment?: {
    method: string;
    status: string;
    amount: number;
    paymentReference?: string;
  };
  history: {
    id: string;
    status: OrderStatus;
    notes?: string | null;
    createdAt: string;
  }[];
}
