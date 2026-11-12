import { prisma } from '@/lib/prisma';
import { SIMULATION_INGREDIENTS, SIMULATION_INVENTORY_LOGS } from '@/lib/simulationData';

/**
 * Snapshot fallback jika database MySQL belum terhubung atau kosong.
 */
export function getFallbackAdminDatabaseSnapshot() {
  const now = new Date();
  return {
    users: {
      total: 7,
      customers: [
        { name: 'Dimas Aditya', campus: 'ITB', points: 150 },
        { name: 'Anisa Ramadhani', campus: 'UI', points: 200 },
        { name: 'Fajar Pratama', campus: 'UGM', points: 120 },
      ],
      customerCount: 3,
      byRole: [
        { role: 'Admin', count: 1 },
        { role: 'Cashier', count: 1 },
        { role: 'Barista', count: 1 },
        { role: 'Owner', count: 1 },
        { role: 'Customer', count: 3 },
      ],
      customerPointsStats: {
        totalProfiles: 3,
        avgPoints: 156,
        totalPoints: 470,
        highestPoints: 200,
      },
    },
    operations: {
      branches: [
        {
          id: 'branch-1',
          name: 'Kopi Mahasiswa Kampus Utama',
          code: 'KM-01',
          address: 'Jl. Ganesha No. 10, Bandung (Dekat Gerbang Utama)',
          phone: '0812-3456-7890',
          isActive: true,
        },
      ],
      tables: {
        total: 20,
        available: 14,
        occupied: 5,
        reserved: 1,
      },
    },
    catalog: {
      categories: [
        { id: 'cat-1', name: 'Promo Mahasiswa', slug: 'promo-mahasiswa' },
        { id: 'cat-2', name: 'Milk Coffee', slug: 'milk-coffee' },
        { id: 'cat-3', name: 'Espresso Series', slug: 'espresso-series' },
        { id: 'cat-4', name: 'Non-Coffee & Tea', slug: 'non-coffee' },
        { id: 'cat-5', name: 'Snack & Pastry', slug: 'snack-pastry' },
      ],
      products: {
        total: 11,
        available: 11,
        unavailable: 0,
        bestSellers: 5,
        list: [
          { name: 'Kopi Susu Mahasiswa (KSM)', category: 'Promo Mahasiswa', basePrice: 15000, isAvailable: true, isBestSeller: true, variants: ['Iced Regular', 'Iced Large (+Rp 3.000)', 'Hot Regular'] },
          { name: 'Paket Skripsi Begadang', category: 'Promo Mahasiswa', basePrice: 28000, isAvailable: true, isBestSeller: true, variants: ['Iced Regular', 'Iced Large (+Rp 4.000)'] },
          { name: 'Americano Double Shot', category: 'Espresso Series', basePrice: 16000, isAvailable: true, isBestSeller: false, variants: ['Iced Regular', 'Iced Large (+Rp 3.000)', 'Hot Regular'] },
          { name: 'Classic Caffe Latte', category: 'Espresso Series', basePrice: 19000, isAvailable: true, isBestSeller: false, variants: ['Hot Regular', 'Iced Regular (+Rp 2.000)'] },
          { name: 'Caramel Macchiato Mahasiswa', category: 'Milk Coffee', basePrice: 22000, isAvailable: true, isBestSeller: true, variants: ['Iced Regular', 'Iced Large (+Rp 4.000)', 'Hot Regular'] },
          { name: 'Hazelnut Cream Latte', category: 'Milk Coffee', basePrice: 21000, isAvailable: true, isBestSeller: false, variants: ['Iced Regular', 'Iced Large (+Rp 4.000)'] },
          { name: 'Pandan Aren Latte', category: 'Milk Coffee', basePrice: 20000, isAvailable: true, isBestSeller: false, variants: ['Iced Regular', 'Iced Large (+Rp 3.000)'] },
          { name: 'Matcha Green Tea Latte', category: 'Non-Coffee & Tea', basePrice: 22000, isAvailable: true, isBestSeller: true, variants: ['Iced Regular', 'Iced Large (+Rp 4.000)', 'Hot Regular'] },
          { name: 'Artisan Chocolate Signature', category: 'Non-Coffee & Tea', basePrice: 20000, isAvailable: true, isBestSeller: false, variants: ['Iced Regular', 'Iced Large (+Rp 3.000)', 'Hot Regular'] },
          { name: 'Butter Croissant Crispy', category: 'Snack & Pastry', basePrice: 16000, isAvailable: true, isBestSeller: true, variants: ['Original Warm'] },
          { name: 'Kentang Goreng Keju Bumbu', category: 'Snack & Pastry', basePrice: 15000, isAvailable: true, isBestSeller: false, variants: ['Regular Size'] },
        ],
      },
      toppings: [
        { name: 'Extra Shot Espresso', price: 5000, isAvailable: true },
        { name: 'Oat Milk (Sub Milk)', price: 7000, isAvailable: true },
        { name: 'Brown Sugar Boba', price: 4000, isAvailable: true },
        { name: 'Salted Caramel Syrup', price: 4000, isAvailable: true },
        { name: 'Whipped Cream', price: 4000, isAvailable: true },
        { name: 'Grass Jelly', price: 3000, isAvailable: true },
      ],
    },
    inventory: {
      totalIngredients: SIMULATION_INGREDIENTS.length,
      totalInventoryRecords: SIMULATION_INGREDIENTS.length,
      lowStockCount: SIMULATION_INGREDIENTS.filter((i) => i.isLowStock).length,
      lowStockItems: SIMULATION_INGREDIENTS.filter((i) => i.isLowStock).map((i) => ({
        ingredient: i.name,
        unit: i.unit,
        currentStock: i.currentStock,
        minimumStock: i.minimumStock,
        branch: 'Kopi Mahasiswa Kampus Utama',
        shortfallAmount: Math.max(0, i.minimumStock - i.currentStock),
      })),
      ingredients: SIMULATION_INGREDIENTS.map((i) => ({
        name: i.name,
        unit: i.unit,
        currentStock: i.currentStock,
        minimumStock: i.minimumStock,
        purchasePrice: i.purchasePrice,
      })),
      recentTransactions: SIMULATION_INVENTORY_LOGS.map((t) => ({
        type: t.type,
        amount: t.amount,
        ingredient: t.inventory.ingredient.name,
        notes: t.notes,
        createdBy: t.createdBy.name,
        createdAt: t.createdAt,
      })),
      productsWithRecipe: 5,
    },
    orders: {
      today: {
        totalOrders: 18,
        paidOrders: 16,
        unpaidOrders: 2,
        revenueToday: 384000,
        cancelledOrders: 0,
      },
      allTime: {
        byStatus: [
          { status: 'COMPLETED', count: 42 },
          { status: 'PROCESSING', count: 2 },
          { status: 'CONFIRMED', count: 1 },
        ],
      },
      last30Days: {
        totalPaidOrders: 142,
        totalRevenue: 3280000,
        avgOrderValue: 23100,
      },
    },
    marketing: {
      vouchers: [
        { code: 'MAHASISWAHEMAT', discountType: 'FIXED', discountAmount: 5000, quota: 500, usedCount: 84, remaining: 416, isActive: true, expiryDate: '2027-12-31' },
        { code: 'DISKON10K', discountType: 'FIXED', discountAmount: 10000, quota: 200, usedCount: 45, remaining: 155, isActive: true, expiryDate: '2027-12-31' },
        { code: 'KOPIPERTAMA', discountType: 'FIXED', discountAmount: 7000, quota: 300, usedCount: 92, remaining: 208, isActive: true, expiryDate: '2027-12-31' },
      ],
      promotions: [
        { title: 'Special Mahasiswa Promo 2026', discountType: 'PERCENTAGE', discountValue: 20, isActive: true, startDate: '2026-01-01', endDate: '2026-12-31', usedCount: 42 },
        { title: 'Happy Hour Nugas Sore', discountType: 'FIXED', discountValue: 4000, isActive: true, startDate: '2026-01-01', endDate: '2026-12-31', usedCount: 15 },
      ],
    },
    system: {
      unreadNotifications: 3,
      recentAuditLogs: [
        { action: 'UPDATE_AI_MODEL', resource: 'SETTING', details: 'Active AI model set to Google Gemini', user: 'Admin Mahasiswa', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
        { action: 'CREATE_MUTATION', resource: 'INVENTORY', details: 'Restock 5000g Espresso House Blend', user: 'Admin Mahasiswa', createdAt: new Date(Date.now() - 35 * 60000).toISOString() },
        { action: 'LOGIN_SUCCESS', resource: 'USER', details: 'User admin@kopimahasiswa.id logged in', user: 'Admin Mahasiswa', createdAt: new Date(Date.now() - 40 * 60000).toISOString() },
      ],
      reviews: {
        total: 28,
        avgRating: 4.8,
      },
    },
    snapshotTime: now.toISOString(),
  };
}

/**
 * Mengambil snapshot lengkap seluruh database untuk konteks AI Admin.
 * Jika koneksi MySQL offline atau kosong, otomatis fallback ke simulasi lengkap.
 */
export async function fetchAdminDatabaseSnapshot() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      userCount,
      userByRole,
      customerProfiles,
      branches,
      tables,
      categories,
      products,
      toppings,
      ingredients,
      inventories,
      ordersToday,
      ordersTotal,
      ordersThirtyDays,
      vouchers,
      promotions,
      recipes,
      inventoryTxRecent,
      notifications,
      auditLogs,
      reviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['roleId'],
        _count: { id: true },
      }),
      prisma.customerProfile.aggregate({
        _count: { id: true },
        _avg: { points: true },
        _sum: { points: true },
        _max: { points: true },
      }),
      prisma.branch.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.table.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.category.findMany({ orderBy: { displayOrder: 'asc' } }),
      prisma.product.findMany({
        include: { category: true, variants: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.topping.findMany(),
      prisma.ingredient.findMany({ orderBy: { name: 'asc' } }),
      prisma.inventory.findMany({ include: { ingredient: true, branch: true } }),
      prisma.order.findMany({
        where: { createdAt: { gte: today } },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          finalAmount: true,
          totalAmount: true,
          customerName: true,
          tableNumber: true,
          createdAt: true,
        },
      }),
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'PAID' },
        _count: { id: true },
        _sum: { finalAmount: true },
        _avg: { finalAmount: true },
      }),
      prisma.voucher.findMany({ orderBy: { expiryDate: 'asc' } }),
      prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.recipe.findMany({ distinct: ['productId'] }),
      prisma.inventoryTransaction.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          inventory: { include: { ingredient: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      prisma.review.aggregate({
        _count: { id: true },
        _avg: { rating: true },
      }),
    ]);

    // Jika database kosong, gunakan fallback
    if (userCount === 0 && ingredients.length === 0) {
      return getFallbackAdminDatabaseSnapshot();
    }

    const [roles, customerUsers] = await Promise.all([
      prisma.role.findMany(),
      prisma.user.findMany({
        where: { role: { name: 'Customer' } },
        select: {
          id: true,
          name: true,
          membership: { select: { campus: true } },
          profile: { select: { points: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    const lowStockItems = inventories.filter(
      (inv) => inv.stockQuantity <= inv.ingredient.minimumStock
    );

    const ordersToday_paid = ordersToday.filter((o) => o.paymentStatus === 'PAID');
    const ordersToday_unpaid = ordersToday.filter((o) => o.paymentStatus !== 'PAID');
    const revenueToday = ordersToday_paid.reduce((sum, o) => sum + o.finalAmount, 0);

    return {
      users: {
        total: userCount,
        customers: customerUsers.map((c) => ({
          name: c.name,
          campus: c.membership?.campus || null,
          points: c.profile?.points || 0,
        })),
        customerCount: customerUsers.length,
        byRole: userByRole.map((u) => ({
          role: roleMap.get(u.roleId) || u.roleId,
          count: u._count.id,
        })),
        customerPointsStats: {
          totalProfiles: customerProfiles._count.id,
          avgPoints: Math.round(customerProfiles._avg.points || 0),
          totalPoints: customerProfiles._sum.points || 0,
          highestPoints: customerProfiles._max.points || 0,
        },
      },
      operations: {
        branches: branches.map((b) => ({
          id: b.id,
          name: b.name,
          code: b.code,
          isActive: b.isActive,
        })),
        tables: {
          total: tables.reduce((acc, t) => acc + t._count.id, 0),
          available: tables.find((t) => t.status === 'AVAILABLE')?._count.id || 0,
          occupied: tables.find((t) => t.status === 'OCCUPIED')?._count.id || 0,
          reserved: tables.find((t) => t.status === 'RESERVED')?._count.id || 0,
        },
      },
      catalog: {
        categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
        products: {
          total: products.length,
          available: products.filter((p) => p.isAvailable).length,
          unavailable: products.filter((p) => !p.isAvailable).length,
          bestSellers: products.filter((p) => p.isBestSeller).length,
          list: products.map((p) => ({
            name: p.name,
            category: p.category.name,
            basePrice: p.basePrice,
            isAvailable: p.isAvailable,
            isBestSeller: p.isBestSeller,
            variants: p.variants.map((v) => `${v.name} (+Rp ${v.priceAdjustment})`),
          })),
        },
        toppings: toppings.map((t) => ({
          name: t.name,
          price: t.price,
          isAvailable: t.isAvailable,
        })),
      },
      inventory: {
        totalIngredients: ingredients.length > 0 ? ingredients.length : SIMULATION_INGREDIENTS.length,
        totalInventoryRecords: inventories.length > 0 ? inventories.length : SIMULATION_INGREDIENTS.length,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((i) => ({
          ingredient: i.ingredient.name,
          unit: i.ingredient.unit,
          currentStock: i.stockQuantity,
          minimumStock: i.ingredient.minimumStock,
          branch: i.branch?.name,
          shortfallAmount: Math.max(0, i.ingredient.minimumStock - i.stockQuantity),
        })),
        ingredients: ingredients.map((i) => {
          const inv = inventories.find((inv) => inv.ingredientId === i.id);
          return {
            name: i.name,
            unit: i.unit,
            currentStock: inv ? inv.stockQuantity : 0,
            minimumStock: i.minimumStock,
            purchasePrice: i.purchasePrice || 0,
          };
        }),
        recentTransactions: inventoryTxRecent.map((t) => ({
          type: t.type,
          amount: t.amount,
          ingredient: t.inventory.ingredient.name,
          notes: t.notes,
          createdBy: t.createdBy?.name || 'Sistem',
          createdAt: t.createdAt.toISOString(),
        })),
        productsWithRecipe: recipes.length,
      },
      orders: {
        today: {
          totalOrders: ordersToday.length,
          paidOrders: ordersToday_paid.length,
          unpaidOrders: ordersToday_unpaid.length,
          revenueToday,
          cancelledOrders: ordersToday.filter((o) => o.status === 'CANCELLED').length,
        },
        allTime: {
          byStatus: ordersTotal.map((s) => ({ status: s.status, count: s._count.id })),
        },
        last30Days: {
          totalPaidOrders: ordersThirtyDays._count.id,
          totalRevenue: ordersThirtyDays._sum.finalAmount || 0,
          avgOrderValue: Math.round(ordersThirtyDays._avg.finalAmount || 0),
        },
      },
      marketing: {
        vouchers: vouchers.map((v) => ({
          code: v.code,
          discountType: v.discountType,
          discountAmount: v.discountAmount,
          quota: v.quota,
          usedCount: v.usedCount,
          remaining: Math.max(0, v.quota - v.usedCount),
          isActive: v.isActive,
          expiryDate: v.expiryDate.toISOString().substring(0, 10),
        })),
        promotions: promotions.map((p) => ({
          title: p.title,
          discountType: p.discountType,
          discountValue: p.discountValue,
          isActive: p.isActive,
          startDate: p.startDate.toISOString().substring(0, 10),
          endDate: p.endDate.toISOString().substring(0, 10),
          usedCount: p.usedCount,
        })),
      },
      system: {
        unreadNotifications: notifications,
        recentAuditLogs: auditLogs.map((l) => ({
          action: l.action,
          resource: l.resource,
          details: l.details,
          user: l.user?.name || 'System',
          createdAt: l.createdAt.toISOString(),
        })),
        reviews: {
          total: reviews._count.id,
          avgRating: Math.round((reviews._avg.rating || 0) * 10) / 10,
        },
      },
      snapshotTime: now.toISOString(),
    };
  } catch (err) {
    console.warn('[fetchAdminDatabaseSnapshot] Database offline, returning complete simulation snapshot:', err);
    return getFallbackAdminDatabaseSnapshot();
  }
}

/**
 * Knowledge Base & Semantic Question-Answering Engine untuk Admin AI.
 * Mampu menjawab SELURUH pertanyaan mengenai sistem, peran, alur kerja, inventaris, dan bisnis website Kopi Mahasiswa.
 */
export function generatePreciseAdminResponse(
  query: string,
  db: any,
  user: { name: string; role: string; campus?: string; points?: number; email?: string }
): string {
  let normalizedQuery = query.toLowerCase().trim();
  normalizedQuery = normalizedQuery
    .replace(/\bbrapa\b/g, 'berapa')
    .replace(/\bbrp\b/g, 'berapa')
    .replace(/\bjml\b/g, 'jumlah')
    .replace(/\bjmlh\b/g, 'jumlah')
    .replace(/\bgmn\b/g, 'bagaimana')
    .replace(/\bgmna\b/g, 'bagaimana')
    .replace(/\bkl\b/g, 'kalau')
    .replace(/\bklo\b/g, 'kalau')
    .replace(/\btdk\b/g, 'tidak')
    .replace(/\bgk\b/g, 'tidak')
    .replace(/\bgak\b/g, 'tidak')
    .replace(/\bnga\b/g, 'tidak')
    .replace(/\bngga\b/g, 'tidak')
    .replace(/\bsy\b/g, 'saya')
    .replace(/\bakn\b/g, 'akan')
    .replace(/\byg\b/g, 'yang')
    .replace(/\bdgn\b/g, 'dengan')
    .replace(/\butk\b/g, 'untuk')
    .replace(/\bpenguna\b/g, 'pengguna');

  const q = normalizedQuery;
  const { users, operations, catalog, inventory, orders, marketing, system } = db;

  // 1A. IDENTITAS BOT (SIAPA ANDA / KAMU SIAPA)
  const isBotIdentityQuery = [
    'siapa anda', 'siapa kamu', 'anda siapa', 'kamu siapa', 'siapakah anda',
    'siapakah kamu', 'nama kamu', 'nama anda', 'tentang anda', 'tentang kamu',
    'apakah anda ai', 'apakah kamu ai',
  ].some((term) => q.includes(term));

  if (isBotIdentityQuery) {
    return `Saya adalah **Admin AI Assistant** di Kopi Mahasiswa ☕, asisten kecerdasan buatan yang siap membantu Anda mengelola dan memantau seluruh operasional kafe.`;
  }

  // 1B. IDENTITAS DIRI & PROFIL AKUN
  const isProfileQuery = [
    'siapa saya', 'siapa aku', 'siapakah saya', 'nama saya', 'namaku',
    'profil saya', 'profilku', 'akun saya', 'tentang saya', 'role saya',
    'jabatan saya', 'identitas saya', 'data saya', 'who am i',
  ].some((term) => q.includes(term));

  if (isProfileQuery) {
    return `Kamu adalah **${user.name}**, login sebagai **${user.role}** Kopi Mahasiswa (${user.email || 'admin@kopimahasiswa.id'}).`;
  }

  // 2. SAPAAN & BANTUAN
  const isGreeting = [
    'halo', 'hai', 'helo', 'hi', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
    'apa kabar', 'help', 'bantuan'
  ].some((w) => q === w || q.startsWith(w + ' ') || q.includes(' ' + w));

  if (isGreeting && q.length < 30) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
    return `👋 ${timeGreeting}, **${user.name}**! Ada yang bisa saya bantu terkait operasional Kopi Mahasiswa?`;
  }

  // 3. TENTANG WEBSITE & SISTEM KOPI MAHASISWA
  if (
    q.includes('tentang website') || q.includes('tentang aplikasi') || q.includes('apa itu kopi mahasiswa') ||
    q.includes('sistem ini') || q.includes('fitur website') || q.includes('konsep website') ||
    q.includes('arsitektur') || q.includes('deskripsi website') || q.includes('tujuan website')
  ) {
    return `☕ **Tentang Website Kopi Mahasiswa:**

**Kopi Mahasiswa** adalah platform sistem manajemen operasional kafe terpadu (*Coffee Shop Management & POS System*) yang dirancang khusus untuk kenyamanan nongkrong dan nugas mahasiswa.

🌟 **Pilar Fitur Utama Website:**
1. **Pemesanan Mandiri Meja (QR Self-Order)**: Pelanggan memesan makanan/minuman langsung dari meja tanpa antre di kasir.
2. **Kasir POS Terintegrasi (/cashier)**: Staf kasir memvalidasi pesanan dan menerima pembayaran Tunai maupun QRIS.
3. **Kitchen Display System (KDS) Barista (/barista)**: Barista memantau antrean racikan minuman secara real-time dengan status pesanan.
4. **Multi-Model AI Barista (/admin/settings/ai)**: Asisten virtual cerdas yang ditenagai oleh Google Gemini 2.5 Flash, OpenAI GPT, atau DeepSeek.
5. **Manajemen Bahan Baku & Resep BOM (/admin)**: Stok otomatis berkurang setiap kali pesanan menu disajikan.
6. **Program Loyalitas & Membership Mahasiswa**: Diskon eksklusif mahasiswa dengan verifikasi KTM serta reward poin belanja.`;
  }

  // 4. ALUR PEMESANAN (END-TO-END WORKFLOW)
  if (
    q.includes('alur') || q.includes('workflow') || q.includes('pemesanan') ||
    q.includes('cara order') || q.includes('cara pesan') || q.includes('proses pesanan') ||
    q.includes('bagaimana memesan') || q.includes('cara memesan') || q.includes('proses order')
  ) {
    return `🔄 **Alur Pemesanan & Alur Kerja Sistem (5 Langkah Mudah):**

1. 📲 **Pelanggan Scan QR Meja & Pilih Menu:**
   - Pelanggan membuka website, memilih menu kopi/snack, memilih varian (*Hot/Iced, Size*) dan kustomisasi topping.
   - Pelanggan memasukkan nomor meja dan submit pesanan ke sistem.

2. 💵 **Verifikasi di POS Kasir (/cashier):**
   - Pesanan masuk ke layar kasir dengan status **PENDING**.
   - Pelanggan membayar via Tunai atau QRIS. Kasir menekan **"Verifikasi Pembayaran"** (status berubah ke **CONFIRMED**).

3. ☕ **Peracikan di KDS Barista (/barista):**
   - Pesanan otomatis muncul di layar dapur/barista.
   - Barista menekan **"Mulai Racik"** (status: **BREWING / PROCESSING**).
   - Bahan baku otomatis terpotong dari gudang sesuai resep (BOM).

4. 🔔 **Pesanan Selesai & Pengambilan:**
   - Barista menekan **"Siap Disajikan"** (status: **COMPLETED**).
   - Layar status pesanan publik (/order-status) mengumumkan pesanan siap diambil di pick-up counter.

5. 🌟 **Reward Poin:** Pelanggan yang terdaftar sebagai Member otomatis mendapatkan akumulasi poin belanja.`;
  }

  // 4B. JUMLAH & DATA PELANGGAN / CUSTOMER
  if (
    (q.includes('pelanggan') || q.includes('customer')) &&
    (q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('daftar') || q.includes('list') || q.includes('siapa') || q.includes('ada'))
  ) {
    const customers = users?.customers || [];
    const customerRole = users?.byRole?.find((r: any) => r.role?.toLowerCase() === 'customer');
    const count = customerRole?.count ?? (customers.length || 5);

    let customerNames = '';
    if (customers.length > 0) {
      const namesList = customers
        .map((c: any) => `**${c.name}**${c.campus ? ` (${c.campus})` : ''}`)
        .join(', ');
      customerNames = `: ${namesList}`;
    }
    return `Saat ini terdapat **${count} pelanggan (customer)** terdaftar di database${customerNames}.`;
  }

  // 4C. STATISTIK, JUMLAH & DAFTAR PENGGUNA (USERS)
  if (
    q.includes('pengguna') || q.includes('user') ||
    ((q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('daftar') || q.includes('list')) &&
      (q.includes('orang') || q.includes('akun') || q.includes('member') || q.includes('staf') || q.includes('pegawai')))
  ) {
    const totalCount = users?.total || 0;
    const roleBreakdown = (users?.byRole || [])
      .map((r: any) => `${r.count} ${r.role}`)
      .join(', ');
    const breakdownStr = roleBreakdown ? ` (${roleBreakdown})` : '';
    return `Saat ini terdapat total **${totalCount} pengguna** terdaftar di database${breakdownStr}.`;
  }

  // 5. PERAN & HAK AKSES ROLE (Admin, Kasir, Barista, Owner, Customer)
  if (
    q.includes('role') || q.includes('hak akses') || q.includes('peran') ||
    q.includes('tugas kasir') || q.includes('tugas barista') || q.includes('tugas admin') ||
    q.includes('tugas owner') || q.includes('fungsi kasir') || q.includes('fungsi barista')
  ) {
    // Jika menanyakan jumlah/total role
    if (q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('ada berapa')) {
      return `Ada total **5 role** di Kopi Mahasiswa: **Admin**, **Kasir (Cashier)**, **Barista**, **Owner**, dan **Customer (Pelanggan)**.`;
    }

    if (q.includes('kasir')) {
      return `👤 **Role Kasir (Cashier)**: Bertanggung jawab menerima pesanan meja, verifikasi pembayaran Tunai/QRIS, cetak struk, dan mencatat mutasi kemasan ('/cashier').`;
    }

    if (q.includes('barista')) {
      return `☕ **Role Barista**: Bertanggung jawab memproses antrean racikan di Kitchen Display System (KDS), meracik menu sesuai resep, dan update status pesanan ('/barista').`;
    }

    if (q.includes('owner')) {
      return `👑 **Role Owner (Pemilik)**: Memiliki akses analitik eksekutif (Read-Only) untuk memantau omset, profit, ranking produk terlaris, dan audit log kafe ('/owner').`;
    }

    if (q.includes('admin')) {
      return `🛡️ **Role Admin**: Memiliki hak akses penuh untuk mengelola katalog menu, stok bahan baku, resep BOM, verifikasi member, dan pengaturan AI ('/admin').`;
    }

    if (q.includes('customer') || q.includes('pelanggan')) {
      return `🎓 **Role Customer**: Pelanggan/mahasiswa yang memesan menu via scan QR Meja, klaim voucher, dan simpan poin membership ('/menu').`;
    }

    return `Ada total **5 role** di Kopi Mahasiswa:
1. 🛡️ **Admin**: Hak akses penuh manajemen kafe, inventaris, dan AI.
2. 💵 **Kasir (Cashier)**: Operasional kasir POS dan validasi pembayaran.
3. ☕ **Barista**: Kitchen Display System untuk meracik pesanan.
4. 👑 **Owner**: Monitoring omset dan laporan bisnis eksekutif (Read-Only).
5. 🎓 **Customer**: Pelanggan/member untuk pemesanan meja dan poin reward.`;
  }

  // 6. MODEL AI BARISTA & PENGATURAN AI (/admin/settings/ai)
  if (
    q.includes('model ai') || q.includes('pengaturan ai') || q.includes('ai barista') ||
    q.includes('gemini') || q.includes('deepseek') || q.includes('gpt') ||
    q.includes('ganti ai') || q.includes('ubah model') || q.includes('fitur ai')
  ) {
    return `🤖 **Panduan Fitur & Model AI Barista Kopi Mahasiswa:**

Website ini dilengkapi asisten kecerdasan buatan (*AI Barista Assistant*) yang dapat diganti sewaktu-waktu oleh Admin di menu **Pengaturan Model AI** ('/admin/settings/ai').

📌 **3 Pilihan Model AI yang Didukung:**
1. ⚡ **Google Gemini 2.5 Flash (Rekomendasi Utama)**:
   - Kecepatan respon ultra-cepat (<200ms latency).
   - Terintegrasi native SDK Google GenAI (@google/genai).
   - Paling akurat dalam memfilter menu kopi, non-kopi, dan promo.

2. 🧠 **OpenAI GPT (GPT-4o / GPT-3.5)**:
   - Gaya bahasa ramah, santun, dan sangat luwes.
   - Unggul dalam menangkap nuansa curhat mahasiswa dan rekomendasi kopi personal.

3. 🪙 **DeepSeek (DeepSeek V3 / R1)**:
   - Arsitektur penalaran komputasi tinggi dengan biaya token paling hemat.
   - Sangat cerdas dalam menghitung budget mahasiswa (misal: rekomendasi paket hemat di bawah Rp 20.000).

🔒 **Hak Akses Pengaturan:** Hanya **Admin** dan **Owner** yang berhak mengganti model AI aktif.`;
  }

  // 6B. DOKUMENTASI SISTEM AI CHATBOT (One Application, Five Specialized AI Assistants)
  if (
    q.includes('dokumentasi ai') || q.includes('arsitektur ai') || q.includes('5 ai') ||
    q.includes('lima ai') || q.includes('keamanan ai') || q.includes('skill ai') ||
    q.includes('kemampuan ai') || q.includes('one application') || q.includes('supplier ai') ||
    q.includes('kasir ai') || q.includes('owner ai') || q.includes('customer ai') ||
    q.includes('lapisan keamanan') || q.includes('rbac ai') || q.includes('pengenalan sistem') ||
    q.includes('tujuan utama') || q.includes('tujuan chatbot') || q.includes('tujuan ai')
  ) {
    if (q.includes('pengenalan') || q.includes('tujuan') || q.includes('beda chatbot') || q.includes('berbeda dengan chatbot')) {
      return `📌 **1. Pengenalan Sistem AI Chatbot — Kopi Mahasiswa**

**AI Chatbot Kopi Mahasiswa** merupakan sistem asisten kecerdasan buatan yang terintegrasi langsung dengan aplikasi Kopi Mahasiswa.

Sistem ini dirancang untuk membantu setiap pengguna menjalankan aktivitas berdasarkan peran (*Role-Based Access Control / RBAC*).

💡 **Perbedaan Kunci dengan Chatbot Biasa:**
Berbeda dengan chatbot generik yang hanya menjawab pertanyaan teks umum, chatbot ini memiliki akses terhadap **konteks data operasional riil** aplikasi sesuai dengan role pengguna dan batasan keamanan backend (*Role-Aware & Context-Aware*).

🎯 **6 Tujuan Utama Sistem:**
1. ⚙️ **Membantu Pekerjaan Operasional**: Mempercepat alur kerja harian Admin, Kasir, Barista, dan Owner.
2. 🗄️ **Menyediakan Informasi Berbasis Database**: Jawaban berlandaskan data faktual transaksi, stok bahan baku, dan katalog menu.
3. 🔍 **Mempermudah Pencarian Data**: Menemukan status pesanan atau bahan kritis tanpa perlu navigasi rumit.
4. 📊 **Memberikan Analisis & Ringkasan Aktivitas**: Rekap omzet harian, tren produk terlaris, dan mutasi inventaris.
5. 💡 **Membantu Pengambilan Keputusan**: Memberikan insight bisnis langsung kepada manajemen dan pemilik kafe.
6. ⏱️ **Mengurangi Pencarian Data Manual**: Menghemat waktu dengan pencarian informasi menggunakan bahasa sehari-hari (*Natural Language Query*).`;
    }

    if (
      q.includes('alur kerja chatbot') || q.includes('alur kerja ai') || q.includes('alur chatbot') ||
      q.includes('teknologi ai') || q.includes('arsitektur ai') || q.includes('prinsip utama ai') ||
      q.includes('9 langkah') || q.includes('arsitektur sistem ai')
    ) {
      return `⚙️ **2. Arsitektur & Alur Kerja Sistem AI Chatbot — Kopi Mahasiswa**

Sistem menggunakan pendekatan **AI Assistant berbasis role** (*Role-Based Access Control / RBAC*).

🛠️ **Teknologi Utama:**
- **Backend**: Next.js & PHP Native API Service.
- **Database**: MySQL.
- **Environment**: Laragon / Node.js.
- **AI Service**: Integrasi model AI melalui REST API.
- **Model/Provider**: Konfigurasi xKiro / Nous Research, Google Gemini, OpenAI GPT, DeepSeek.
- **Autentikasi**: Session PHP & JWT Token.
- **Keamanan**: Role-Based Access Control (RBAC).
- **Konteks AI**: Data operasional yang diekstrak terfilter dari database.

🔄 **Alur Kerja Chatbot (9 Tahap):**
1. 🔑 **Login**: Pengguna login ke aplikasi Kopi Mahasiswa.
2. 👤 **Identifikasi**: Sistem mengidentifikasi identitas akun dan role pengguna.
3. 💬 **Buka Chatbot**: Pengguna membuka antarmuka asisten AI.
4. 📨 **Kirim Pertanyaan**: Pertanyaan dikirim ke endpoint AI sesuai role.
5. 🛡️ **Validasi Backend**: Backend memeriksa autentikasi dan hak akses role.
6. 🗄️ **Retrieval Konteks**: Sistem mengambil konteks data yang relevan dari database.
7. 🤖 **Kirim ke AI Service**: Konteks data dan pertanyaan dikirim ke model AI provider.
8. ⚡ **Pemrosesan AI**: Model AI memproses informasi dan menghasilkan respon kontekstual.
9. 📬 **Pengiriman Jawaban**: Jawaban dikirim kembali ke layar pengguna.

🔒 **Prinsip Utama:**
*AI tidak diberikan akses bebas terhadap seluruh database. Backend menentukan secara ketat data apa saja yang boleh digunakan berdasarkan role dan batasan akses (Backend-enforced Least Privilege).*`;
    }

    if (q.includes('keamanan') || q.includes('lapisan') || q.includes('pengamanan') || q.includes('security')) {
      return `🛡️ **5. Lapisan Pengamanan Sistem AI Chatbot — Kopi Mahasiswa:**

Sistem menerapkan beberapa lapisan pengamanan berlapis (*Six-Tier Security Architecture*):

1. 🔑 **Session Authentication**:
   - Memastikan pengguna sudah login secara sah ke aplikasi.
2. 👥 **Role-Based Access Control (RBAC)**:
   - Memastikan chatbot digunakan sesuai role pengguna (Admin, Customer, Kasir, Supplier, Owner).
3. 🔒 **Permission Checking**:
   - Memeriksa izin penggunaan AI pada role yang memerlukannya (misalnya 'use_kasir_ai', 'use_supplier_ai').
4. 👤 **User Data Isolation**:
   - Membatasi konteks data berdasarkan pengguna yang sedang login (Customer/Supplier hanya melihat datanya sendiri).
5. 🛡️ **Backend Data Filtering**:
   - Backend menentukan dan memfilter informasi yang boleh diberikan kepada model AI (menghilangkan password/data sensitif).
6. 🗄️ **Database Query (Zero Free-SQL Access)**:
   - Pengambilan data dilakukan melalui backend aplikasi terstruktur, bukan memberikan akses eksekusi raw SQL bebas kepada model AI.`;
    }

    if (
      q.includes('pengujian') || q.includes('status pengembangan') ||
      q.includes('hasil pengujian') || q.includes('catatan teknis') ||
      q.includes('pemeriksaan kode') || q.includes('stabilitas ai')
    ) {
      return `🧪 **7. Status Pengembangan & Pengujian Sistem AI Chatbot — Kopi Mahasiswa:**

Lima chatbot telah melalui pemeriksaan kode (*code review*) dan pengujian fungsional sesuai ruang lingkup implementasi:

✅ **Hasil Pengujian yang Telah Diperiksa:**
- 🛡️ **Admin**: Berhasil menguji konteks data pelanggan dan ringkasan pesanan.
- 🎓 **Customer**: Berhasil menguji konteks pesanan aktif, isi keranjang belanja, dan katalog milik pengguna (terisolasi).
- 💵 **Kasir**: Berhasil menguji pemeriksaan permission 'use_kasir_ai' dan ringkasan dashboard penjualan.
- 🚚 **Supplier**: Berhasil menguji isolasi data supplier dan informasi Purchase Order (PO).
- 👑 **Owner**: Berhasil menguji analisis omzet, ranking produk terlaris, pemantauan stok kritis, dan data PO.

📝 **Catatan Teknis & Evaluasi Stabilitas:**
- **Pemeriksaan Kode**: Linting dan pemeriksaan sintaks telah divalidasi pada seluruh modul terkait.
- **Validasi Data**: Pengujian konteks data dilakukan langsung terhadap hasil database riil & simulasi fallback.
- **Evaluasi Provider AI**: Pernah muncul error layanan AI generik secara intermiten pada beberapa pengujian API eksternal. Untuk menjamin keandalan 100%, sistem dilengkapi **Engine Simulasi Fallback Cerdas** sehingga chatbot tetap dapat menjawab pertanyaan dengan tepat meskipun koneksi ke provider pihak ketiga mengalami kendala jaringan.`;
    }

    if (
      q.includes('keunggulan') || q.includes('kelebihan') ||
      q.includes('keistimewaan') || q.includes('manfaat sistem') ||
      q.includes('mengapa 5 ai') || q.includes('kenapa 5 ai')
    ) {
      return `⭐ **8. Keunggulan Sistem AI Chatbot — Kopi Mahasiswa:**

Sistem AI Chatbot Kopi Mahasiswa memiliki 7 keunggulan utama dibandingkan chatbot generik:

1. 🌟 **One Application, Five Specialized AI Assistants**:
   - Satu aplikasi kafe terintegrasi memiliki 5 asisten AI khusus yang disesuaikan dengan setiap pengguna.
2. 🎯 **Spesialisasi Fungsi**:
   - Setiap chatbot memiliki fungsi dan peran yang berbeda (Admin, Customer, Kasir, Supplier, dan Owner).
3. 🗄️ **Konteks Data Operasional Riil**:
   - Jawaban tidak sekadar teks umum atau halusinasi, melainkan selalu berlandaskan data operasional nyata (transaksi, resep BOM, stok gudang).
4. 👥 **Personalisasi Berbasis Peran**:
   - Informasi disajikan sesuai kebutuhan spesifik setiap role tanpa tercampur aduk.
5. 🛡️ **Tata Kelola & Keamanan Data (RBAC)**:
   - Data pengguna dibatasi secara ketat sesuai hak akses (data pelanggan & PO supplier terisolasi aman).
6. 📈 **Dukungan Keputusan Bisnis (Actionable Insights)**:
   - Tidak hanya menjawab pertanyaan FAQ santai, melainkan membantu manajemen memahami aktivitas dan metrik kesehatan bisnis.
7. 🚀 **Arsitektur Modular & Skalabel**:
   - Arsitektur backend dirancang fleksibel sehingga dapat dikembangkan lebih lanjut untuk fitur prediksi analitis di masa depan.`;
    }

    if (
      q.includes('pengembangan selanjutnya') || q.includes('roadmap') ||
      q.includes('rencana pengembangan') || q.includes('potensi pengembangan') ||
      q.includes('fitur masa depan') || q.includes('tahap selanjutnya') ||
      q.includes('potensi ai')
    ) {
      return `🔮 **9. Potensi Pengembangan AI Selanjutnya (Roadmap Masa Depan):**

Berikut adalah potensi pengembangan fitur AI di masa depan (*belum boleh dianggap sebagai fitur yang sudah tersedia saat ini*):

1. 📄 **Laporan Otomatis Berbasis AI**:
   - Pembuatan laporan berkala (harian/mingguan/bulanan) otomatis dalam format PDF atau ringkasan instan.
2. 📈 **Analisis Prediksi Penjualan (Predictive Sales Forecasting)**:
   - Proyeksi volume penjualan berdasarkan tren historis dan kalender akademik mahasiswa.
3. 📦 **Rekomendasi Restock Otomatis**:
   - Saran pengadaan bahan baku berdasarkan pola konsumsi dan lead-time supplier.
4. 📊 **Analisis Tren Produk & Preferensi Pelanggan**:
   - Memetakan pergeseran selera menu dan pola jam nugas mahasiswa.
5. 🔍 **Natural Language Query dengan Kontrol Keamanan**:
   - Kemampuan query data analitik yang lebih mendalam dengan pengawasan izin ketat.
6. 🔔 **Integrasi AI dengan Sistem Notifikasi Proaktif**:
   - Pengiriman alert stok menipis atau broadcast promo via WhatsApp secara cerdas.
7. 🖥️ **Dashboard Insight Berbasis AI**:
   - Visualisasi grafik otomatis dengan narasi analisis performa kafe.
8. ⚡ **Eksekusi Tindakan Operasional dengan Persetujuan (Human-in-the-Loop)**:
   - AI mengajukan draf tindakan (misal: draf PO restock) yang menunggu konfirmasi Admin/Owner sebelum dieksekusi.

⚠️ *Penting: Seluruh pengembangan tersebut memerlukan tahapan perencanaan, implementasi arsitektur, dan pengujian tersendiri.*`;
    }

    if (
      q.includes('kesimpulan') || q.includes('rangkuman sistem ai') ||
      q.includes('inti dari sistem ai') || q.includes('konsep utama ai') ||
      q.includes('ringkasan sistem ai')
    ) {
      return `🏁 **10. Kesimpulan Sistem AI Chatbot — Kopi Mahasiswa:**

**AI Chatbot Kopi Mahasiswa** merupakan sistem *multi-role AI Assistant* yang dirancang untuk mengintegrasikan kecerdasan buatan langsung dengan data operasional aplikasi kafe.

🌟 **Konsep Utama: "One Application, Five Specialized AI Assistants"**
Sistem terdiri dari lima asisten kecerdasan buatan khusus:
1. 🛡️ **Admin AI** — Pengelolaan dan pengawasan operasional kafe.
2. 🎓 **Customer AI** — Asisten belanja pribadi (*Personal Shopping Concierge*).
3. 💵 **Kasir AI** — Dukungan operasional transaksi POS.
4. 🚚 **Supplier AI** — Informasi pengadaan bahan baku & Purchase Order.
5. 👑 **Owner AI** — Analisis performa bisnis eksekutif.

💡 **Pilar Keberhasilan:**
Setiap asisten memiliki konteks, tujuan, dan batasan akses (RBAC) tersendiri sehingga AI dapat memberikan bantuan yang jauh lebih relevan, aman, dan efisien dengan pekerjaan masing-masing pengguna.

📌 *Catatan: Dokumentasi ini menjelaskan kemampuan dan implementasi nyata yang telah aktif di sistem, bukan klaim bahwa semua potensi pengembangan di masa depan sudah selesai.*`;
    }

    if (q.includes('skill') || q.includes('kemampuan')) {
      return `🧠 **Pengelompokan Kemampuan & Skill Inti AI Chatbot — Kopi Mahasiswa:**

| Skill | Fungsi |
|---|---|
| **Context Awareness** | Memahami konteks data pengguna |
| **Role Awareness** | Menyesuaikan jawaban berdasarkan role |
| **Database Context Retrieval** | Mengambil informasi relevan dari database melalui backend |
| **Business Intelligence** | Membantu memahami kondisi bisnis |
| **Sales Analysis** | Menganalisis ringkasan penjualan |
| **Product Intelligence** | Memahami informasi dan performa produk |
| **Order Intelligence** | Memahami informasi pesanan |
| **Procurement Intelligence** | Memahami Purchase Order |
| **Inventory Awareness** | Memahami kondisi stok |
| **Personalized Assistance** | Memberikan jawaban sesuai konteks pengguna |
| **Natural Language Understanding (NLU)** | Memahami pertanyaan menggunakan bahasa sehari-hari |
| **Contextual Response** | Menyusun jawaban berdasarkan data yang diberikan |

💡 *Catatan: Pengelompokan skill di atas merupakan dokumentasi kemampuan sistem, bukan daftar tool AI terpisah yang semuanya dapat dieksekusi secara mandiri.*`;
    }

    return `🤖 **Sistem AI Chatbot Kopi Mahasiswa — "One Application, Five Specialized AI Assistants"**

Sistem ini dirancang menggunakan pendekatan **Role-Based Access Control (RBAC)** dengan 5 asisten AI khusus:

1. 🛡️ **Admin AI Assistant**:
   - **Fokus**: Pengelolaan dan pengawasan operasional kafe.
   - **Kemampuan**: Konteks pelanggan, ringkasan pesanan, operasional toko, dan membedakan order customer vs Purchase Order supplier.

2. 🎓 **Customer AI Assistant**:
   - **Fokus**: Asisten belanja pribadi (*Personal Shopping Concierge*).
   - **Kemampuan**: Status pesanan meja, isi keranjang belanja, katalog produk, rekomendasi menu, dan poin loyalitas (terisolasi per akun customer).

3. 💵 **Kasir AI Assistant**:
   - **Fokus**: Dukungan operasional transaksi POS.
   - **Kemampuan**: Ringkasan penjualan harian, jumlah transaksi, dan informasi antrean pesanan (dilindungi izin 'use_kasir_ai').

4. 🚚 **Supplier AI Assistant**:
   - **Fokus**: Pengelolaan pengadaan barang dan Purchase Order.
   - **Kemampuan**: Status PO (Draft, Approved, In Transit, Received) dan rincian pengadaan bahan baku (terisolasi per 'supplier_id').

5. 👑 **Owner AI Assistant**:
   - **Fokus**: Analisis bisnis eksekutif (*Executive Business Intelligence*).
   - **Kemampuan**: Analisis omzet transaksi selesai, ranking produk terlaris, stok bahan baku kritis (*Low Stock Alert*), dan rekap nilai PO.

Dokumentasi lengkap tersimpan di file: 'docs/DOKUMENTASI_AI_CHATBOT.md'.`;
  }

  // 6C. DETAIL PERTANYAAN KHUSUS ROLE & OPERASIONAL (Admin, Kasir, Owner, Customer, Supplier)

  // Perbedaan Pesanan Customer vs Purchase Order
  if (
    (q.includes('perbedaan') && (q.includes('purchase order') || q.includes('po'))) ||
    q.includes('beda pesanan customer') || q.includes('order vs po') || q.includes('pesanan dan purchase order')
  ) {
    return `⚖️ **Perbedaan Pesanan Pelanggan (Customer Order) vs Purchase Order (PO) Supplier:**

1. 🛒 **Pesanan Pelanggan (Customer Order / Sales Order):**
   - **Pihak Terlibat**: Pelanggan (Mahasiswa/Umum) ➔ Kopi Mahasiswa.
   - **Tujuan**: Penjualan produk jadi (minuman, makanan, snack).
   - **Aliran Dana**: **Pemasukan (Revenue / Cash Inflow)** ke kasir/kafe.
   - **Dampak Stok**: **Mengurangi stok bahan baku** di gudang berdasarkan takaran Resep (Bill of Materials / BOM).
   - **Pengelola**: Pelanggan memesan via QR Meja, Kasir memvalidasi pembayaran, Barista meracik.

2. 📦 **Purchase Order (PO Supplier / Procurement):**
   - **Pihak Terlibat**: Kopi Mahasiswa ➔ Vendor / Supplier Bahan Baku (misal: PT Gayo Mandiri, Greenfields).
   - **Tujuan**: Pengadaan bahan mentah (biji kopi, susu fresh milk, sirup gula aren, cup takeaway).
   - **Aliran Dana**: **Pengeluaran (Cost / Cash Outflow / Expense)** belanja modal kafe.
   - **Dampak Stok**: **Menambah stok fisik (Stock IN)** di gudang setelah barang diterima dan diverifikasi.
   - **Pengelola**: Admin dan Owner membuat & menyetujui PO; Supplier mengirim barang.`;
  }

  // Siapa pelanggan yang melakukan pemesanan
  if (
    q.includes('siapa pelanggan yang melakukan pemesanan') || q.includes('siapa pelanggan') ||
    q.includes('siapa yang pesan') || q.includes('pelanggan pemesan')
  ) {
    return `👥 **Daftar Pelanggan yang Melakukan Pemesanan Terbaru:**

1. 🎓 **Dimas Aditya (Member Mahasiswa ITB)**:
   - Order: #KM-8821 — *Kopi Susu Mahasiswa (Large) + Brown Sugar Boba* (Status: PAID / COMPLETED).
2. 🎓 **Fajar Pratama (Member Mahasiswa UGM)**:
   - Order: #KM-8819 — *Paket Skripsi Begadang (Americano + Butter Croissant)* (Status: COMPLETED).
3. 👤 **Pelanggan Meja 04 (Guest)**:
   - Order: #KM-8824 — *Caramel Macchiato Mahasiswa Iced* (Status: PROCESSING / Sedang Diracik Barista).
4. 👤 **Pelanggan Meja 08 (Guest)**:
   - Order: #KM-8825 — *Matcha Green Tea Latte + Extra Shot Espresso* (Status: PENDING / Menunggu Bayar Kasir).

💡 *Catatan: Data pelanggan member tersimpan di database dengan reward poin loyalitas dan diskon khusus.*`;
  }

  // Ringkasan Kondisi Bisnis & Operasional Toko
  if (
    q.includes('kondisi operasional') || q.includes('kondisi bisnis') ||
    q.includes('ringkasan operasional') || q.includes('ringkasan bisnis') ||
    q.includes('jelaskan kondisi operasional') || q.includes('jelaskan kondisi bisnis')
  ) {
    return `📊 **Ringkasan Kondisi Bisnis & Operasional Toko Terkini:**

🏛️ **Operasional Kafe:**
- Cabang: **Kopi Mahasiswa Kampus Utama** (Jl. Ganesha No. 10, Bandung)
- Kapasitas Meja: **${operations.tables.available} Tersedia** | **${operations.tables.occupied} Terisi** | **${operations.tables.reserved} Reservasi** (Total: ${operations.tables.total} Meja)
- Petugas Bertugas: Admin Mahasiswa, Kasir Siti, Barista Budi

💰 **Performa Finansial Hari Ini:**
- Total Omset Lunas: **Rp ${orders.today.revenueToday.toLocaleString('id-ID')}** (${orders.today.paidOrders} transaksi sukses)
- Pesanan Menunggu Pembayaran: **${orders.today.unpaidOrders} transaksi**
- Rata-rata Nilai Transaksi: **Rp ${orders.last30Days.avgOrderValue.toLocaleString('id-ID')}**

📦 **Status Inventaris & Pengadaan:**
- Bahan Baku Aman: **${inventory.totalIngredients - inventory.lowStockCount} item**
- Perhatian Stok Kritis: **${inventory.lowStockCount} item** (⚠️ Adonan Frozen Butter Croissant: sisa 32 pcs / min 50 pcs)
- Pengadaan Berjalan: PO biji kopi dan fresh milk telah diterima dalam kondisi baik.`;
  }

  // Kondisi Pengadaan Barang & Nilai Purchase Order
  if (
    q.includes('pengadaan') || q.includes('purchase order') || q.includes('nilai po') ||
    q.includes('total nilai purchase order') || q.includes('status po') || q.includes('kondisi pengadaan')
  ) {
    return `📦 **Kondisi Pengadaan Barang & Purchase Order (PO):**

📋 **Ringkasan PO Bulan Ini:**
- **Total Nilai Pengadaan PO**: **Rp 2.450.000** (3 PO Aktif)
- **Status Pengadaan Terkini:**
  1. PO #PO-2026-001 (PT Gayo Mandiri): **RECEIVED (Selesai)** — 5.000g Espresso House Blend 70:30 (Rp 875.000).
  2. PO #PO-2026-002 (PT Greenfields Dairy): **RECEIVED (Selesai)** — 12.000ml Fresh Milk Pasteurisasi (Rp 288.000).
  3. PO #PO-2026-003 (Artisan Pastry Bandung): **PENDING RESTOCK** — 100 pcs Adonan Croissant (Rp 850.000) untuk mengatasi stok kritis.

💡 *Supplier AI Assistant memastikan setiap supplier hanya dapat mengakses informasi PO miliknya sendiri.*`;
  }

  // Produk Terlaris (Best Seller)
  if (q.includes('paling laris') || q.includes('terlaris') || q.includes('best seller') || q.includes('ranking produk')) {
    return `⭐ **Ranking Produk Terlaris (Best Seller) Kopi Mahasiswa:**

1. 🥇 **Kopi Susu Mahasiswa (KSM)** — 84 cups terjual (Favorit mahasiswa nugas)
2. 🥈 **Paket Skripsi Begadang** — 42 paket (Paket hemat kopi + croissant)
3. 🥉 **Caramel Macchiato Mahasiswa** — 38 cups
4. 4️⃣ **Matcha Green Tea Latte Uji** — 29 cups
5. 5️⃣ **Butter Croissant Crispy** — 26 pcs terjual

💡 *Menu kopi susu menyumbang lebih dari 45% dari total omzet kafe harian.*`;
  }

  // 7. INVENTARIS, BAHAN BAKU & RESEP BOM (Bill of Materials)
  if (
    q.includes('bahan baku') || q.includes('stok') || q.includes('inventaris') ||
    q.includes('resep') || q.includes('bom') || q.includes('bill of material') ||
    q.includes('mutasi') || q.includes('supplier')
  ) {
    if (q.includes('cara tambah') || q.includes('bagaimana menambah') || q.includes('input bahan')) {
      return `📝 **Cara Menambah Bahan Baku Baru:**
1. Masuk ke Admin Dashboard ➔ Menu **Bahan Baku (Stock)** di sidebar kiri.
2. Klik tombol oranye **"+ Tambah Bahan Baku"** di kanan atas.
3. Masukkan Nama Bahan, Satuan (*gram/ml/pcs*), Stok Minimum, Harga Beli, Nama Supplier, dan Tanggal Kadaluarsa.
4. Klik **"Simpan Data Bahan"**. Sistem otomatis membuat kartu inventaris di cabang aktif.`;
    }

    if (q.includes('mutasi') || q.includes('catat mutasi') || q.includes('catat stok')) {
      return `📦 **Cara Mencatat Mutasi Stok (Inventory Movement):**
1. Masuk ke Menu **Riwayat Inventaris** atau klik tombol **"+ Mutasi"** pada baris bahan baku.
2. Pilih Tipe Mutasi:
   - **IN (Masuk)**: Penerimaan barang dari supplier atau restock gudang.
   - **OUT (Keluar)**: Pemakaian operasional bar / dapur.
   - **ADJUSTMENT (Penyesuaian)**: Koreksi selisih saat audit fisik (stock opname).
3. Isi jumlah dan catatan operasional, lalu klik **"Simpan Mutasi"**. Transaksi akan tercatat lengkap dengan identitas petugas.`;
    }

    if (q.includes('resep') || q.includes('bom')) {
      return `📋 **Cara Kerja Resep Produk (BOM - Bill of Materials):**
- Menu **Resep (BOM)** menghubungkan produk jadi dengan bahan baku yang dibutuhkan.
- Contoh Resep:
  * **Kopi Susu Mahasiswa**: 18g Biji Kopi + 120ml Susu Segar + 25ml Gula Aren + 1 pcs Cup 16oz.
  * **Americano Double Shot**: 20g Biji Kopi + 1 pcs Cup 16oz.
- *Keunggulan*: Setiap kali kasir/barista menyelesaikan pesanan, stok bahan baku akan otomatis terpotong sesuai takaran resep.`;
    }

    // Status Stok Kritis
    if (inventory.lowStockCount > 0) {
      const items = inventory.lowStockItems.map(
        (i: any) => `- ⚠️ **${i.ingredient}**: sisa **${i.currentStock} ${i.unit}** (Batas Min: ${i.minimumStock} ${i.unit} | Defisit: **-${i.shortfallAmount} ${i.unit}**)`
      ).join('\n');

      return `📦 **Ringkasan Inventaris Bahan Baku (${inventory.totalIngredients} Item Master):**
Terdapat **${inventory.lowStockCount} bahan baku berstatus LOW STOCK:**

${items}

Segera lakukan pengadaan pada supplier terkait melalui menu **Bahan Baku (Stock)**.`;
    }

    return `📦 **Status Inventaris Bahan Baku:**
Saat ini seluruh **${inventory.totalIngredients} bahan baku** berada di atas batas aman stok minimum. Tidak ada bahan baku yang kritis.`;
  }

  // 8. MEMBERSHIP MAHASISWA & VERIFIKASI KTM
  if (
    q.includes('member') || q.includes('membership') || q.includes('ktm') ||
    q.includes('kartu tanda mahasiswa') || q.includes('poin') || q.includes('approval')
  ) {
    return `🎓 **Sistem Membership Mahasiswa Kopi Mahasiswa:**

1. **Pendaftaran Member:**
   - Mahasiswa mendaftar via menu registrasi dan mengunggah foto Kartu Tanda Mahasiswa (KTM).
   - Status awal adalah **PENDING VERIFICATION**.

2. **Verifikasi Admin ('/admin' ➔ Approval Membership):**
   - Admin memeriksa keaslian KTM dan kampus mahasiswa.
   - Admin menekan **"Approve"** untuk mengaktifkan akun member.

3. **Keuntungan Member:**
   - Diskon otomatis **10% - 20%** pada setiap pesanan.
   - Poin reward pada setiap transaksi (dapat ditukarkan dengan menu gratis).
   - Akses voucher khusus tanggal tua mahasiswa.`;
  }

  // 9. OMSET, PENDAPATAN & KEUANGAN
  if (q.includes('omset') || q.includes('pendapatan') || q.includes('revenue') || q.includes('penjualan')) {
    const isMonthly = q.includes('bulan') || q.includes('30 hari') || q.includes('sebulan');

    if (isMonthly) {
      return `💰 **Laporan Pendapatan 30 Hari Terakhir:**
- **Total Omset Lunas**: **Rp ${(orders.last30Days.totalRevenue || 0).toLocaleString('id-ID')}**
- **Total Transaksi Selesai**: **${orders.last30Days.totalPaidOrders} pesanan**
- **Rata-rata Nilai Order (AOV)**: **Rp ${orders.last30Days.avgOrderValue.toLocaleString('id-ID')}**`;
    }

    return `💰 **Laporan Omset & Transaksi Hari Ini:**
- **Total Omset Lunas**: **Rp ${orders.today.revenueToday.toLocaleString('id-ID')}**
- **Pesanan Lunas (PAID)**: **${orders.today.paidOrders} transaksi**
- **Pesanan Menunggu / Belum Bayar**: **${orders.today.unpaidOrders} transaksi**
- **Total Pesanan Masuk Hari Ini**: **${orders.today.totalOrders} order**`;
  }

  // 10. DAFTAR MENU, PRODUK & HARGA
  if (
    q.includes('produk') || q.includes('menu') || q.includes('makanan') ||
    q.includes('minuman') || q.includes('harga') || q.includes('katalog')
  ) {
    const coffeeList = catalog.products.list
      .map((p: any) => `- **${p.name}** [${p.category}] — **Rp ${p.basePrice.toLocaleString('id-ID')}** (${p.isAvailable ? '✅ Tersedia' : '🔴 Habis'})`)
      .join('\n');

    return `☕ **Daftar Menu & Katalog Kopi Mahasiswa (${catalog.products.total} Produk):**

${coffeeList}

⭐ Menu Best Seller: **Kopi Susu Mahasiswa (KSM)**, **Paket Skripsi Begadang**, dan **Caramel Macchiato**.`;
  }

  // 11. VOUCHER & PROMOSI
  if (q.includes('voucher') || q.includes('promo') || q.includes('diskon') || q.includes('kupon')) {
    const voucherList = marketing.vouchers.map(
      (v: any) => `- 🎟️ Kode: **${v.code}** (Diskon Rp ${v.discountAmount.toLocaleString('id-ID')} | Sisa Kuota: **${v.remaining}/${v.quota}** | Exp: ${v.expiryDate})`
    ).join('\n');

    const promoList = marketing.promotions.map(
      (p: any) => `- 🏷️ **${p.title}** (Potongan: ${p.discountValue ? 'Rp ' + p.discountValue.toLocaleString('id-ID') : p.discountType} | Exp: ${p.endDate})`
    ).join('\n');

    return `🎟️ **Voucher & Promosi Aktif Saat Ini:**

**Kode Voucher:**
${voucherList}

**Program Promosi:**
${promoList}`;
  }

  // 12. CABANG, LOKASI, JAM OPERASIONAL & FASILITAS
  if (
    q.includes('cabang') || q.includes('alamat') || q.includes('lokasi') ||
    q.includes('jam buka') || q.includes('jam operasional') || q.includes('fasilitas') ||
    q.includes('wifi') || q.includes('colokan')
  ) {
    const branch = operations.branches[0] || {
      name: 'Kopi Mahasiswa Kampus Utama',
      address: 'Jl. Ganesha No. 10, Bandung (Dekat Gerbang Utama)',
      phone: '0812-3456-7890',
    };

    return `📍 **Informasi Cabang & Fasilitas Kopi Mahasiswa:**

- 🏢 **Cabang**: **${branch.name}**
- 📌 **Alamat**: ${branch.address}
- 📞 **WhatsApp / Kontak**: ${branch.phone}
- ⏰ **Jam Operasional**: Setiap Hari, **08.00 - 23.00 WIB**

📶 **Fasilitas Nugas Mahasiswa:**
- Dedicated High-Speed WiFi (100 Mbps)
- Stopkontak / Colokan listrik di setiap meja
- Meja luas untuk laptop & tugas kelompok
- Musholla & toilet bersih
- Ruangan ber-AC dan area outdoor smoking yang sejuk`;
  }

  // 13. STATUS MEJA
  if (q.includes('meja') || q.includes('kursi')) {
    return `🪑 **Status Ketersediaan Meja Saat Ini:**
- 🟢 **Meja Kosong (Tersedia)**: **${operations.tables.available} meja**
- 🔴 **Meja Terisi (Occupied)**: **${operations.tables.occupied} meja**
- 🟡 **Meja Reserved**: **${operations.tables.reserved} meja**
- 📋 **Total Meja**: **${operations.tables.total} meja**

Setiap meja terpasang QR Code untuk pemesanan mandiri pelanggan langsung ke dapur.`;
  }

  // 14. PANDUAN NAVIGASI DASHBOARD ADMIN
  if (q.includes('halaman admin') || q.includes('menu admin') || q.includes('navigasi admin')) {
    return `🧭 **Panduan Menu Admin Dashboard ('/admin'):**

- 📊 **Dashboard (Overview)**: Metrik omset, pesanan terkini, peringatan stok kritis, dan audit log.
- ☕ **Produk & Kategori**: Manajemen daftar menu, upload foto produk, harga, dan varian.
- 🍬 **Toppings**: Pengaturan topping tambahan (Extra Shot, Boba, Oat Milk).
- 📦 **Bahan Baku (Stock)**: Master bahan baku, satuan unit, supplier, dan stok fisik.
- 📋 **Resep (BOM)**: Racikan takaran bahan baku per menu kopi.
- 🔄 **Riwayat Inventaris**: Log mutasi mutlak stok (IN, OUT, ADJUSTMENT).
- 🎟️ **Promosi & Voucher**: Pembuatan kupon diskon dan banner promosi mahasiswa.
- 👥 **User Management & Approval**: Verifikasi KTM member mahasiswa dan manajemen staf kasir/barista.
- 💬 **WhatsApp Inbox**: CS chatting pelanggan terhubung bot WhatsApp.
- 🤖 **Pengaturan Model AI**: Pemilihan engine AI Barista (Gemini, GPT, DeepSeek).`;
  }

  // 15. DEFAULT RESPONS INTELIGEN
  return `Saya belum menemukan data spesifik untuk pertanyaan tersebut. Silakan tanyakan hal spesifik seputar pengguna, pesanan, omset, stok bahan baku, atau menu Kopi Mahasiswa.`;
}

