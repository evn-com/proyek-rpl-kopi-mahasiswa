/**
 * Master Data Simulasi Kopi Mahasiswa (Client-Safe & Server-Safe)
 * Digunakan sebagai data realistis di panel admin dan fallback ketika database offline.
 */

export interface SimulatedIngredient {
  id: string;
  name: string;
  unit: string;
  minimumStock: number;
  purchasePrice: number;
  supplier: string;
  expiryDate: string | null;
  currentStock: number;
  inventoryId?: string;
  isLowStock: boolean;
  recipesCount: number;
}

export interface SimulatedInventoryLog {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'USAGE';
  amount: number;
  notes: string;
  createdAt: string;
  inventory: {
    id: string;
    ingredient: {
      id: string;
      name: string;
      unit: string;
    };
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
}

export interface SimulatedUserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isGuest: boolean;
  isActive: boolean;
  membershipStatus: string | null;
  campus: string | null;
  points: number;
  createdAt: string;
}

// 1. Master Pengguna Simulasi berdasarkan Role
export const SIMULATION_USERS = {
  admin: {
    id: 'sim-user-admin',
    name: 'Admin Mahasiswa',
    email: 'admin@kopimahasiswa.id',
    phone: '081234567890',
    role: 'Admin',
  },
  owner: {
    id: 'sim-user-owner',
    name: 'Pak Owner (Pemilik)',
    email: 'owner@kopimahasiswa.id',
    phone: '081198765432',
    role: 'Owner',
  },
  barista: {
    id: 'sim-user-barista',
    name: 'Barista Budi',
    email: 'barista@kopimahasiswa.id',
    phone: '081377889900',
    role: 'Barista',
  },
  cashier: {
    id: 'sim-user-cashier',
    name: 'Kasir Siti',
    email: 'cashier@kopimahasiswa.id',
    phone: '081511223344',
    role: 'Cashier',
  },
  customer: {
    id: 'sim-user-customer',
    name: 'Dimas Aditya (Member Mahasiswa)',
    email: 'customer@kopimahasiswa.id',
    phone: '085712345678',
    role: 'Customer',
  },
};

export const SIMULATION_USER_LIST: SimulatedUserItem[] = [
  {
    id: 'sim-user-admin',
    name: 'Admin Mahasiswa',
    email: 'admin@kopimahasiswa.id',
    phone: '081234567890',
    role: 'Admin',
    isGuest: false,
    isActive: true,
    membershipStatus: null,
    campus: null,
    points: 0,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    id: 'sim-user-owner',
    name: 'Pak Owner (Pemilik)',
    email: 'owner@kopimahasiswa.id',
    phone: '081198765432',
    role: 'Owner',
    isGuest: false,
    isActive: true,
    membershipStatus: null,
    campus: null,
    points: 0,
    createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
  },
  {
    id: 'sim-user-barista',
    name: 'Barista Budi',
    email: 'barista@kopimahasiswa.id',
    phone: '081377889900',
    role: 'Barista',
    isGuest: false,
    isActive: true,
    membershipStatus: null,
    campus: null,
    points: 0,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
  },
  {
    id: 'sim-user-cashier',
    name: 'Kasir Siti',
    email: 'cashier@kopimahasiswa.id',
    phone: '081511223344',
    role: 'Cashier',
    isGuest: false,
    isActive: true,
    membershipStatus: null,
    campus: null,
    points: 0,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'sim-user-customer',
    name: 'Dimas Aditya',
    email: 'customer@kopimahasiswa.id',
    phone: '085712345678',
    role: 'Customer',
    isGuest: false,
    isActive: true,
    membershipStatus: 'APPROVED',
    campus: 'Institut Teknologi Bandung (ITB)',
    points: 350,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'sim-user-mhs-2',
    name: 'Anisa Ramadhani',
    email: 'anisa.mhs@ui.ac.id',
    phone: '081299887766',
    role: 'Customer',
    isGuest: false,
    isActive: true,
    membershipStatus: 'PENDING',
    campus: 'Universitas Indonesia (UI)',
    points: 120,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sim-user-mhs-3',
    name: 'Fajar Pratama',
    email: 'fajar.mhs@ugm.ac.id',
    phone: '082144556677',
    role: 'Customer',
    isGuest: false,
    isActive: true,
    membershipStatus: 'APPROVED',
    campus: 'Universitas Gadjah Mada (UGM)',
    points: 240,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];

// 2. Master Bahan Baku Simulasi (12 Item)
export const SIMULATION_INGREDIENTS: SimulatedIngredient[] = [
  {
    id: 'ing-1',
    name: 'Espresso House Blend 70:30 (Arabika-Robusta)',
    unit: 'gram',
    minimumStock: 1000,
    purchasePrice: 175000,
    supplier: 'PT Gayo Mandiri Perkasa',
    expiryDate: '2027-04-15',
    currentStock: 4500,
    inventoryId: 'inv-1',
    isLowStock: false,
    recipesCount: 3,
  },
  {
    id: 'ing-2',
    name: 'Fresh Milk Pasteurisasi (Greenfields)',
    unit: 'ml',
    minimumStock: 3000,
    purchasePrice: 24000,
    supplier: 'PT Greenfields Dairy Indonesia',
    expiryDate: '2026-12-05',
    currentStock: 12000,
    inventoryId: 'inv-2',
    isLowStock: false,
    recipesCount: 4,
  },
  {
    id: 'ing-3',
    name: 'Sirup Gula Aren Murni Organik',
    unit: 'ml',
    minimumStock: 1500,
    purchasePrice: 45000,
    supplier: 'Koperasi Petani Aren Lebak',
    expiryDate: '2027-08-20',
    currentStock: 6500,
    inventoryId: 'inv-3',
    isLowStock: false,
    recipesCount: 2,
  },
  {
    id: 'ing-4',
    name: 'Sirup Caramel Gourmet',
    unit: 'ml',
    minimumStock: 500,
    purchasePrice: 135000,
    supplier: 'Monin Indonesia Official',
    expiryDate: '2027-10-10',
    currentStock: 2200,
    inventoryId: 'inv-4',
    isLowStock: false,
    recipesCount: 2,
  },
  {
    id: 'ing-5',
    name: 'Sirup Hazelnut Signature',
    unit: 'ml',
    minimumStock: 500,
    purchasePrice: 130000,
    supplier: 'Toffin Indonesia Distr.',
    expiryDate: '2027-09-18',
    currentStock: 1800,
    inventoryId: 'inv-5',
    isLowStock: false,
    recipesCount: 1,
  },
  {
    id: 'ing-6',
    name: 'Pure Matcha Powder Uji Premium',
    unit: 'gram',
    minimumStock: 300,
    purchasePrice: 280000,
    supplier: 'Kyoto Tea Import Partner',
    expiryDate: '2027-06-30',
    currentStock: 1100,
    inventoryId: 'inv-6',
    isLowStock: false,
    recipesCount: 1,
  },
  {
    id: 'ing-7',
    name: 'Belgian Dark Chocolate 70% Powder',
    unit: 'gram',
    minimumStock: 500,
    purchasePrice: 165000,
    supplier: 'Barry Callebaut Indo',
    expiryDate: '2027-07-25',
    currentStock: 2400,
    inventoryId: 'inv-7',
    isLowStock: false,
    recipesCount: 1,
  },
  {
    id: 'ing-8',
    name: 'Adonan Frozen Butter Croissant',
    unit: 'pcs',
    minimumStock: 50,
    purchasePrice: 8500,
    supplier: 'Artisan Pastry Bandung',
    expiryDate: '2026-12-20',
    currentStock: 32,
    inventoryId: 'inv-8',
    isLowStock: true, // Low stock simulation alert!
    recipesCount: 1,
  },
  {
    id: 'ing-9',
    name: 'Cup Plastik PP 16oz + Custom Logo KM',
    unit: 'pcs',
    minimumStock: 300,
    purchasePrice: 450,
    supplier: 'CV Berkat Kemasan Mandiri',
    expiryDate: null,
    currentStock: 1500,
    inventoryId: 'inv-9',
    isLowStock: false,
    recipesCount: 5,
  },
  {
    id: 'ing-10',
    name: 'Paper Hot Cup 8oz Double Wall',
    unit: 'pcs',
    minimumStock: 150,
    purchasePrice: 650,
    supplier: 'CV Berkat Kemasan Mandiri',
    expiryDate: null,
    currentStock: 600,
    inventoryId: 'inv-10',
    isLowStock: false,
    recipesCount: 3,
  },
  {
    id: 'ing-11',
    name: 'Sedotan Ramah Lingkungan (Oxo-Biodegradable)',
    unit: 'pcs',
    minimumStock: 400,
    purchasePrice: 120,
    supplier: 'EcoStraw Nusantara',
    expiryDate: null,
    currentStock: 2000,
    inventoryId: 'inv-11',
    isLowStock: false,
    recipesCount: 6,
  },
  {
    id: 'ing-12',
    name: 'Kentang Beku Shoestring Cut',
    unit: 'gram',
    minimumStock: 2000,
    purchasePrice: 38000,
    supplier: 'Sumber Segar Pangan',
    expiryDate: '2027-03-12',
    currentStock: 5500,
    inventoryId: 'inv-12',
    isLowStock: false,
    recipesCount: 1,
  },
];

// 3. Mutasi & Audit Inventaris Berdasarkan User & Role
export const SIMULATION_INVENTORY_LOGS: SimulatedInventoryLog[] = [
  // A. Transaksi Admin Mahasiswa (Role: Admin)
  {
    id: 'log-1',
    type: 'IN',
    amount: 5000,
    notes: 'Restock batch mingguan biji kopi dari PT Gayo Mandiri (PO #PO-2026-001)',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    inventory: {
      id: 'inv-1',
      ingredient: {
        id: 'ing-1',
        name: 'Espresso House Blend 70:30 (Arabika-Robusta)',
        unit: 'gram',
      },
    },
    createdBy: SIMULATION_USERS.admin,
  },
  {
    id: 'log-2',
    type: 'ADJUSTMENT',
    amount: 100,
    notes: 'Penyesuaian audit fisik stok mingguan (cup rusak/reject sealer)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    inventory: {
      id: 'inv-9',
      ingredient: {
        id: 'ing-9',
        name: 'Cup Plastik PP 16oz + Custom Logo KM',
        unit: 'pcs',
      },
    },
    createdBy: SIMULATION_USERS.admin,
  },
  {
    id: 'log-3',
    type: 'IN',
    amount: 50,
    notes: 'Penerimaan adonan pastry beku dari Artisan Pastry Bandung',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    inventory: {
      id: 'inv-8',
      ingredient: {
        id: 'ing-8',
        name: 'Adonan Frozen Butter Croissant',
        unit: 'pcs',
      },
    },
    createdBy: SIMULATION_USERS.admin,
  },

  // B. Transaksi Barista Budi (Role: Barista)
  {
    id: 'log-4',
    type: 'OUT',
    amount: 750,
    notes: 'Pemakaian biji kopi operasional bar shift pagi & kalibrasi grinder mesin espresso',
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    inventory: {
      id: 'inv-1',
      ingredient: {
        id: 'ing-1',
        name: 'Espresso House Blend 70:30 (Arabika-Robusta)',
        unit: 'gram',
      },
    },
    createdBy: SIMULATION_USERS.barista,
  },
  {
    id: 'log-5',
    type: 'OUT',
    amount: 3000,
    notes: 'Pemakaian susu segar untuk order batch promo jam nugas siang mahasiswa',
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    inventory: {
      id: 'inv-2',
      ingredient: {
        id: 'ing-2',
        name: 'Fresh Milk Pasteurisasi (Greenfields)',
        unit: 'ml',
      },
    },
    createdBy: SIMULATION_USERS.barista,
  },
  {
    id: 'log-6',
    type: 'OUT',
    amount: 600,
    notes: 'Refill botol squeeze gula aren meja bar racik kopi susu',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    inventory: {
      id: 'inv-3',
      ingredient: {
        id: 'ing-3',
        name: 'Sirup Gula Aren Murni Organik',
        unit: 'ml',
      },
    },
    createdBy: SIMULATION_USERS.barista,
  },
  {
    id: 'log-7',
    type: 'OUT',
    amount: 18,
    notes: 'Pemanggangan oven kloter 1 untuk pesanan Paket Skripsi Begadang',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    inventory: {
      id: 'inv-8',
      ingredient: {
        id: 'ing-8',
        name: 'Adonan Frozen Butter Croissant',
        unit: 'pcs',
      },
    },
    createdBy: SIMULATION_USERS.barista,
  },
  {
    id: 'log-8',
    type: 'OUT',
    amount: 150,
    notes: 'Pemakaian pure matcha powder untuk 10 porsi pesanan Matcha Latte Iced',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    inventory: {
      id: 'inv-6',
      ingredient: {
        id: 'ing-6',
        name: 'Pure Matcha Powder Uji Premium',
        unit: 'gram',
      },
    },
    createdBy: SIMULATION_USERS.barista,
  },

  // C. Transaksi Kasir Siti (Role: Cashier)
  {
    id: 'log-9',
    type: 'OUT',
    amount: 120,
    notes: 'Pengambilan cup takeaway & sealer lid dari gudang ke etalase counter kasir',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    inventory: {
      id: 'inv-9',
      ingredient: {
        id: 'ing-9',
        name: 'Cup Plastik PP 16oz + Custom Logo KM',
        unit: 'pcs',
      },
    },
    createdBy: SIMULATION_USERS.cashier,
  },
  {
    id: 'log-10',
    type: 'OUT',
    amount: 100,
    notes: 'Pengisian dispenser sedotan counter kasir & pick-up area',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    inventory: {
      id: 'inv-11',
      ingredient: {
        id: 'ing-11',
        name: 'Sedotan Ramah Lingkungan (Oxo-Biodegradable)',
        unit: 'pcs',
      },
    },
    createdBy: SIMULATION_USERS.cashier,
  },

  // D. Transaksi Pak Owner (Role: Owner)
  {
    id: 'log-11',
    type: 'IN',
    amount: 1000,
    notes: 'Approval penerimaan pengadaan matcha grade ceremonial langsung dari supplier',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    inventory: {
      id: 'inv-6',
      ingredient: {
        id: 'ing-6',
        name: 'Pure Matcha Powder Uji Premium',
        unit: 'gram',
      },
    },
    createdBy: SIMULATION_USERS.owner,
  },
  {
    id: 'log-12',
    type: 'ADJUSTMENT',
    amount: 500,
    notes: 'Koreksi selisih hitung inventaris akhir bulan saat audit bersama Owner',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    inventory: {
      id: 'inv-4',
      ingredient: {
        id: 'ing-4',
        name: 'Sirup Caramel Gourmet',
        unit: 'ml',
      },
    },
    createdBy: SIMULATION_USERS.owner,
  },

  // E. Transaksi Pelanggan / Otomatisasi Resep Order (Role: Customer)
  {
    id: 'log-13',
    type: 'OUT',
    amount: 40,
    notes: 'Otomatis terpotong via sistem resep pesanan order #KM-8821 (Kopi Susu Mahasiswa)',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    inventory: {
      id: 'inv-3',
      ingredient: {
        id: 'ing-3',
        name: 'Sirup Gula Aren Murni Organik',
        unit: 'ml',
      },
    },
    createdBy: SIMULATION_USERS.customer,
  },
  {
    id: 'log-14',
    type: 'OUT',
    amount: 1,
    notes: 'Otomatis terpotong via sistem resep pesanan order #KM-8821 (Cup Takeaway 16oz)',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    inventory: {
      id: 'inv-9',
      ingredient: {
        id: 'ing-9',
        name: 'Cup Plastik PP 16oz + Custom Logo KM',
        unit: 'pcs',
      },
    },
    createdBy: SIMULATION_USERS.customer,
  },
];

// 4. Alert Stok Rendah
export const SIMULATION_LOW_STOCK = [
  {
    ingredientName: 'Adonan Frozen Butter Croissant',
    currentStock: 32,
    minimumStock: 50,
    unit: 'pcs',
  },
];

// 5. Statistik Dashboard Simulasi
export const SIMULATION_STATS = {
  totalProducts: 11,
  totalCategories: 4,
  lowStockCount: 1,
  todayRevenue: 384000,
  todayOrdersCount: 18,
  totalIngredients: 12,
  pendingMembersCount: 1,
};

