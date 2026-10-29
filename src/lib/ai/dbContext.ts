import { prisma } from '../prisma';

export interface RealtimeDatabaseContext {
  storeInfo: {
    name: string;
    address: string;
    phone: string;
    operationalHours: string;
    facilities: string[];
  };
  tableStats: {
    total: number;
    availableCount: number;
    occupiedCount: number;
    availableNumbers: string[];
    tables: { number: string; capacity: number; status: string }[];
  };
  activePromotions: {
    id: string;
    title: string;
    description: string;
    discountType: string;
    discountPercent: number;
    discountValue: number;
    minPurchase: number;
  }[];
  activeVouchers: {
    code: string;
    discountType: string;
    discountAmount: number;
    minSpend: number;
  }[];
  products: {
    id: string;
    name: string;
    slug: string;
    category: string;
    basePrice: number;
    description: string;
    isBestSeller: boolean;
    isAvailable: boolean;
    caffeineLevel: 'Tinggi' | 'Sedang' | 'Bebas Kafein';
    tasteProfile: string;
    variants: { name: string; priceAdjustment: number }[];
  }[];
}

export type MenuCategoryIntent = 'coffee' | 'non-coffee' | 'snack' | 'all';

/**
 * 1. Intent Recognition: Mengidentifikasi kategori menu yang dicari pengguna.
 * Prioritas pemeriksaan:
 * 1. Non-Kopi (wajib dicek terlebih dahulu karena frasa "non kopi" mengandung kata "kopi")
 * 2. Snack / Camilan
 * 3. Kopi
 */
export function detectMenuCategoryIntent(text: string): MenuCategoryIntent {
  const q = text.toLowerCase().trim();

  // 1. Kategori NON-KOPI (dicek pertama agar tidak false-positive ke kategori kopi)
  if (
    q.includes('non kopi') ||
    q.includes('non-kopi') ||
    q.includes('non coffee') ||
    q.includes('non-coffee') ||
    q.includes('bukan kopi') ||
    q.includes('tanpa kopi') ||
    q.includes('bebas kafein') ||
    q.includes('tidak ada kopi') ||
    q.includes('tanpa kafein') ||
    q.includes('matcha') ||
    q.includes('cokelat') ||
    q.includes('chocolate') ||
    q.includes('red velvet') ||
    q.includes('taro') ||
    q.includes('teh') ||
    q.includes('tea series') ||
    q.includes('artisan chocolate')
  ) {
    return 'non-coffee';
  }

  // 2. Kategori SNACK / CAMILAN
  if (
    q.includes('snack') ||
    q.includes('camilan') ||
    q.includes('cemilan') ||
    q.includes('makanan ringan') ||
    q.includes('makanan') ||
    q.includes('makan') ||
    q.includes('french fries') ||
    q.includes('fries') ||
    q.includes('kentang') ||
    q.includes('toast') ||
    q.includes('roti') ||
    q.includes('croissant') ||
    q.includes('dimsum') ||
    q.includes('cireng') ||
    q.includes('pastry') ||
    q.includes('kue')
  ) {
    return 'snack';
  }

  // 3. Kategori KOPI
  if (
    q.includes('menu kopi') ||
    q.includes('minuman kopi') ||
    q.includes('es kopi') ||
    q.includes('coffee') ||
    q.includes('kopi') ||
    q.includes('espresso') ||
    q.includes('latte') ||
    q.includes('cappuccino') ||
    q.includes('americano') ||
    q.includes('macchiato') ||
    q.includes('kopi susu') ||
    q.includes('kafein')
  ) {
    return 'coffee';
  }

  return 'all';
}

/**
 * 2. Strict Database Filtering via Prisma:
 * Mengambil HANYA produk yang sesuai kategori tanpa tercampur kategori lain.
 */
export async function fetchFilteredMenuProducts(intent: MenuCategoryIntent) {
  let whereClause: any = { isAvailable: true };

  if (intent === 'coffee') {
    whereClause = {
      isAvailable: true,
      OR: [
        { category: { slug: { in: ['milk-coffee', 'espresso-series'] } } },
        { category: { name: { contains: 'Coffee' } } },
        { name: { contains: 'Kopi' } },
        { name: { contains: 'Espresso' } },
        { name: { contains: 'Latte' } },
        { name: { contains: 'Americano' } },
        { name: { contains: 'Macchiato' } },
      ],
      NOT: [
        { category: { slug: 'non-coffee' } },
        { category: { slug: 'snack-pastry' } },
        { name: { contains: 'Matcha' } },
        { name: { contains: 'Chocolate' } },
        { name: { contains: 'Cokelat' } },
        { name: { contains: 'Croissant' } },
        { name: { contains: 'Kentang' } },
      ],
    };
  } else if (intent === 'non-coffee') {
    whereClause = {
      isAvailable: true,
      OR: [
        { category: { slug: 'non-coffee' } },
        { category: { name: { contains: 'Non-Coffee' } } },
      ],
      NOT: [
        { category: { slug: { in: ['milk-coffee', 'espresso-series'] } } },
        { category: { slug: 'snack-pastry' } },
        { name: { contains: 'Kopi' } },
        { name: { contains: 'Espresso' } },
        { name: { contains: 'Americano' } },
        { name: { contains: 'Macchiato' } },
      ],
    };
  } else if (intent === 'snack') {
    whereClause = {
      isAvailable: true,
      OR: [
        { category: { slug: 'snack-pastry' } },
        { category: { name: { contains: 'Snack' } } },
        { category: { name: { contains: 'Pastry' } } },
      ],
      NOT: [
        { category: { slug: { in: ['milk-coffee', 'espresso-series', 'non-coffee'] } } },
      ],
    };
  }

  const dbProducts = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: true,
      variants: true,
    },
    orderBy: { basePrice: 'asc' },
  });

  return dbProducts;
}

/**
 * Helper to fetch complete real-time database context for AI with optional strict category filter
 */
export async function fetchRealtimeDatabaseContext(menuIntent: MenuCategoryIntent = 'all'): Promise<RealtimeDatabaseContext> {
  const now = new Date();
  const [dbProducts, dbPromotions, dbVouchers, dbTables, dbBranch] = await Promise.all([
    fetchFilteredMenuProducts(menuIntent),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
    prisma.voucher.findMany({
      where: {
        isActive: true,
        expiryDate: { gte: now },
      },
    }),
    prisma.table.findMany({
      orderBy: { number: 'asc' },
    }),
    prisma.branch.findFirst({
      where: { isActive: true },
    }),
  ]);

  const availableTables = dbTables.filter((t) => t.status === 'AVAILABLE');

  const productsWithDetails = dbProducts.map((p) => {
    let caffeineLevel: 'Tinggi' | 'Sedang' | 'Bebas Kafein' = 'Sedang';
    let tasteProfile = 'Rasa seimbang dan nikmat';

    const catSlug = p.category?.slug || '';
    const nameLower = p.name.toLowerCase();

    if (catSlug === 'espresso-series' || nameLower.includes('skripsi') || nameLower.includes('double shot') || nameLower.includes('americano')) {
      caffeineLevel = 'Tinggi';
      tasteProfile = 'Bold, mantap, kaya asam chlorogenic untuk stamina & fokus nugas';
    } else if (catSlug === 'milk-coffee' || nameLower.includes('susu') || nameLower.includes('latte') || nameLower.includes('macchiato')) {
      caffeineLevel = 'Sedang';
      tasteProfile = 'Creamy susu segar, manis gurih gula aren/karamel, nyaman di lambung';
    } else if (catSlug === 'non-coffee' || nameLower.includes('matcha') || nameLower.includes('chocolate') || nameLower.includes('tea')) {
      caffeineLevel = 'Bebas Kafein';
      tasteProfile = 'Kaya antioksidan, menyegarkan, 100% aman untuk maag & lambung sensitif';
    } else if (catSlug === 'snack-pastry') {
      caffeineLevel = 'Bebas Kafein';
      tasteProfile = 'Camilan renyah, gurih/manis, teman nugas paling pas';
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category?.name || 'Kopi',
      basePrice: p.basePrice,
      description: p.description,
      isBestSeller: p.isBestSeller,
      isAvailable: p.isAvailable,
      caffeineLevel,
      tasteProfile,
      variants: p.variants.map((v) => ({
        name: v.name,
        priceAdjustment: v.priceAdjustment,
      })),
    };
  });

  return {
    storeInfo: {
      name: dbBranch?.name || 'Kopi Mahasiswa Kampus Utama',
      address: dbBranch?.address || 'Jl. Ganesha No. 10, Bandung (Dekat Gerbang Utama)',
      phone: dbBranch?.phone || '0812-3456-7890',
      operationalHours: '08:00 - 23:00 WIB (Buka Setiap Hari)',
      facilities: [
        'WiFi Super Kencang 100 Mbps (Bebas Kuota untuk Nugas)',
        'Colokan Listrik (Power Outlet) di Setiap Meja',
        'Ruang AC Study Space (Bebas Asap Rokok)',
        'Area Outdoor Smoking & Diskusi Santai',
        'Musholla Bersih & Alat Sholat Lengkap',
        'Toilet Bersih & Higienis',
        'Meja Belajar Individu & Meja Diskusi Kelompok',
      ],
    },
    tableStats: {
      total: dbTables.length,
      availableCount: availableTables.length,
      occupiedCount: dbTables.length - availableTables.length,
      availableNumbers: availableTables.map((t) => t.number),
      tables: dbTables.map((t) => ({
        number: t.number,
        capacity: t.capacity,
        status: t.status,
      })),
    },
    activePromotions: dbPromotions.map((pr) => ({
      id: pr.id,
      title: pr.title,
      description: pr.description,
      discountType: pr.discountType,
      discountPercent: pr.discountPercent,
      discountValue: pr.discountValue,
      minPurchase: pr.minPurchase,
    })),
    activeVouchers: dbVouchers.map((v) => ({
      code: v.code,
      discountType: v.discountType,
      discountAmount: v.discountAmount,
      minSpend: v.minSpend,
    })),
    products: productsWithDetails,
  };
}
