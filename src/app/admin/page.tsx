'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import {
  Package,
  Layers,
  FlaskConical,
  BookOpen,
  Boxes,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  Clock,
  UserCheck,
  Ticket,
  Tag,
  Sparkles,
  Calendar,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Product, Category, Ingredient, InventoryTransaction } from '@/types';
import AdminSidebar from '@/components/AdminSidebar';
import AdminUserManagement from '@/components/AdminUserManagement';
import AdminAIChat from '@/components/AdminAIChat';
import AdminWhatsAppInbox from '@/components/AdminWhatsAppInbox';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'categories' | 'toppings' | 'ingredients' | 'recipes' | 'inventory' | 'promotions' | 'vouchers' | 'users' | 'memberships' | 'inbox'
  >('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingMembersCount, setPendingMembersCount] = useState<number>(0);
  const [broadcastingPromo, setBroadcastingPromo] = useState<boolean>(false);

  // Sync tab with URL search parameter if navigated from another page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryTransaction[]>([]);
  const [lowStockList, setLowStockList] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Topping Modal
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [toppingForm, setToppingForm] = useState({ id: '', name: '', price: 3000, isAvailable: true });

  // Voucher Modal
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    id: '',
    code: '',
    discountType: 'FIXED',
    discountAmount: 5000,
    minSpend: 20000,
    maxDiscount: 0,
    quota: 100,
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    isActive: true,
  });

  // Modals & Confirmations
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minPurchase: 0,
    maxDiscount: 10000,
    productId: '',
    categoryId: '',
    targetCustomerId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    usageLimit: 100,
    isActive: true,
  });

  // Modals & Confirmations
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalType, setStockModalType] = useState<'IN' | 'ADJUSTMENT' | 'USAGE'>('IN');
  const [selectedIngredientForStock, setSelectedIngredientForStock] = useState<Ingredient | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Forms
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    basePrice: '',
    image: '',
    isAvailable: true,
    isBestSeller: false,
    variants: [{ name: 'Regular', priceAdjustment: 0 }],
  });

  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    icon: 'coffee',
    displayOrder: 0,
  });

  const [ingredientForm, setIngredientForm] = useState({
    id: '',
    name: '',
    unit: 'gram',
    minimumStock: 100,
    purchasePrice: 0,
    supplier: '',
    expiryDate: '',
    initialStock: 0,
  });

  const [stockForm, setStockForm] = useState({
    ingredientId: '',
    amount: '',
    notes: '',
  });

  // Recipe BOM state
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<string>('');
  const [recipeFormItems, setRecipeFormItems] = useState<{ ingredientId: string; quantityRequired: number }[]>([]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, prodRes, catRes, ingRes, invRes, promRes, topRes, voucRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/ingredients'),
        fetch('/api/admin/inventory'),
        fetch('/api/admin/promotions'),
        fetch('/api/admin/toppings'),
        fetch('/api/admin/vouchers'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (topRes.ok) {
        const tData = await topRes.json();
        setToppings(tData.toppings || []);
      }
      if (voucRes.ok) {
        const vData = await voucRes.json();
        setVouchers(vData.vouchers || []);
      }
      if (promRes.ok) {
        const prData = await promRes.json();
        setPromotions(prData.promotions || []);
      }
      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData);
        if (pData.length > 0 && !selectedProductForRecipe) {
          setSelectedProductForRecipe(pData[0].id);
        }
      }
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(Array.isArray(cData) ? cData : []);
      }
      if (ingRes.ok) {
        const iData = await ingRes.json();
        setIngredients(Array.isArray(iData) ? iData : []);
      }
      if (invRes.ok) {
        const invData = await invRes.json();
        setLowStockList(invData.lowStockAlerts || []);
      }

      // Fetch history logs
      const historyRes = await fetch('/api/admin/inventory?view=history');
      if (historyRes.ok) {
        const hData = await historyRes.json();
        setInventoryLogs(Array.isArray(hData) ? hData : []);
      }

      // Fetch pending memberships count
      try {
        const memRes = await fetch('/api/admin/memberships?status=PENDING');
        if (memRes.ok) {
          const memData = await memRes.json();
          setPendingMembersCount(memData.counts?.pending || 0);
        }
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      showToast('Gagal memuat data admin dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastDailyPromo = async () => {
    if (!confirm('Kirim notifikasi info promo aktif hari ini ke nomor WhatsApp semua pelanggan yang telah menyetujui (opt-in)?')) {
      return;
    }
    setBroadcastingPromo(true);
    try {
      const res = await fetch('/api/cron/daily-promo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim broadcast');
      showToast(data.message || `Broadcast selesai: ${data.sentCount || 0} terkirim`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBroadcastingPromo(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update recipe form when product selected
  useEffect(() => {
    if (selectedProductForRecipe) {
      const prod = products.find((p) => p.id === selectedProductForRecipe);
      if (prod && prod.recipes) {
        setRecipeFormItems(
          prod.recipes.map((r) => ({
            ingredientId: r.ingredientId,
            quantityRequired: r.quantityRequired,
          }))
        );
      } else {
        setRecipeFormItems([]);
      }
    }
  }, [selectedProductForRecipe, products]);

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan produk');

      showToast(data.message || 'Produk berhasil disimpan');
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleProductAvailability = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      });
      if (res.ok) {
        showToast(`Status ketersediaan ${product.name} diperbarui.`);
        fetchData();
      }
    } catch (err) {
      showToast('Gagal memperbarui status produk', 'error');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirm({
      show: true,
      title: 'Hapus Produk',
      message: `Apakah Anda yakin ingin menghapus produk "${product.name}"? Resep terkait juga akan dihapus.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          showToast('Produk berhasil dihapus');
          fetchData();
        } catch (err: any) {
          showToast(err.message, 'error');
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  // Category CRUD
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = categoryForm.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || 'Kategori disimpan');
      setShowCategoryModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    setDeleteConfirm({
      show: true,
      title: 'Hapus Kategori',
      message: `Hapus kategori "${cat.name}"? Kategori yang memiliki produk tidak dapat dihapus.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/categories?id=${cat.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          showToast('Kategori berhasil dihapus');
          fetchData();
        } catch (err: any) {
          showToast(err.message, 'error');
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  // Promotion CRUD
  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Promosi berhasil dibuat');
      setShowPromoModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTogglePromotionActive = async (promo: any) => {
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promo.id, isActive: !promo.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Promosi ${promo.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeletePromotion = (promo: any) => {
    setDeleteConfirm({
      show: true,
      title: 'Hapus Promosi',
      message: `Hapus promosi "${promo.title}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/promotions?id=${promo.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          showToast('Promosi berhasil dihapus');
          fetchData();
        } catch (err: any) {
          showToast(err.message, 'error');
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  // Topping CRUD
  const handleSaveTopping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(toppingForm.id);
      const url = '/api/admin/toppings';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toppingForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(isEdit ? 'Topping berhasil diperbarui' : 'Topping berhasil ditambahkan');
      setShowToppingModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTopping = (top: any) => {
    setDeleteConfirm({
      show: true,
      title: 'Hapus Topping',
      message: `Hapus topping "${top.name}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/toppings?id=${top.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          showToast('Topping berhasil dihapus');
          fetchData();
        } catch (err: any) {
          showToast(err.message, 'error');
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  // Voucher CRUD
  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(voucherForm.id);
      const url = '/api/admin/vouchers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucherForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(isEdit ? 'Voucher berhasil diperbarui' : 'Voucher berhasil dibuat');
      setShowVoucherModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteVoucher = (v: any) => {
    setDeleteConfirm({
      show: true,
      title: 'Hapus Voucher',
      message: `Hapus kode voucher "${v.code}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/vouchers?id=${v.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          showToast('Voucher berhasil dihapus');
          fetchData();
        } catch (err: any) {
          showToast(err.message, 'error');
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  // Ingredient CRUD
  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = ingredientForm.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/ingredients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || 'Bahan baku disimpan');
      setShowIngredientModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteIngredient = (ing: Ingredient) => {
    setDeleteConfirm({
      show: true,
      title: 'Hapus Bahan Baku',
      message: `Hapus bahan baku "${ing.name}"? Semua resep dan histori mutasi terkait akan ikut terhapus.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/ingredients?id=${ing.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          showToast('Bahan baku berhasil dihapus');
          fetchData();
        } catch (err: any) {
          showToast(err.message, 'error');
        } finally {
          setDeleteConfirm(null);
        }
      },
    });
  };

  // Recipe BOM Save
  const handleSaveRecipeBOM = async () => {
    if (!selectedProductForRecipe) return;
    try {
      const res = await fetch('/api/admin/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductForRecipe,
          ingredients: recipeFormItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Resep (BOM) produk berhasil disimpan');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Stock Movement Save
  const handleSaveStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.ingredientId || !stockForm.amount) {
      showToast('Pilih bahan baku dan masukkan jumlah mutasi.', 'error');
      return;
    }

    const ing = ingredients.find((i) => i.id === stockForm.ingredientId);
    const amountVal = parseFloat(stockForm.amount);

    if (stockModalType === 'ADJUSTMENT') {
      setDeleteConfirm({
        show: true,
        title: 'Konfirmasi Penyesuaian Stok (Adjustment)',
        message: `Anda akan me-reset stok fisik "${ing?.name}" secara langsung menjadi ${amountVal} ${ing?.unit}. Lanjutkan?`,
        onConfirm: () => executeStockPost(),
      });
    } else {
      executeStockPost();
    }
  };

  const executeStockPost = async () => {
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: stockForm.ingredientId,
          type: stockModalType,
          amount: stockForm.amount,
          notes: stockForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Mutasi stok berhasil dicatat');
      setShowStockModal(false);
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Tab title mapping for navbar header display
  const tabTitles: Record<string, string> = {
    overview: 'Dashboard Overview',
    products: 'Product Management',
    categories: 'Kategori Produk',
    toppings: 'Toppings Management',
    ingredients: 'Bahan Baku (Stock)',
    recipes: 'Recipe / Bill of Materials (BOM)',
    inventory: 'Riwayat & Mutasi Inventaris',
    promotions: 'Promosi & Banner',
    vouchers: 'Manajemen Voucher Diskon',
    users: 'Manajemen Pengguna & Membership',
    memberships: 'Manajemen Pengguna & Membership',
    inbox: 'WhatsApp Live Chat & Human Handover',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Left Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab === 'memberships' ? 'users' : activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        lowStockCount={lowStockList.length}
        pendingMembersCount={pendingMembersCount}
      />

      {/* Right Content Area (offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col lg:pl-[260px] min-w-0 transition-[padding] duration-300">
        <AdminNavbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          pageTitle={tabTitles[activeTab] || 'Admin Dashboard'}
        />

        {/* Toast Notification (Top Right to avoid FAB collision) */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${toastMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
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

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Total Produk</span>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{stats?.totalProducts || 0}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats?.totalCategories || 0} Kategori Aktif</div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Low Stock Warning</span>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-rose-500 dark:text-rose-400">{stats?.lowStockCount || 0}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bahan di bawah batas minimum</div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Omset Hari Ini</span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    Rp {(stats?.todayRevenue || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats?.todayOrdersCount || 0} Transaksi Masuk</div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Bahan Baku Master</span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{stats?.totalIngredients || 0}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tersambung ke BOM Produk</div>
                </div>
              </div>

              {/* Low Stock Warning Widget */}
              <div className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Peringatan Stok Rendah (Low Stock Alert)</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    Kelola Stok <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {lowStockList.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">Semua stok bahan baku dalam batas aman.</p>
                    <p className="text-xs text-slate-500">Tidak ada bahan baku yang berada di bawah stok minimum.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{item.ingredientName}</div>
                          <div className="text-xs text-rose-600 dark:text-rose-300">
                            Stok: <span className="font-bold">{item.currentStock}</span> {item.unit} (Min: {item.minimumStock})
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const ing = ingredients.find((i) => i.name === item.ingredientName);
                            if (ing) {
                              setSelectedIngredientForStock(ing);
                              setStockForm({ ingredientId: ing.id, amount: '', notes: 'Restok darurat' });
                              setStockModalType('IN');
                              setShowStockModal(true);
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-md transition"
                        >
                          + Restok
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sales Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Omzet Hari Ini</span>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    Rp {(stats?.salesSummary?.todayRevenue || stats?.todayRevenue || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {stats?.salesSummary?.todayOrdersCount || stats?.todayOrdersCount || 0} order terverifikasi
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Omzet 7 Hari Terakhir</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    Rp {(stats?.salesSummary?.weekRevenue || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Performa mingguan</span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Omzet Bulan Ini</span>
                  <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                    Rp {(stats?.salesSummary?.monthRevenue || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Akumulasi bulan berjalan</span>
                </div>
              </div>

              {/* Recent Orders & Recent Audit Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Pesanan Terbaru
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">10 Order Terakhir</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                    {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Belum ada pesanan.</p>
                    ) : (
                      stats.recentOrders.map((ord: any) => (
                        <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 dark:text-white">{ord.orderNumber}</strong>
                              <span className="text-amber-600 dark:text-amber-400 font-bold">({ord.tableNumber})</span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ord.customerName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 dark:text-white block">Rp {ord.finalAmount.toLocaleString('id-ID')}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ord.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                                ord.status === 'READY' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' :
                                  ord.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Activity (Audit Log) */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Log Aktivitas Sistem (Audit Log)
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Keamanan & Perubahan</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                    {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Belum ada catatan aktivitas.</p>
                    ) : (
                      stats.recentActivity.map((log: any) => (
                        <div key={log.id} className="py-2.5 flex items-start justify-between text-xs gap-3">
                          <div>
                            <strong className="text-slate-900 dark:text-slate-200 block">{log.action}</strong>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">{log.details || '-'}</p>
                            <span className="text-[10px] text-slate-500">Oleh: {log.user?.name || 'Sistem'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS MANAGEMENT TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Product Management</h2>
                  <p className="text-xs text-slate-400">Kelola item produk, harga, ketersediaan, dan varian</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      categoryId: categories[0]?.id || '',
                      description: '',
                      basePrice: '',
                      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
                      isAvailable: true,
                      isBestSeller: false,
                      variants: [{ name: 'Regular', priceAdjustment: 0 }],
                    });
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                >
                  <Plus className="w-4 h-4" /> Tambah Produk
                </button>
              </div>

              {/* Products Table / Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className={`bg-white dark:bg-slate-900/90 border rounded-2xl shadow-sm overflow-hidden flex flex-col transition ${prod.isAvailable ? 'border-slate-200 dark:border-slate-800 hover:border-amber-500/40' : 'border-rose-300 dark:border-rose-900/50 opacity-75'
                      }`}
                  >
                    <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-950">
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${prod.isAvailable ? 'bg-emerald-500 text-slate-950' : 'bg-rose-600 text-white'
                            }`}
                        >
                          {prod.isAvailable ? 'Tersedia' : 'Unavailable'}
                        </span>
                      </div>
                      {prod.isBestSeller && (
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-md shadow-md">
                          Best Seller
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          {prod.category?.name || 'Uncategorized'}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{prod.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{prod.description}</p>
                        <div className="mt-3 font-extrabold text-amber-600 dark:text-amber-400 text-lg">
                          Rp {prod.basePrice.toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleProductAvailability(prod)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${prod.isAvailable
                              ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-500/40 dark:hover:bg-emerald-900'
                            }`}
                        >
                          {prod.isAvailable ? 'Set Unavailable' : 'Set Available'}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setProductForm({
                                name: prod.name,
                                categoryId: prod.categoryId,
                                description: prod.description,
                                basePrice: prod.basePrice.toString(),
                                image: prod.image,
                                isAvailable: prod.isAvailable,
                                isBestSeller: prod.isBestSeller,
                                variants: prod.variants?.map((v) => ({
                                  name: v.name,
                                  priceAdjustment: v.priceAdjustment,
                                })) || [{ name: 'Regular', priceAdjustment: 0 }],
                              });
                              setShowProductModal(true);
                            }}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 transition"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Category Management</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Atur kategori menu produk kopi dan snack</p>
                </div>
                <button
                  onClick={() => {
                    setCategoryForm({ id: '', name: '', icon: 'coffee', displayOrder: categories.length + 1 });
                    setShowCategoryModal(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg transition"
                >
                  <Plus className="w-4 h-4" /> Tambah Kategori
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Urutan</th>
                      <th className="px-6 py-4">Nama Kategori</th>
                      <th className="px-6 py-4">Icon</th>
                      <th className="px-6 py-4">Jumlah Produk</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">{cat.displayOrder}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{cat.name}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">{cat.icon || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{cat._count?.products || 0} item</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setCategoryForm({
                                  id: cat.id,
                                  name: cat.name,
                                  icon: cat.icon || 'coffee',
                                  displayOrder: cat.displayOrder,
                                });
                                setShowCategoryModal(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INGREDIENTS TAB (Bahan Baku) */}
          {activeTab === 'ingredients' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Ingredient Management (Bahan Baku)</h2>
                  <p className="text-xs text-slate-400">Master data bahan baku, unit, stok fisik, supplier & expiry</p>
                </div>
                <button
                  onClick={() => {
                    setEditingIngredient(null);
                    setIngredientForm({
                      id: '',
                      name: '',
                      unit: 'gram',
                      minimumStock: 100,
                      purchasePrice: 0,
                      supplier: '',
                      expiryDate: '',
                      initialStock: 0,
                    });
                    setShowIngredientModal(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                >
                  <Plus className="w-4 h-4" /> Tambah Bahan Baku
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Nama Bahan</th>
                        <th className="px-6 py-4">Stok Riil</th>
                        <th className="px-6 py-4">Min. Stok</th>
                        <th className="px-6 py-4">Harga Beli</th>
                        <th className="px-6 py-4">Supplier</th>
                        <th className="px-6 py-4">Status Stok</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {ingredients.map((ing) => (
                        <tr key={ing.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{ing.name}</td>
                          <td className="px-6 py-4 font-mono font-extrabold text-amber-600 dark:text-amber-400">
                            {ing.currentStock} {ing.unit}
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                            {ing.minimumStock} {ing.unit}
                          </td>
                          <td className="px-6 py-4">Rp {(ing.purchasePrice || 0).toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{ing.supplier || '-'}</td>
                          <td className="px-6 py-4">
                            {ing.isLowStock ? (
                              <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
                                <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-500/40 rounded-full text-xs font-bold w-max">
                                Aman
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedIngredientForStock(ing);
                                  setStockForm({ ingredientId: ing.id, amount: '', notes: '' });
                                  setStockModalType('IN');
                                  setShowStockModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition"
                              >
                                + Mutasi
                              </button>
                              <button
                                onClick={() => {
                                  setEditingIngredient(ing);
                                  setIngredientForm({
                                    id: ing.id,
                                    name: ing.name,
                                    unit: ing.unit,
                                    minimumStock: ing.minimumStock,
                                    purchasePrice: ing.purchasePrice || 0,
                                    supplier: ing.supplier || '',
                                    expiryDate: ing.expiryDate || '',
                                    initialStock: ing.currentStock || 0,
                                  });
                                  setShowIngredientModal(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteIngredient(ing)}
                                className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RECIPES TAB (BOM) */}
          {activeTab === 'recipes' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recipe / BOM (Bill of Materials) Management</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tentukan kebutuhan bahan baku untuk setiap produk. Stok akan otomatis terpotong saat transaksi dikonfirmasi.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 shadow-sm">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Pilih Produk</label>
                  <select
                    value={selectedProductForRecipe}
                    onChange={(e) => setSelectedProductForRecipe(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Rp {p.basePrice.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Daftar Bahan Baku Resep</h3>
                    <button
                      onClick={() => {
                        if (ingredients.length === 0) {
                          showToast('Buat bahan baku terlebih dahulu di tab Bahan Baku.', 'error');
                          return;
                        }
                        setRecipeFormItems([...recipeFormItems, { ingredientId: ingredients[0].id, quantityRequired: 10 }]);
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Bahan Baru
                    </button>
                  </div>

                  {recipeFormItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">Belum ada resep bahan baku untuk produk ini.</p>
                  ) : (
                    recipeFormItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <select
                          value={item.ingredientId}
                          onChange={(e) => {
                            const updated = [...recipeFormItems];
                            updated[idx].ingredientId = e.target.value;
                            setRecipeFormItems(updated);
                          }}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={item.quantityRequired}
                            onChange={(e) => {
                              const updated = [...recipeFormItems];
                              updated[idx].quantityRequired = parseFloat(e.target.value) || 0;
                              setRecipeFormItems(updated);
                            }}
                            className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono text-right focus:outline-none"
                            placeholder="Jumlah"
                          />
                          <span className="text-xs text-slate-400 w-12 font-bold">
                            {ingredients.find((i) => i.id === item.ingredientId)?.unit || 'unit'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setRecipeFormItems(recipeFormItems.filter((_, i) => i !== idx));
                          }}
                          className="p-2 text-rose-400 hover:bg-rose-950 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}

                  <button
                    onClick={handleSaveRecipeBOM}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition mt-4"
                  >
                    Simpan Resep Produk
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY & TRANSACTION HISTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Inventory Movements & Audit History</h2>
                  <p className="text-xs text-slate-400">Catatan riwayat mutasi stok (IN, ADJUSTMENT, USAGE)</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedIngredientForStock(ingredients[0] || null);
                    setStockForm({ ingredientId: ingredients[0]?.id || '', amount: '', notes: '' });
                    setStockModalType('IN');
                    setShowStockModal(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg transition"
                >
                  <Plus className="w-4 h-4" /> Catat Mutasi Stok
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">Histori Mutasi Terakhir</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{inventoryLogs.length} transaksi tercatat</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Waktu</th>
                        <th className="px-6 py-4">Bahan Baku</th>
                        <th className="px-6 py-4">Tipe Mutasi</th>
                        <th className="px-6 py-4">Jumlah</th>
                        <th className="px-6 py-4">Catatan</th>
                        <th className="px-6 py-4">Petugas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {inventoryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                            {new Date(log.createdAt).toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{log.inventory?.ingredient?.name || '-'}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${log.type === 'IN'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                  : log.type === 'ADJUSTMENT'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                                    : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                                }`}
                            >
                              {log.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-white">
                            {log.amount} {log.inventory?.ingredient?.unit}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-300">{log.notes || '-'}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{log.createdBy?.name || 'Sistem'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PROMOTIONS MANAGEMENT TAB */}
          {activeTab === 'promotions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Promosi & Diskon Mahasiswa</h2>
                  <p className="text-xs text-slate-400">
                    Buat promo diskon persentase, nominal tetap, produk/kategori khusus, dan batas kuota
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleBroadcastDailyPromo}
                    disabled={broadcastingPromo}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                    title="Kirim info promo harian via WhatsApp ke pelanggan yang telah opt-in"
                  >
                    <Send className={`w-4 h-4 ${broadcastingPromo ? 'animate-pulse' : ''}`} />
                    <span>{broadcastingPromo ? 'Mengirim...' : 'Broadcast Promo WhatsApp'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setPromoForm({
                        title: '',
                        description: '',
                        discountType: 'PERCENTAGE',
                        discountValue: 15,
                        minPurchase: 20000,
                        maxDiscount: 10000,
                        productId: '',
                        categoryId: '',
                        targetCustomerId: '',
                        startDate: new Date().toISOString().slice(0, 10),
                        endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                        usageLimit: 100,
                        isActive: true,
                      });
                      setShowPromoModal(true);
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                  >
                    <Plus className="w-4 h-4" /> Buat Promosi Baru
                  </button>
                </div>
              </div>

              {/* Promotions Table */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Nama Promosi</th>
                        <th className="px-6 py-4">Tipe Diskon</th>
                        <th className="px-6 py-4">Target Khusus</th>
                        <th className="px-6 py-4">Min. Belanja</th>
                        <th className="px-6 py-4">Periode Berlaku</th>
                        <th className="px-6 py-4">Kuota Pemakaian</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {promotions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                            Belum ada data promosi. Klik tombol &quot;Buat Promosi Baru&quot; di atas.
                          </td>
                        </tr>
                      ) : (
                        promotions.map((promo) => (
                          <tr key={promo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{promo.title}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{promo.description || '-'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold font-mono">
                                {promo.discountType === 'PERCENTAGE'
                                  ? `${promo.discountValue}% (Maks Rp ${promo.maxDiscount?.toLocaleString('id-ID') || '∞'})`
                                  : `Rp ${promo.discountValue.toLocaleString('id-ID')}`}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-300">
                              {promo.product ? (
                                <span className="text-amber-400">Produk: {promo.product.name}</span>
                              ) : promo.category ? (
                                <span className="text-sky-400">Kategori: {promo.category.name}</span>
                              ) : promo.targetCustomerId ? (
                                <span className="text-purple-400">Pelanggan Khusus</span>
                              ) : (
                                <span className="text-slate-400">Semua Menu</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-white">
                              Rp {(promo.minPurchase || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                              {new Date(promo.startDate).toLocaleDateString('id-ID')} - {new Date(promo.endDate).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              <span className="font-mono text-white font-bold">{promo.usedCount || 0}</span>
                              <span className="text-slate-500"> / {promo.usageLimit || '∞'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleTogglePromotionActive(promo)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${promo.isActive
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400'
                                  }`}
                              >
                                {promo.isActive ? 'Aktif' : 'Nonaktif'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeletePromotion(promo)}
                                className="p-1.5 text-rose-400 hover:bg-rose-950 rounded-lg transition"
                                title="Hapus Promosi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TOPPINGS MANAGEMENT TAB */}
          {activeTab === 'toppings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Topping Management</h2>
                  <p className="text-xs text-slate-400">
                    Kelola daftar topping tambahan untuk minuman dan makanan (harga & ketersediaan)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setToppingForm({ id: '', name: '', price: 3000, isAvailable: true });
                    setShowToppingModal(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                >
                  <Plus className="w-4 h-4" /> Tambah Topping
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Nama Topping</th>
                        <th className="px-6 py-4">Harga Tambahan</th>
                        <th className="px-6 py-4">Status Ketersediaan</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {toppings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                            Belum ada topping. Klik &quot;Tambah Topping&quot; untuk menambahkan.
                          </td>
                        </tr>
                      ) : (
                        toppings.map((top) => (
                          <tr key={top.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                              <span>{top.name}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-amber-600 dark:text-amber-300">
                              Rp {top.price.toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${top.isAvailable
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                                  }`}
                              >
                                {top.isAvailable ? 'Tersedia' : 'Habis'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setToppingForm({
                                    id: top.id,
                                    name: top.name,
                                    price: top.price,
                                    isAvailable: top.isAvailable,
                                  });
                                  setShowToppingModal(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                title="Edit Topping"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTopping(top)}
                                className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-lg transition"
                                title="Hapus Topping"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VOUCHERS MANAGEMENT TAB */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Voucher Mahasiswa</h2>
                  <p className="text-xs text-slate-400">
                    Buat dan kelola kode voucher yang dapat dimasukkan pelanggan saat checkout
                  </p>
                </div>
                <button
                  onClick={() => {
                    setVoucherForm({
                      id: '',
                      code: '',
                      discountType: 'FIXED',
                      discountAmount: 5000,
                      minSpend: 20000,
                      maxDiscount: 0,
                      quota: 100,
                      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                      isActive: true,
                    });
                    setShowVoucherModal(true);
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                >
                  <Plus className="w-4 h-4" /> Buat Voucher Baru
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Kode Voucher</th>
                        <th className="px-6 py-4">Diskon</th>
                        <th className="px-6 py-4">Min. Belanja</th>
                        <th className="px-6 py-4">Kuota / Terpakai</th>
                        <th className="px-6 py-4">Berlaku Sampai</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {vouchers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                            Belum ada kode voucher. Klik &quot;Buat Voucher Baru&quot; untuk membuat voucher.
                          </td>
                        </tr>
                      ) : (
                        vouchers.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4">
                              <span className="font-mono font-extrabold text-amber-600 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                {v.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                              {v.discountType === 'PERCENTAGE'
                                ? `${v.discountAmount}%`
                                : `Rp ${v.discountAmount.toLocaleString('id-ID')}`}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                              Rp {v.minSpend.toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-300">
                              {v.usedCount} / {v.quota} dipakai ({v._count?.orders || 0} order)
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                              {new Date(v.expiryDate).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${v.isActive && new Date(v.expiryDate) > new Date()
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                                  }`}
                              >
                                {v.isActive && new Date(v.expiryDate) > new Date() ? 'Aktif' : 'Nonaktif / Exp'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setVoucherForm({
                                    id: v.id,
                                    code: v.code,
                                    discountType: v.discountType,
                                    discountAmount: v.discountAmount,
                                    minSpend: v.minSpend,
                                    maxDiscount: v.maxDiscount || 0,
                                    quota: v.quota,
                                    expiryDate: new Date(v.expiryDate).toISOString().slice(0, 10),
                                    isActive: v.isActive,
                                  });
                                  setShowVoucherModal(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                title="Edit Voucher"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteVoucher(v)}
                                className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-lg transition"
                                title="Hapus Voucher"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USERS & MEMBERSHIP MANAGEMENT TAB */}
          {(activeTab === 'users' || activeTab === 'memberships') && (
            <AdminUserManagement
              onShowToast={showToast}
              onRefreshPendingCount={(count) => setPendingMembersCount(count)}
            />
          )}

          {/* WHATSAPP LIVE CHAT & HUMAN HANDOVER TAB */}
          {activeTab === 'inbox' && (
            <AdminWhatsAppInbox onShowToast={showToast} />
          )}
        </main>
      </div>

      {/* PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Kopi Susu Aren"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Kategori</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Harga Dasar (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.basePrice}
                    onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="18000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Deskripsi Produk</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Deskripsi singkat rasa dan racikan..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">URL Gambar Produk</label>
                <input
                  type="text"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isAvailable}
                    onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-sm font-semibold text-white">Tersedia untuk dipesan (Available)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller}
                    onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-sm font-semibold text-white">Tandai Best Seller</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-400">Varian Produk</span>
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm({
                        ...productForm,
                        variants: [...productForm.variants, { name: '', priceAdjustment: 0 }],
                      })
                    }
                    className="text-xs text-amber-400 font-bold hover:underline"
                  >
                    + Tambah Varian
                  </button>
                </div>

                {productForm.variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. Large / Hot"
                      value={v.name}
                      onChange={(e) => {
                        const copy = [...productForm.variants];
                        copy[i].name = e.target.value;
                        setProductForm({ ...productForm, variants: copy });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Penyesuaian Harga"
                      value={v.priceAdjustment}
                      onChange={(e) => {
                        const copy = [...productForm.variants];
                        copy[i].priceAdjustment = parseFloat(e.target.value) || 0;
                        setProductForm({ ...productForm, variants: copy });
                      }}
                      className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = productForm.variants.filter((_, idx) => idx !== i);
                        setProductForm({ ...productForm, variants: copy });
                      }}
                      className="p-2 text-rose-400 hover:bg-rose-950 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400 shadow-lg"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {categoryForm.id ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Milk Coffee"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Urutan Tampilan</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INGREDIENT MODAL */}
      {showIngredientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button onClick={() => setShowIngredientModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Biji Kopi Arabika"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Satuan Unit</label>
                  <select
                    value={ingredientForm.unit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="gram">gram</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Stok Minimum Alert</label>
                  <input
                    type="number"
                    required
                    value={ingredientForm.minimumStock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, minimumStock: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Harga Beli Per Unit (Rp)</label>
                  <input
                    type="number"
                    value={ingredientForm.purchasePrice}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={ingredientForm.supplier}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, supplier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                    placeholder="PT Kopi Nusantara"
                  />
                </div>
              </div>

              {!editingIngredient && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Stok Awal Saat Dibuat</label>
                  <input
                    type="number"
                    value={ingredientForm.initialStock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, initialStock: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIngredientModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400"
                >
                  Simpan Bahan Baku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK MOVEMENT MODAL */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Form Mutasi Stok</h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tipe Mutasi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'IN', label: 'Stock In (+)' },
                    { id: 'OUT', label: 'Usage (-)' },
                    { id: 'ADJUSTMENT', label: 'Adjustment (=)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setStockModalType(t.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${stockModalType === t.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Bahan Baku Target</label>
                <select
                  value={stockForm.ingredientId}
                  onChange={(e) => setStockForm({ ...stockForm, ingredientId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} (Stok Saat Ini: {ing.currentStock} {ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Jumlah (Amount)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={stockForm.amount}
                  onChange={(e) => setStockForm({ ...stockForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="Jumlah mutasi..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Catatan / Referensi</label>
                <textarea
                  rows={2}
                  value={stockForm.notes}
                  onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Alasan penyesuaian atau nomor PO supplier..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400"
                >
                  Proses Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTION MODAL */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <span>Buat Promosi / Diskon Baru</span>
              </h3>
              <button onClick={() => setShowPromoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Judul Promosi</label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none text-sm"
                  placeholder="Contoh: Diskon Mahasiswa Akhir Pekan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Deskripsi Promosi</label>
                <input
                  type="text"
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none text-sm"
                  placeholder="Keterangan singkat promo..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tipe Diskon</label>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED_AMOUNT">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Nilai Diskon ({promoForm.discountType === 'PERCENTAGE' ? '%' : 'Rp'})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Min. Belanja (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={promoForm.minPurchase}
                    onChange={(e) => setPromoForm({ ...promoForm, minPurchase: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none text-sm"
                    placeholder="0"
                  />
                </div>

                {promoForm.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Maks. Diskon (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={promoForm.maxDiscount}
                      onChange={(e) => setPromoForm({ ...promoForm, maxDiscount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none text-sm"
                      placeholder="10000"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Produk Spesifik</label>
                  <select
                    value={promoForm.productId}
                    onChange={(e) => setPromoForm({ ...promoForm, productId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Semua Produk</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Kategori Spesifik</label>
                  <select
                    value={promoForm.categoryId}
                    onChange={(e) => setPromoForm({ ...promoForm, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={promoForm.startDate}
                    onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={promoForm.endDate}
                    onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Batas Kuota Pemakaian</label>
                  <input
                    type="number"
                    min="1"
                    value={promoForm.usageLimit}
                    onChange={(e) => setPromoForm({ ...promoForm, usageLimit: parseInt(e.target.value, 10) || 100 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={promoForm.isActive}
                      onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>Langsung Aktifkan Promo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400"
                >
                  Simpan Promosi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOPPING MODAL */}
      {showToppingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>{toppingForm.id ? 'Edit Topping' : 'Tambah Topping Baru'}</span>
              </h3>
              <button onClick={() => setShowToppingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopping} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nama Topping</label>
                <input
                  type="text"
                  required
                  value={toppingForm.name}
                  onChange={(e) => setToppingForm({ ...toppingForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Extra Espresso Shot, Grass Jelly, Boba"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Harga Tambahan (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={500}
                  value={toppingForm.price}
                  onChange={(e) => setToppingForm({ ...toppingForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="3000"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="topAvailable"
                  checked={toppingForm.isAvailable}
                  onChange={(e) => setToppingForm({ ...toppingForm, isAvailable: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                />
                <label htmlFor="topAvailable" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  Topping Tersedia (Ready Stock)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowToppingModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400"
                >
                  Simpan Topping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOUCHER MODAL */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <span>{voucherForm.id ? 'Edit Voucher' : 'Buat Voucher Mahasiswa Baru'}</span>
              </h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Kode Voucher</label>
                <input
                  type="text"
                  required
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-bold tracking-wider focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. SKRIPSISANTAI, KOPIHEMAT"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tipe Diskon</label>
                  <select
                    value={voucherForm.discountType}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="FIXED">Nominal Tetap (Rp)</option>
                    <option value="PERCENTAGE">Persentase (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Nilai Diskon ({voucherForm.discountType === 'PERCENTAGE' ? '%' : 'Rp'})
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={voucherForm.discountAmount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Min. Belanja (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={voucherForm.minSpend}
                    onChange={(e) => setVoucherForm({ ...voucherForm, minSpend: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Kuota Pemakaian</label>
                  <input
                    type="number"
                    min={1}
                    value={voucherForm.quota}
                    onChange={(e) => setVoucherForm({ ...voucherForm, quota: parseInt(e.target.value, 10) || 100 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tanggal Kedaluwarsa</label>
                <input
                  type="date"
                  required
                  value={voucherForm.expiryDate}
                  onChange={(e) => setVoucherForm({ ...voucherForm, expiryDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="vouchActive"
                  checked={voucherForm.isActive}
                  onChange={(e) => setVoucherForm({ ...voucherForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500"
                />
                <label htmlFor="vouchActive" className="text-sm font-semibold text-slate-200 cursor-pointer">
                  Voucher Aktif
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-400"
                >
                  Simpan Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {deleteConfirm && deleteConfirm.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">{deleteConfirm.title}</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{deleteConfirm.message}</p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={deleteConfirm.onConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-600/30"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) Admin AI Assistant */}
      <AdminAIChat />
    </div>
  );
}
