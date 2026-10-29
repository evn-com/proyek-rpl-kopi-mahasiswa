import { prisma } from '@/lib/prisma';

/**
 * Mengambil snapshot lengkap seluruh database untuk konteks AI Admin.
 * Setiap tabel penting dirangkum agar AI dapat menjawab pertanyaan manajemen.
 */
export async function fetchAdminDatabaseSnapshot() {
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

  // Map roles
  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map((r) => [r.id, r.name]));

  // Low stock calculation
  const lowStockItems = inventories.filter(
    (inv) => inv.stockQuantity <= inv.ingredient.minimumStock
  );

  // Orders today stats
  const ordersToday_paid = ordersToday.filter((o) => o.paymentStatus === 'PAID');
  const ordersToday_unpaid = ordersToday.filter((o) => o.paymentStatus !== 'PAID');
  const revenueToday = ordersToday_paid.reduce((sum, o) => sum + o.finalAmount, 0);

  return {
    users: {
      total: userCount,
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
      totalIngredients: ingredients.length,
      totalInventoryRecords: inventories.length,
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
}

/**
 * Semantic Question-Answering Engine untuk Admin AI
 * Menjawab pertanyaan spesifik dengan data terarah, BUKAN sekadar ringkasan database.
 */
export function generatePreciseAdminResponse(
  query: string,
  db: any,
  user: { name: string; role: string; campus?: string; points?: number; email?: string }
): string {
  const q = query.toLowerCase().trim();
  const { users, operations, catalog, inventory, orders, marketing, system } = db;

  // 0. PERTANYAAN PROFIL USER / IDENTITAS DIRI ("siapa saya", "profil saya", dll.)
  const isProfileQuery = [
    'siapa saya',
    'siapa aku',
    'siapakah saya',
    'nama saya',
    'namaku',
    'profil saya',
    'profilku',
    'akun saya',
    'tentang saya',
    'role saya',
    'jabatan saya',
    'identitas saya',
    'data saya',
    'informasi akun saya',
  ].some((term) => q.includes(term));

  if (isProfileQuery) {
    const campusInfo = user.campus ? `\n🎓 Asal Kampus: **${user.campus}**` : '';
    const pointsInfo = user.points !== undefined && user.points > 0 ? `\n🌟 Saldo Poin: **${user.points} Poin**` : '';

    return `👋 Kamu adalah **${user.name}**, login sebagai **${user.role}** Kopi Mahasiswa.${campusInfo}${pointsInfo}

Sebagai **${user.role}**, kamu memiliki hak akses penuh untuk mengelola operasional kafe, memantau omset, stok bahan baku, dan manajemen pengguna.

Ada data toko atau laporan statistik yang ingin kamu pantau hari ini? Silakan tanyakan hal spesifik seperti _"Berapa omset hari ini?"_ atau _"Ada stok kritis?"_.`;
  }

  // 1. SAPAAN / GREETINGS / BANTUAN
  const isGreeting = [
    'halo', 'hai', 'helo', 'hi', 'selamat', 'pagi', 'siang', 'sore', 'malam',
    'apa kabar', 'help', 'bantuan', 'bisa apa'
  ].some((w) => q === w || q.startsWith(w + ' ') || q.includes(' ' + w));

  if (isGreeting && q.length < 25) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

    return `👋 ${timeGreeting}, **${user.name}**! (${user.role})

Saya adalah **Admin AI Assistant** Kopi Mahasiswa. Saya siap membantu Anda menganalisa dan memonitor data operasional kafe secara langsung.

Silakan tanyakan data spesifik yang ingin Anda ketahui:
- 💰 _"Berapa omset hari ini?"_
- 📦 _"Bahan baku apa saja yang stoknya kritis?"_
- ☕ _"Tampilkan daftar menu kopi dan harga"_
- 👥 _"Berapa jumlah total user dan per role?"_
- 🪑 _"Berapa meja kosong saat ini?"_
- 🎟️ _"Voucher apa saja yang masih aktif?"_`;
  }

  // 2. OMSET / PENDAPATAN / REVENUE / PENJUALAN
  if (q.includes('omset') || q.includes('pendapatan') || q.includes('revenue') || q.includes('penjualan')) {
    const isMonthly = q.includes('bulan') || q.includes('30 hari') || q.includes('sebulan') || q.includes('kemarin');

    if (isMonthly) {
      return `💰 **Laporan Pendapatan 30 Hari Terakhir:**
- **Total Pendapatan Lunas**: **Rp ${(orders.last30Days.totalRevenue || 0).toLocaleString('id-ID')}**
- **Total Transaksi Lunas**: **${orders.last30Days.totalPaidOrders} pesanan**
- **Rata-rata Nilai Transaksi (AOV)**: **Rp ${orders.last30Days.avgOrderValue.toLocaleString('id-ID')}** per order

_Data diperbarui secara real-time dari seluruh order berstatus PAID._`;
    }

    return `💰 **Laporan Omset & Transaksi Hari Ini:**
- **Total Omset Lunas**: **Rp ${orders.today.revenueToday.toLocaleString('id-ID')}**
- **Pesanan Lunas (PAID)**: **${orders.today.paidOrders} transaksi**
- **Pesanan Belum Bayar / Menunggu**: **${orders.today.unpaidOrders} transaksi**
- **Pesanan Dibatalkan**: **${orders.today.cancelledOrders}**
- **Total Pesanan Masuk Hari Ini**: **${orders.today.totalOrders} order**`;
  }

  // 3. STOK BAHAN BAKU / INVENTARIS
  if (q.includes('stok') || q.includes('bahan baku') || q.includes('inventaris') || q.includes('kritis') || q.includes('habis')) {
    const isCriticalOnly = q.includes('kritis') || q.includes('habis') || q.includes('kurang') || q.includes('minimum') || q.includes('warning');

    if (isCriticalOnly || inventory.lowStockCount > 0) {
      if (inventory.lowStockCount === 0) {
        return `✅ **Status Bahan Baku Aman:**
Saat ini **seluruh ${inventory.totalIngredients} bahan baku** berada di atas batas stok minimum. Tidak ada bahan baku yang berada di status kritis.`;
      }

      const items = inventory.lowStockItems.map(
        (i: any) => `- ⚠️ **${i.ingredient}**: sisa **${i.currentStock} ${i.unit}** (Batas Min: ${i.minimumStock} ${i.unit} | Defisit: **-${i.shortfallAmount} ${i.unit}**)`
      ).join('\n');

      return `⚠️ **Peringatan: Terdapat ${inventory.lowStockCount} Bahan Baku di Bawah Stok Minimum:**

${items}

💡 **Rekomendasi Tindakan:**
Segera lakukan Restock / Pembelian Masuk pada menu **Bahan Baku (Stock)** untuk mencegah terhambatnya peracikan menu saat jam sibuk.`;
    }

    const listAll = inventory.ingredients.slice(0, 10).map(
      (i: any) => `- **${i.name}**: stok **${i.currentStock} ${i.unit}** (min: ${i.minimumStock} ${i.unit})`
    ).join('\n');

    return `📦 **Ringkasan Stok Bahan Baku (${inventory.totalIngredients} Item Master):**

${listAll}
${inventory.ingredients.length > 10 ? `_...dan ${inventory.ingredients.length - 10} item bahan baku lainnya._` : ''}`;
  }

  // 4. DAFTAR MENU / PRODUK / HARGA
  if (q.includes('produk') || q.includes('menu') || q.includes('kategori') || q.includes('makanan') || q.includes('minuman') || q.includes('kopi') || q.includes('coffee') || q.includes('harga')) {
    // Cek apakah menanyakan produk spesifik
    const foundProduct = catalog.products.list.find((p: any) => q.includes(p.name.toLowerCase()));
    if (foundProduct) {
      return `☕ **Detail Produk: ${foundProduct.name}**
- **Kategori**: ${foundProduct.category}
- **Harga Dasar**: **Rp ${foundProduct.basePrice.toLocaleString('id-ID')}**
- **Status Ketersediaan**: ${foundProduct.isAvailable ? '✅ Tersedia (Aktif)' : '🔴 Habis (Sold Out)'}
- **Badge**: ${foundProduct.isBestSeller ? '⭐ Best Seller' : 'Reguler'}
${foundProduct.variants.length > 0 ? `- **Varian Tersedia**: ${foundProduct.variants.join(', ')}` : ''}`;
    }

    // Cek filter kopi
    if (q.includes('kopi') || q.includes('coffee') || q.includes('espresso')) {
      const coffeeList = catalog.products.list
        .filter((p: any) => p.category.toLowerCase().includes('coffee') || p.category.toLowerCase().includes('espresso') || p.name.toLowerCase().includes('latte') || p.name.toLowerCase().includes('kopi'))
        .map((p: any) => `- **${p.name}** — **Rp ${p.basePrice.toLocaleString('id-ID')}** (${p.isAvailable ? '✅ Ada' : '🔴 Habis'})`)
        .join('\n');

      return `☕ **Daftar Menu Kopi (Coffee & Espresso Series):**

${coffeeList}

Total terdapat **${catalog.products.total} menu produk** di seluruh kategori.`;
    }

    // Default ringkasan produk
    const byCategory = catalog.categories.map((c: any) => {
      const count = catalog.products.list.filter((p: any) => p.category === c.name).length;
      return `- **${c.name}**: ${count} produk`;
    }).join('\n');

    return `🍽️ **Katalog Produk Kopi Mahasiswa:**
- **Total Menu**: **${catalog.products.total} produk** (**${catalog.products.available} aktif**, ${catalog.products.unavailable} habis)
- **Menu Best Seller**: **${catalog.products.bestSellers} produk**

**Kategori Produk:**
${byCategory}

Ketik _"daftar menu kopi"_ atau nama produk spesifik (misal: _"berapa harga Americano"_) untuk melihat rincian harga.`;
  }

  // 5. USER / PENGGUNA / STAF / KASIR / BARISTA
  if (q.includes('user') || q.includes('pengguna') || q.includes('akun') || q.includes('kasir') || q.includes('barista') || q.includes('staf') || q.includes('pelanggan') || q.includes('member')) {
    if (q.includes('kasir')) {
      const count = users.byRole.find((r: any) => r.role === 'Cashier')?.count || 0;
      return `👤 **Data Kasir:**
Saat ini terdapat **${count} akun Kasir** terdaftar di sistem Kopi Mahasiswa. Kasir memiliki akses POS, konfirmasi pesanan masuk, dan proses pembayaran kasir.`;
    }

    if (q.includes('barista')) {
      const count = users.byRole.find((r: any) => r.role === 'Barista')?.count || 0;
      return `☕ **Data Barista:**
Saat ini terdapat **${count} akun Barista** terdaftar. Barista memiliki akses ke Kitchen Display System (KDS) untuk memproses status racikan pesanan.`;
    }

    const byRole = users.byRole.map((r: any) => `- **${r.role}**: ${r.count} akun`).join('\n');

    return `👥 **Ringkasan Pengguna Terdaftar (${users.total} Total Akun):**

${byRole}

**Statistik Pelanggan (Customer):**
- Total Profil: **${users.customerPointsStats.totalProfiles} pelanggan**
- Rata-rata Saldo Poin: **${users.customerPointsStats.avgPoints} poin**
- Poin Tertinggi Dimiliki: **${users.customerPointsStats.highestPoints} poin**`;
  }

  // 6. VOUCHER & PROMOSI
  if (q.includes('voucher') || q.includes('promo') || q.includes('diskon') || q.includes('kupon')) {
    const activeVouchers = marketing.vouchers.filter((v: any) => v.isActive);

    const voucherList = activeVouchers.map((v: any) => {
      const val = v.discountType === 'FIXED' ? `Rp ${v.discountAmount.toLocaleString('id-ID')}` : `${v.discountAmount}%`;
      return `- 🎟️ Kode: **${v.code}** (Diskon ${val} | Sisa Kuota: **${v.remaining}/${v.quota}** | Berlaku s/d: ${v.expiryDate})`;
    }).join('\n');

    const promoList = marketing.promotions.filter((p: any) => p.isActive).map((p: any) => {
      return `- 🏷️ **${p.title}** (Dipakai: ${p.usedCount}x | Periode: ${p.startDate} s/d ${p.endDate})`;
    }).join('\n');

    return `🎟️ **Voucher & Promosi Aktif Saat Ini:**

**Daftar Voucher:**
${voucherList || '- Tidak ada kode voucher aktif saat ini'}

**Promosi Aktif:**
${promoList || '- Tidak ada promosi banner aktif'}`;
  }

  // 7. MEJA / OPERASIONAL
  if (q.includes('meja') || q.includes('kursi') || q.includes('cabang') || q.includes('operasional')) {
    return `🪑 **Status Meja & Operasional:**
- 🟢 **Meja Tersedia (Kosong)**: **${operations.tables.available} meja**
- 🔴 **Meja Terisi (Occupied)**: **${operations.tables.occupied} meja**
- 🟡 **Meja Reserved**: **${operations.tables.reserved} meja**
- 📋 **Total Meja**: **${operations.tables.total} meja**

Setiap meja terkoneksi dengan QR Menu pemesanan mandiri pelanggan.`;
  }

  // 8. AUDIT LOG & SISTEM
  if (q.includes('audit') || q.includes('log') || q.includes('sistem') || q.includes('notifikasi') || q.includes('aktivitas')) {
    const logs = system.recentAuditLogs.slice(0, 5).map(
      (l: any) => `- [${l.createdAt.substring(11, 16)}] **${l.action}** pada ${l.resource} (oleh: ${l.user})`
    ).join('\n');

    return `🔧 **Aktivitas Sistem & Audit Log Terkini:**
- Notifikasi Belum Dibaca: **${system.unreadNotifications} notifikasi**
- Kepuasan Pelanggan: **⭐ ${system.reviews.avgRating}/5** (${system.reviews.total} ulasan)

**5 Aktivitas Terakhir:**
${logs || '- Belum ada log aktivitas hari ini'}`;
  }

  // 9. JIKA PERTANYAAN DIMULAI DENGAN "BERAPA..."
  if (q.startsWith('berapa')) {
    if (q.includes('omset') || q.includes('pendapatan')) {
      return `💰 **Omset hari ini adalah Rp ${orders.today.revenueToday.toLocaleString('id-ID')}** dari total ${orders.today.paidOrders} transaksi yang sudah lunas.`;
    }
    if (q.includes('produk') || q.includes('menu')) {
      return `🍽️ **Total produk terdaftar adalah ${catalog.products.total} menu**, dengan ${catalog.products.available} produk aktif tersedia dan ${catalog.products.bestSellers} produk best seller.`;
    }
    if (q.includes('stok') || q.includes('bahan')) {
      return `📦 Terdapat **${inventory.totalIngredients} jenis bahan baku**, dengan **${inventory.lowStockCount} bahan** saat ini di bawah batas minimum stok.`;
    }
    if (q.includes('user') || q.includes('pelanggan')) {
      return `👥 Terdapat **${users.total} total pengguna terdaftar**, dengan ${users.byRole.find((r: any) => r.role === 'Customer')?.count || 0} akun pelanggan.`;
    }
    if (q.includes('meja')) {
      return `🪑 Terdapat **${operations.tables.available} meja kosong** yang siap ditempati dari total ${operations.tables.total} meja.`;
    }
  }

  // 10. JAWABAN UMUM KONTEKSTUAL (Tidak menampilkan ringkasan database kecuali diminta)
  return `Halo **${user.name}**! Saya memahami pertanyaan Anda seputar _"${query}"_.

Untuk menjaga informasi tetap fokus dan relevan:
- 👤 **Profil Akun**: Tanyakan _"Siapa saya?"_ untuk melihat status akun Anda.
- 📊 **Statistik Toko**: Tanyakan hal spesifik seperti:
  * 💰 _"Berapa omset hari ini?"_
  * 📦 _"Bahan apa yang stoknya kritis?"_
  * 👥 _"Berapa jumlah user terdaftar?"_
  * 🍽️ _"Tampilkan daftar menu kopi dan harga"_
  * 🪑 _"Berapa meja kosong?"_
  * 🎟️ _"Voucher apa saja yang aktif?"_

Ada data operasional tertentu yang ingin Anda periksa?`;
}
