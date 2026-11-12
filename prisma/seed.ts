import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItemTopping.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.table.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.role.deleteMany();

  // 2. Create Roles
  const roles = [
    { name: 'Customer', description: 'Pelanggan umum atau guest' },
    { name: 'Cashier', description: 'Kasir yang menerima dan mengonfirmasi pesanan' },
    { name: 'Barista', description: 'Barista/Dapur yang membuat pesanan' },
    { name: 'Admin', description: 'Administrator sistem' },
    { name: 'Owner', description: 'Pemilik bisnis dengan akses analytics' },
  ];

  const createdRoles: Record<string, string> = {};
  for (const r of roles) {
    const created = await prisma.role.create({ data: r });
    createdRoles[r.name] = created.id;
  }
  console.log('✅ Created roles:', Object.keys(createdRoles));

  // 3. Create Main Branch
  const branch = await prisma.branch.create({
    data: {
      code: 'KM-01',
      name: 'Kopi Mahasiswa Kampus Utama',
      address: 'Jl. Ganesha No. 10, Bandung (Dekat Gerbang Utama)',
      phone: '0812-3456-7890',
      isActive: true,
    },
  });
  console.log('✅ Created branch:', branch.name);

  // 4. Create Tables (Meja 01 - 20)
  const tablesData = Array.from({ length: 20 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    return {
      branchId: branch.id,
      number: `Meja ${num}`,
      capacity: i % 4 === 0 ? 6 : 4,
      status: 'AVAILABLE',
    };
  });
  await prisma.table.createMany({ data: tablesData });
  console.log('✅ Created 20 tables');

  // 5. Create Staff Accounts
  const defaultPassword = await bcrypt.hash('password123', 10);

  const staffUsers = [
    {
      email: 'admin@kopimahasiswa.id',
      name: 'Admin Mahasiswa',
      passwordHash: defaultPassword,
      roleId: createdRoles['Admin'],
      branchId: branch.id,
      phone: '08111111111',
    },
    {
      email: 'cashier@kopimahasiswa.id',
      name: 'Kasir Siti',
      passwordHash: defaultPassword,
      roleId: createdRoles['Cashier'],
      branchId: branch.id,
      phone: '08222222222',
    },
    {
      email: 'barista@kopimahasiswa.id',
      name: 'Barista Budi',
      passwordHash: defaultPassword,
      roleId: createdRoles['Barista'],
      branchId: branch.id,
      phone: '08333333333',
    },
    {
      email: 'owner@kopimahasiswa.id',
      name: 'Pak Owner',
      passwordHash: defaultPassword,
      roleId: createdRoles['Owner'],
      branchId: branch.id,
      phone: '08444444444',
    },
    {
      email: 'customer@kopimahasiswa.id',
      name: 'Pelanggan Setia',
      passwordHash: defaultPassword,
      roleId: createdRoles['Customer'],
      branchId: branch.id,
      phone: '08555555555',
    },
  ];

  const createdUserMap: Record<string, string> = {};
  for (const u of staffUsers) {
    const createdUser = await prisma.user.create({ data: u });
    createdUserMap[u.email] = createdUser.id;
    if (u.roleId === createdRoles['Customer']) {
      await prisma.customerProfile.create({
        data: {
          userId: createdUser.id,
          points: 150,
          favoriteBranchId: branch.id,
        },
      });
    }
  }
  console.log('✅ Created staff and customer accounts (password: password123)');

  // 6. Create Toppings
  const toppingsData = [
    { name: 'Extra Shot Espresso', price: 5000 },
    { name: 'Oat Milk (Sub Milk)', price: 7000 },
    { name: 'Brown Sugar Boba', price: 4000 },
    { name: 'Salted Caramel Syrup', price: 4000 },
    { name: 'Whipped Cream', price: 4000 },
    { name: 'Grass Jelly', price: 3000 },
  ];
  for (const t of toppingsData) {
    await prisma.topping.create({ data: t });
  }
  console.log('✅ Created toppings');

  // 7. Create Categories & Products
  const categories = [
    { name: 'Promo Mahasiswa', slug: 'promo-mahasiswa', icon: 'zap', displayOrder: 1 },
    { name: 'Milk Coffee', slug: 'milk-coffee', icon: 'cup-soda', displayOrder: 2 },
    { name: 'Espresso Series', slug: 'espresso-series', icon: 'coffee', displayOrder: 3 },
    { name: 'Non-Coffee & Tea', slug: 'non-coffee', icon: 'sparkles', displayOrder: 4 },
    { name: 'Snack & Pastry', slug: 'snack-pastry', icon: 'cookie', displayOrder: 5 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    categoryMap[c.slug] = created.id;
  }

  const productsData = [
    // Promo Mahasiswa
    {
      categoryId: categoryMap['promo-mahasiswa'],
      name: 'Paket Skripsi Begadang',
      slug: 'paket-skripsi-begadang',
      description: 'Combo Kopi Susu Gula Aren Double Shot + Croissant Mentega Panas. Hemat & Ampuh Tahan Kantuk!',
      basePrice: 28000,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      isBestSeller: true,
      variants: [
        { name: 'Iced Regular', priceAdjustment: 0 },
        { name: 'Iced Large', priceAdjustment: 4000 },
      ],
    },
    {
      categoryId: categoryMap['promo-mahasiswa'],
      name: 'Kopi Susu Mahasiswa (KSM)',
      slug: 'kopi-susu-mahasiswa',
      description: 'Kopi susu khas racikan mahasiswa dengan espresso bold dan manis gurih gula aren murni.',
      basePrice: 15000,
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
      isBestSeller: true,
      variants: [
        { name: 'Iced Regular', priceAdjustment: 0 },
        { name: 'Iced Large', priceAdjustment: 3000 },
        { name: 'Hot Regular', priceAdjustment: 0 },
      ],
    },

    // Milk Coffee
    {
      categoryId: categoryMap['milk-coffee'],
      name: 'Caramel Macchiato Mahasiswa',
      slug: 'caramel-macchiato-mahasiswa',
      description: 'Espresso racikan segar dengan susu hangat, syrup vanilla, dan siraman saus karamel mewah.',
      basePrice: 22000,
      image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80',
      isBestSeller: true,
      variants: [
        { name: 'Iced Regular', priceAdjustment: 0 },
        { name: 'Iced Large', priceAdjustment: 4000 },
        { name: 'Hot Regular', priceAdjustment: 0 },
      ],
    },
    {
      categoryId: categoryMap['milk-coffee'],
      name: 'Hazelnut Cream Latte',
      slug: 'hazelnut-cream-latte',
      description: 'Perpaduan lembut espresso, aroma hazelnut manis, dan foam susu gurih melimpah.',
      basePrice: 21000,
      image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80',
      isBestSeller: false,
      variants: [
        { name: 'Iced Regular', priceAdjustment: 0 },
        { name: 'Iced Large', priceAdjustment: 4000 },
      ],
    },
    {
      categoryId: categoryMap['milk-coffee'],
      name: 'Pandan Aren Latte',
      slug: 'pandan-aren-latte',
      description: 'Cita rasa lokal harum ekstrak pandan suji berpadu manisnya gula aren & kopi pilihan.',
      basePrice: 20000,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      isBestSeller: false,
      variants: [
        { name: 'Iced Regular', priceAdjustment: 0 },
        { name: 'Iced Large', priceAdjustment: 3000 },
      ],
    },

    // Espresso Series
    {
      categoryId: categoryMap['espresso-series'],
      name: 'Americano Double Shot',
      slug: 'americano-double-shot',
      description: 'Espresso murni 100% Arabika pilihan dengan air mineral segar. Bersih, asam seimbang, dan menyegarkan.',
      basePrice: 16000,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      isBestSeller: false,
      variants: [
        { name: 'Iced Regular', priceAdjustment: 0 },
        { name: 'Iced Large', priceAdjustment: 3000 },
        { name: 'Hot Regular', priceAdjustment: 0 },
      ],
    },
    {
      categoryId: categoryMap['espresso-series'],
      name: 'Classic Caffe Latte',
      slug: 'classic-caffe-latte',
      description: 'Kombinasi klasik 1 shot espresso halus dan steamed milk creamy khas barista.',
      basePrice: 19000,
      image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
      isBestSeller: false,
      variants: [
        { name: 'Hot Regular', priceAdjustment: 0 },
        { name: 'Iced Regular', priceAdjustment: 2000 },
      ],
    },

    // Non-Coffee & Tea
    {
      categoryId: categoryMap['non-coffee'],
      name: 'Matcha Green Tea Latte',
      slug: 'matcha-green-tea-latte',
      description: 'Matcha khas Uji Jepang kualitas premium dikocok halus dengan susu segar creamy.',
      basePrice: 22000,
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
      isBestSeller: true,
      variants: [
        { name: 'Iced Regular', priceAdjustment: 0 },
        { name: 'Iced Large', priceAdjustment: 4000 },
        { name: 'Hot Regular', priceAdjustment: 0 },
      ],
    },
    {
      categoryId: categoryMap['non-coffee'],
      name: 'Artisan Chocolate Signature',
      slug: 'artisan-chocolate-signature',
      description: 'Cokelat hitam Belgia rich & bitter-sweet dengan susu segar hangat atau dingin.',
      basePrice: 20000,
      image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80',
      isBestSeller: false,
      variants: [
        { name: 'Iced Regular', priceAdjustment: 0 },
        { name: 'Iced Large', priceAdjustment: 3000 },
        { name: 'Hot Regular', priceAdjustment: 0 },
      ],
    },

    // Snack & Pastry
    {
      categoryId: categoryMap['snack-pastry'],
      name: 'Butter Croissant Crispy',
      slug: 'butter-croissant-crispy',
      description: 'Pastry renyah berlapis dengan aroma butter Prancis melimpah. Dipanggang hangat.',
      basePrice: 16000,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
      isBestSeller: true,
      variants: [
        { name: 'Original Warm', priceAdjustment: 0 },
      ],
    },
    {
      categoryId: categoryMap['snack-pastry'],
      name: 'Kentang Goreng Keju Bumbu',
      slug: 'kentang-goreng-keju',
      description: 'French fries garing ditaburi bumbu keju spesial & saus mayo gurih.',
      basePrice: 15000,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
      isBestSeller: false,
      variants: [
        { name: 'Regular Size', priceAdjustment: 0 },
      ],
    },
  ];

  const createdProductMap: Record<string, string> = {};
  for (const p of productsData) {
    const { variants, ...productInfo } = p;
    const createdProduct = await prisma.product.create({
      data: productInfo,
    });
    createdProductMap[p.slug] = createdProduct.id;

    if (variants && variants.length > 0) {
      for (const v of variants) {
        await prisma.productVariant.create({
          data: {
            productId: createdProduct.id,
            name: v.name,
            priceAdjustment: v.priceAdjustment,
          },
        });
      }
    }
  }
  console.log('✅ Created products & variants');

  // 8. Create Promotions
  const promotions = [
    {
      title: 'Special Mahasiswa Promo 2026',
      description: 'Diskon 20% untuk semua menu kopi dengan KTM atau order via website Kopi Mahasiswa.',
      discountType: 'PERCENTAGE',
      discountPercent: 20,
      discountValue: 0,
      minPurchase: 15000,
      maxDiscount: 15000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      usageLimit: 1000,
      usedCount: 42,
      isActive: true,
    },
    {
      title: 'Happy Hour Nugas Sore',
      description: 'Diskon Rp 4.000 untuk pembelian varian kopi susu jam 14:00 - 17:00.',
      discountType: 'FIXED',
      discountPercent: 0,
      discountValue: 4000,
      minPurchase: 20000,
      maxDiscount: 4000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      usageLimit: 500,
      usedCount: 15,
      isActive: true,
    },
  ];
  for (const pr of promotions) {
    await prisma.promotion.create({ data: pr });
  }
  console.log('✅ Created promotions');

  // 9. Create Vouchers
  const vouchers = [
    {
      code: 'MAHASISWAHEMAT',
      discountAmount: 5000,
      minSpend: 20000,
      quota: 500,
      expiryDate: new Date('2027-12-31'),
    },
    {
      code: 'DISKON10K',
      discountAmount: 10000,
      minSpend: 35000,
      quota: 200,
      expiryDate: new Date('2027-12-31'),
    },
    {
      code: 'KOPIPERTAMA',
      discountAmount: 7000,
      minSpend: 25000,
      quota: 300,
      expiryDate: new Date('2027-12-31'),
    },
  ];

  for (const v of vouchers) {
    await prisma.voucher.create({ data: v });
  }
  console.log('✅ Created promo vouchers');

  // 10. Create Master Ingredients & Branch Inventory
  const ingredientsData = [
    {
      name: 'Espresso House Blend 70:30 (Arabika-Robusta)',
      unit: 'gram',
      minimumStock: 1000,
      purchasePrice: 175000,
      supplier: 'PT Gayo Mandiri Perkasa',
      expiryDate: new Date('2027-04-15'),
      stockQuantity: 4500,
    },
    {
      name: 'Fresh Milk Pasteurisasi (Greenfields)',
      unit: 'ml',
      minimumStock: 3000,
      purchasePrice: 24000,
      supplier: 'PT Greenfields Dairy Indonesia',
      expiryDate: new Date('2026-12-05'),
      stockQuantity: 12000,
    },
    {
      name: 'Sirup Gula Aren Murni Organik',
      unit: 'ml',
      minimumStock: 1500,
      purchasePrice: 45000,
      supplier: 'Koperasi Petani Aren Lebak',
      expiryDate: new Date('2027-08-20'),
      stockQuantity: 6500,
    },
    {
      name: 'Sirup Caramel Gourmet',
      unit: 'ml',
      minimumStock: 500,
      purchasePrice: 135000,
      supplier: 'Monin Indonesia Official',
      expiryDate: new Date('2027-10-10'),
      stockQuantity: 2200,
    },
    {
      name: 'Sirup Hazelnut Signature',
      unit: 'ml',
      minimumStock: 500,
      purchasePrice: 130000,
      supplier: 'Toffin Indonesia Distr.',
      expiryDate: new Date('2027-09-18'),
      stockQuantity: 1800,
    },
    {
      name: 'Pure Matcha Powder Uji Premium',
      unit: 'gram',
      minimumStock: 300,
      purchasePrice: 280000,
      supplier: 'Kyoto Tea Import Partner',
      expiryDate: new Date('2027-06-30'),
      stockQuantity: 1100,
    },
    {
      name: 'Belgian Dark Chocolate 70% Powder',
      unit: 'gram',
      minimumStock: 500,
      purchasePrice: 165000,
      supplier: 'Barry Callebaut Indo',
      expiryDate: new Date('2027-07-25'),
      stockQuantity: 2400,
    },
    {
      name: 'Adonan Frozen Butter Croissant',
      unit: 'pcs',
      minimumStock: 50,
      purchasePrice: 8500,
      supplier: 'Artisan Pastry Bandung',
      expiryDate: new Date('2026-12-20'),
      stockQuantity: 32, // Low stock simulation
    },
    {
      name: 'Cup Plastik PP 16oz + Custom Logo KM',
      unit: 'pcs',
      minimumStock: 300,
      purchasePrice: 450,
      supplier: 'CV Berkat Kemasan Mandiri',
      expiryDate: null,
      stockQuantity: 1500,
    },
    {
      name: 'Paper Hot Cup 8oz Double Wall',
      unit: 'pcs',
      minimumStock: 150,
      purchasePrice: 650,
      supplier: 'CV Berkat Kemasan Mandiri',
      expiryDate: null,
      stockQuantity: 600,
    },
    {
      name: 'Sedotan Ramah Lingkungan (Oxo-Biodegradable)',
      unit: 'pcs',
      minimumStock: 400,
      purchasePrice: 120,
      supplier: 'EcoStraw Nusantara',
      expiryDate: null,
      stockQuantity: 2000,
    },
    {
      name: 'Kentang Beku Shoestring Cut',
      unit: 'gram',
      minimumStock: 2000,
      purchasePrice: 38000,
      supplier: 'Sumber Segar Pangan',
      expiryDate: new Date('2027-03-12'),
      stockQuantity: 5500,
    },
  ];

  const createdIngredients: Record<string, { ingredientId: string; inventoryId: string }> = {};

  for (const item of ingredientsData) {
    const { stockQuantity, ...ingData } = item;
    const ing = await prisma.ingredient.create({ data: ingData });
    const inv = await prisma.inventory.create({
      data: {
        branchId: branch.id,
        ingredientId: ing.id,
        stockQuantity: stockQuantity,
      },
    });
    createdIngredients[item.name] = { ingredientId: ing.id, inventoryId: inv.id };
  }
  console.log('✅ Created ingredients & branch inventory');

  // 11. Create Inventory Transactions (Audit & Movements by Role)
  const adminId = createdUserMap['admin@kopimahasiswa.id'];
  const baristaId = createdUserMap['barista@kopimahasiswa.id'] || adminId;
  const cashierId = createdUserMap['cashier@kopimahasiswa.id'] || adminId;
  const ownerId = createdUserMap['owner@kopimahasiswa.id'] || adminId;
  const customerId = createdUserMap['customer@kopimahasiswa.id'] || adminId;

  const transactionsData = [
    // Admin transactions
    {
      ingName: 'Espresso House Blend 70:30 (Arabika-Robusta)',
      type: 'IN',
      amount: 5000,
      notes: 'Restock batch mingguan biji kopi dari PT Gayo Mandiri (PO #PO-2026-001)',
      userId: adminId,
      createdAt: new Date(Date.now() - 1000 * 60 * 35),
    },
    {
      ingName: 'Cup Plastik PP 16oz + Custom Logo KM',
      type: 'ADJUSTMENT',
      amount: 100,
      notes: 'Penyesuaian audit fisik stok mingguan (cup rusak/reject sealer)',
      userId: adminId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    },
    {
      ingName: 'Adonan Frozen Butter Croissant',
      type: 'IN',
      amount: 50,
      notes: 'Penerimaan adonan pastry beku dari Artisan Pastry Bandung',
      userId: adminId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
    },

    // Barista transactions
    {
      ingName: 'Espresso House Blend 70:30 (Arabika-Robusta)',
      type: 'OUT',
      amount: 750,
      notes: 'Pemakaian biji kopi operasional bar shift pagi & kalibrasi grinder mesin espresso',
      userId: baristaId,
      createdAt: new Date(Date.now() - 1000 * 60 * 55),
    },
    {
      ingName: 'Fresh Milk Pasteurisasi (Greenfields)',
      type: 'OUT',
      amount: 3000,
      notes: 'Pemakaian susu segar untuk order batch promo jam nugas siang mahasiswa',
      userId: baristaId,
      createdAt: new Date(Date.now() - 1000 * 60 * 110),
    },
    {
      ingName: 'Sirup Gula Aren Murni Organik',
      type: 'OUT',
      amount: 600,
      notes: 'Refill botol squeeze gula aren meja bar racik kopi susu',
      userId: baristaId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      ingName: 'Adonan Frozen Butter Croissant',
      type: 'OUT',
      amount: 18,
      notes: 'Pemanggangan oven kloter 1 untuk pesanan Paket Skripsi Begadang',
      userId: baristaId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
      ingName: 'Pure Matcha Powder Uji Premium',
      type: 'OUT',
      amount: 150,
      notes: 'Pemakaian pure matcha powder untuk 10 porsi pesanan Matcha Latte Iced',
      userId: baristaId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    },

    // Cashier transactions
    {
      ingName: 'Cup Plastik PP 16oz + Custom Logo KM',
      type: 'OUT',
      amount: 120,
      notes: 'Pengambilan cup takeaway & sealer lid dari gudang ke etalase counter kasir',
      userId: cashierId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      ingName: 'Sedotan Ramah Lingkungan (Oxo-Biodegradable)',
      type: 'OUT',
      amount: 100,
      notes: 'Pengisian dispenser sedotan counter kasir & pick-up area',
      userId: cashierId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
    },

    // Owner transactions
    {
      ingName: 'Pure Matcha Powder Uji Premium',
      type: 'IN',
      amount: 1000,
      notes: 'Approval penerimaan pengadaan matcha grade ceremonial langsung dari supplier',
      userId: ownerId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    },
    {
      ingName: 'Sirup Caramel Gourmet',
      type: 'ADJUSTMENT',
      amount: 500,
      notes: 'Koreksi selisih hitung inventaris akhir bulan saat audit bersama Owner',
      userId: ownerId,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },

    // Customer order simulation
    {
      ingName: 'Sirup Gula Aren Murni Organik',
      type: 'OUT',
      amount: 40,
      notes: 'Otomatis terpotong via sistem resep pesanan order #KM-8821 (Kopi Susu Mahasiswa)',
      userId: customerId,
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      ingName: 'Cup Plastik PP 16oz + Custom Logo KM',
      type: 'OUT',
      amount: 1,
      notes: 'Otomatis terpotong via sistem resep pesanan order #KM-8821 (Cup Takeaway 16oz)',
      userId: customerId,
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
    },
  ];

  for (const t of transactionsData) {
    const target = createdIngredients[t.ingName];
    if (target && t.userId) {
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: target.inventoryId,
          type: t.type,
          amount: t.amount,
          notes: t.notes,
          createdById: t.userId,
          createdAt: t.createdAt,
        },
      });
    }
  }
  console.log('✅ Created inventory transactions across all roles');

  // 12. Create Recipes (BOM) linking Products to Ingredients
  const espressoId = createdIngredients['Espresso House Blend 70:30 (Arabika-Robusta)']?.ingredientId;
  const milkId = createdIngredients['Fresh Milk Pasteurisasi (Greenfields)']?.ingredientId;
  const arenId = createdIngredients['Sirup Gula Aren Murni Organik']?.ingredientId;
  const caramelId = createdIngredients['Sirup Caramel Gourmet']?.ingredientId;
  const matchaId = createdIngredients['Pure Matcha Powder Uji Premium']?.ingredientId;
  const croissantIngId = createdIngredients['Adonan Frozen Butter Croissant']?.ingredientId;

  const recipesData = [
    // Kopi Susu Mahasiswa
    { productSlug: 'kopi-susu-mahasiswa', ingId: espressoId, qty: 18 },
    { productSlug: 'kopi-susu-mahasiswa', ingId: milkId, qty: 120 },
    { productSlug: 'kopi-susu-mahasiswa', ingId: arenId, qty: 25 },

    // Americano Double Shot
    { productSlug: 'americano-double-shot', ingId: espressoId, qty: 20 },

    // Caramel Macchiato Mahasiswa
    { productSlug: 'caramel-macchiato-mahasiswa', ingId: espressoId, qty: 18 },
    { productSlug: 'caramel-macchiato-mahasiswa', ingId: milkId, qty: 150 },
    { productSlug: 'caramel-macchiato-mahasiswa', ingId: caramelId, qty: 20 },

    // Matcha Green Tea Latte
    { productSlug: 'matcha-green-tea-latte', ingId: matchaId, qty: 15 },
    { productSlug: 'matcha-green-tea-latte', ingId: milkId, qty: 180 },

    // Butter Croissant
    { productSlug: 'butter-croissant-crispy', ingId: croissantIngId, qty: 1 },
  ];

  for (const r of recipesData) {
    const prodId = createdProductMap[r.productSlug];
    if (prodId && r.ingId) {
      await prisma.recipe.create({
        data: {
          productId: prodId,
          ingredientId: r.ingId,
          quantityRequired: r.qty,
        },
      });
    }
  }
  console.log('✅ Created product recipes (BOM)');

  console.log('🚀 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
