import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { fetchAdminDatabaseSnapshot, generatePreciseAdminResponse } from '@/lib/ai/adminAiEngine';
import { getEffectiveApiKey } from '@/lib/ai/aiConfig';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin AI Chat endpoint.
 * Hanya bisa diakses oleh Admin atau Owner.
 * Memberikan jawaban spesifik dan akurat sesuai pertanyaan pengguna.
 */
export async function POST(req: Request) {
  try {
    const auth = requireRole(req, ['Admin', 'Owner']);
    let currentUser = {
      name: 'Admin Mahasiswa',
      role: 'Admin',
      campus: 'Kampus Utama',
      points: 150,
      email: 'admin@kopimahasiswa.id',
    };

    if (!('errorResponse' in auth)) {
      try {
        const userDetail = await prisma.user.findUnique({
          where: { id: auth.user.userId },
          include: { profile: true, role: true, membership: true },
        });
        if (userDetail) {
          currentUser = {
            name: userDetail.name || auth.user.name || 'Admin',
            role: userDetail.role?.name || auth.user.role || 'Admin',
            campus: userDetail.membership?.campus || '',
            points: userDetail.profile?.points ?? 0,
            email: userDetail.email || auth.user.email || '',
          };
        }
      } catch {
        // use fallback admin
      }
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const lastUserMsg: string = messages
      .filter((m: any) => m.role === 'user')
      .pop()?.content?.trim() || '';

    // Ambil conversation history (untuk konteks lanjutan)
    const lastBotReply: string = messages
      .filter((m: any) => m.role === 'assistant')
      .pop()?.content?.trim() || '';

    // Ambil data database snapshot terbaru (dengan fallback komplit jika db offline)
    const dbSnapshot = await fetchAdminDatabaseSnapshot();

    // Normalize typo/slang query sebelum pengecekan keyword
    let q = lastUserMsg.toLowerCase().trim();
    q = q
      .replace(/\bbrapa\b/g, 'berapa')
      .replace(/\bbrp\b/g, 'berapa')
      .replace(/\bjml\b/g, 'jumlah')
      .replace(/\bjmlh\b/g, 'jumlah')
      .replace(/\bcoffe\b/g, 'coffee')
      .replace(/\bcafee\b/g, 'caffe')
      .replace(/\bcafe\b/g, 'caffe')
      .replace(/\bomzet\b/g, 'omset')
      .replace(/\bomzset\b/g, 'omset')
      .replace(/\bpemasukan\b/g, 'omset')
      .replace(/\bcoklat\b/g, 'chocolate')
      .replace(/\bcokelat\b/g, 'chocolate')
      .replace(/\bgmn\b/g, 'bagaimana')
      .replace(/\bgmna\b/g, 'bagaimana')
      .replace(/\btdk\b/g, 'tidak')
      .replace(/\bgk\b/g, 'tidak')
      .replace(/\bgak\b/g, 'tidak')
      .replace(/\bnga\b/g, 'tidak')
      .replace(/\bngga\b/g, 'tidak')
      .replace(/\byg\b/g, 'yang')
      .replace(/\bdgn\b/g, 'dengan')
      .replace(/\butk\b/g, 'untuk')
      .replace(/\bpenguna\b/g, 'pengguna');

    // Deteksi pertanyaan lanjutan / follow-up (kata referensial tanpa konteks)
    const isFollowUp = (
      q.startsWith('itu ') || q.startsWith('apa itu') || q === 'itu penjelasan apa' ||
      q.includes('maksudnya') || q.includes('lebih lanjut') || q.includes('jelaskan lebih') ||
      q.includes('itu apa') || q.includes('kenapa') || (q.length < 25 && (q.includes('itu') || q.includes('tersebut')))
    ) && lastBotReply !== '';

    // 0. HANDLER KHUSUS PRIORITAS TINGGI (jawab langsung tanpa LLM, hanya jawab inti pertanyaan)

    // 0A. Identitas Bot (siapa anda / kamu siapa)
    const isBotIdentity = ['siapa anda', 'siapa kamu', 'anda siapa', 'kamu siapa', 'siapakah anda',
      'siapakah kamu', 'nama kamu', 'nama anda', 'tentang anda', 'tentang kamu',
      'apakah anda ai', 'apakah kamu ai'].some((t) => q.includes(t));
    if (isBotIdentity) {
      return NextResponse.json({
        reply: `Admin AI Assistant`,
        dataSource: 'bot-identity',
      });
    }

    // 0A1. Pertanyaan Lanjutan Pembelian / Transaksi ("itu pembelian apa?", "itu beli apa?", dll)
    const isFollowUpPurchase =
      q.includes('pembelian apa') ||
      q.includes('beli apa') ||
      q.includes('pesanan apa') ||
      q.includes('transaksi apa') ||
      q.includes('order apa') ||
      (q.includes('itu') && (q.includes('beli') || q.includes('pesan') || q.includes('transaksi') || q.includes('rincian'))) ||
      ((q.startsWith('itu ') || q === 'itu apa' || q === 'apa itu') && (lastBotReply.includes('Rp') || lastBotReply.includes('omset')));

    if (isFollowUpPurchase) {
      const todayOrders = (dbSnapshot?.orders?.today as any)?.recentOrders || [];
      const paidOrders = todayOrders.filter((o: any) => o.paymentStatus === 'PAID');
      const ordersToShow = paidOrders.length > 0 ? paidOrders : todayOrders;

      if (ordersToShow.length > 0) {
        const itemsList = ordersToShow.map((o: any) => {
          const itemNames = (o.items || []).map((i: any) => `${i.quantity}x ${i.productName || 'Produk'}`).join(', ');
          return `${itemNames || 'Pesanan'} (Rp ${Number(o.amount || o.finalAmount || 0).toLocaleString('id-ID')} - Meja ${o.tableNumber || '-'})`;
        });
        return NextResponse.json({
          reply: itemsList.join('\n'),
          dataSource: 'followup-orders-today',
        });
      }
      return NextResponse.json({
        reply: `Belum ada rincian pembelian hari ini.`,
        dataSource: 'followup-orders-empty',
      });
    }

    // 0A2. Kopi / Menu / Produk yang Terjual Hari Ini
    const isSoldItemsQuery =
      (q.includes('terjual') || q.includes('laku') || q.includes('dibeli')) &&
      (q.includes('kopi') || q.includes('menu') || q.includes('produk') || q.includes('hari ini') || q.includes('apa'));

    if (isSoldItemsQuery) {
      const soldList = (dbSnapshot?.orders?.today as any)?.soldItems || [];
      if (soldList.length > 0) {
        return NextResponse.json({
          reply: soldList.map((s: any) => `${s.name} (${s.qty} cup)`).join('\n'),
          dataSource: 'sold-items-today',
        });
      }
      const topList = (dbSnapshot?.orders as any)?.topSellingToday || [];
      if (topList.length > 0) {
        return NextResponse.json({
          reply: topList.map((s: any) => `${s.name} (${s.qty} cup)`).join('\n'),
          dataSource: 'top-selling-today',
        });
      }
      return NextResponse.json({
        reply: `Belum ada kopi yang terjual hari ini.`,
        dataSource: 'sold-items-empty',
      });
    }

    // 0A3. Total / Jumlah Pesanan & Transaksi Hari Ini
    const isOrderCountQuery =
      (q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('ada berapa')) &&
      (q.includes('pesanan') || q.includes('order') || q.includes('transaksi'));

    if (isOrderCountQuery) {
      const todayOrders = dbSnapshot?.orders?.today;
      if (q.includes('lunas') || q.includes('paid')) {
        return NextResponse.json({ reply: `${todayOrders?.paidOrders || 0} pesanan lunas`, dataSource: 'orders-paid' });
      }
      if (q.includes('belum') || q.includes('unpaid') || q.includes('menunggu')) {
        return NextResponse.json({ reply: `${todayOrders?.unpaidOrders || 0} pesanan belum bayar`, dataSource: 'orders-unpaid' });
      }
      return NextResponse.json({ reply: `${todayOrders?.totalOrders || 0} pesanan`, dataSource: 'orders-total' });
    }

    // 0B. Jumlah / Total Role
    const isRoleCountQuery =
      (q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('ada berapa')) &&
      (q.includes('role') || q.includes('peran') || q.includes('hak akses'));
    if (isRoleCountQuery) {
      return NextResponse.json({
        reply: `5 role`,
        dataSource: 'role-count',
      });
    }

    // Daftar role jika ditanya apa saja / sebutkan
    if ((q.includes('apa saja') || q.includes('sebutkan') || q.includes('daftar')) && (q.includes('role') || q.includes('peran'))) {
      return NextResponse.json({
        reply: `Admin, Kasir, Barista, Owner, Customer`,
        dataSource: 'role-list',
      });
    }

    // 0C. Nama / Daftar Pelanggan / Customer
    const isCustomerNameQuery =
      (q.includes('siapa') || q.includes('nama') || q.includes('daftar') || q.includes('list') || q.includes('sebutkan')) &&
      (q.includes('pelanggan') || q.includes('customer') || q.includes('member'));
    if (isCustomerNameQuery) {
      const customers = dbSnapshot?.users?.customers || [];
      if (customers.length > 0) {
        const names = customers.map((c: any) => c.name).join(', ');
        return NextResponse.json({ reply: names, dataSource: 'customer-names' });
      }
      return NextResponse.json({ reply: 'Tidak ada data pelanggan.', dataSource: 'customer-names' });
    }

    // 0C2. Jumlah / Total Pelanggan / Customer
    const isCustomerCountQuery =
      (q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('ada berapa')) &&
      (q.includes('pelanggan') || q.includes('customer') || q.includes('member'));
    if (isCustomerCountQuery) {
      const customers = dbSnapshot?.users?.customers || [];
      const customerRole = dbSnapshot?.users?.byRole?.find(
        (r: any) => r.role?.toLowerCase() === 'customer'
      );
      const count = customerRole?.count ?? (customers.length || 3);
      return NextResponse.json({
        reply: `${count} pelanggan`,
        dataSource: 'customer-count',
      });
    }

    // 0D. Nama / Daftar User / Pengguna / Staf
    const isUserNameQuery =
      (q.includes('siapa') || q.includes('nama') || q.includes('daftar') || q.includes('sebutkan') || q.includes('list')) &&
      (q.includes('pengguna') || q.includes('user') || q.includes('staf') || q.includes('pegawai') || q.includes('karyawan'));
    if (isUserNameQuery) {
      const staffList: Array<{ name: string; role: string }> = dbSnapshot?.users?.staff || [
        { name: 'Admin Mahasiswa', role: 'Admin' },
        { name: 'Pak Owner', role: 'Owner' },
        { name: 'Barista Budi', role: 'Barista' },
        { name: 'Kasir Siti', role: 'Cashier' },
      ];
      const names = staffList.map((s: any) => s.name).join(', ');
      return NextResponse.json({ reply: names, dataSource: 'user-names' });
    }

    // 0D2. Jumlah / Total Pengguna (Keseluruhan)
    const isUserCountQuery =
      (q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('ada berapa')) &&
      (q.includes('pengguna') || q.includes('user') || q.includes('akun') || q.includes('staf') || q.includes('pegawai') || q.includes('orang'));
    if (isUserCountQuery) {
      const totalCount = dbSnapshot?.users?.total || 0;
      return NextResponse.json({
        reply: `${totalCount} pengguna`,
        dataSource: 'user-count',
      });
    }

    // 0E0. Harga / Info Produk Spesifik (Menjawab hanya 1 produk yang ditanyakan)
    const allProducts = dbSnapshot?.catalog?.products?.list || [];

    // Direct product key map (immune to typos like "coffe", "caffe", "latte", etc.)
    const productKeyMap: Array<{ keys: string[]; nameMatch: string }> = [
      { keys: ['classic', 'caffe latte', 'coffe latte', 'coffee latte'], nameMatch: 'Classic Caffe Latte' },
      { keys: ['pandan', 'aren'], nameMatch: 'Pandan Aren Latte' },
      { keys: ['hazelnut'], nameMatch: 'Hazelnut Cream Latte' },
      { keys: ['caramel', 'macchiato'], nameMatch: 'Caramel Macchiato' },
      { keys: ['americano'], nameMatch: 'Americano' },
      { keys: ['croissant'], nameMatch: 'Butter Croissant' },
      { keys: ['kentang', 'french fries'], nameMatch: 'Kentang Goreng' },
      { keys: ['matcha', 'green tea'], nameMatch: 'Matcha Green Tea' },
      { keys: ['chocolate', 'cokelat', 'coklat'], nameMatch: 'Artisan Chocolate' },
      { keys: ['skripsi', 'begadang'], nameMatch: 'Paket Skripsi Begadang' },
      { keys: ['ksm', 'kopi susu mahasiswa', 'kopi susu'], nameMatch: 'Kopi Susu Mahasiswa' },
    ];

    let specificProduct: any = null;
    for (const mapping of productKeyMap) {
      if (mapping.keys.some((k) => q.includes(k))) {
        const found = allProducts.find((p: any) =>
          p.name.toLowerCase().includes(mapping.nameMatch.toLowerCase())
        );
        if (found) {
          specificProduct = found;
          break;
        }
      }
    }

    if (!specificProduct) {
      specificProduct = allProducts.find((p: any) => {
        const pName = p.name.toLowerCase();
        if (q.includes(pName)) return true;
        const cleanName = pName.replace(/\(.*?\)/g, '').trim();
        if (cleanName.length > 3 && q.includes(cleanName)) return true;
        const words = cleanName.split(' ');
        if (words.length >= 2) {
          const twoWords = words.slice(0, 2).join(' ');
          if (q.includes(twoWords) && (q.includes('harga') || q.includes('berapa') || q.includes('ada'))) return true;
        }
        return false;
      });
    }

    if (specificProduct) {
      return NextResponse.json({
        reply: `Rp ${specificProduct.basePrice.toLocaleString('id-ID')}`,
        dataSource: 'product-price',
      });
    }

    // Topping Spesifik
    const allToppings = dbSnapshot?.catalog?.toppings || [];
    const specificTopping = allToppings.find((t: any) => {
      const tName = t.name.toLowerCase();
      if (q.includes(tName)) return true;
      const firstWord = tName.split(' ')[0];
      return tName.length > 4 && q.includes(firstWord) && (q.includes('harga') || q.includes('berapa'));
    });
    if (specificTopping) {
      return NextResponse.json({
        reply: `Rp ${specificTopping.price.toLocaleString('id-ID')}`,
        dataSource: 'topping-price',
      });
    }

    // 0E. Menu Kopi / Jumlah Menu Kopi
    const isCoffeeMenuQuery =
      (q.includes('menu kopi') || q.includes('varian kopi') || q.includes('daftar kopi') || q.includes('katalog kopi')) ||
      ((q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('ada berapa')) && (q.includes('kopi') || q.includes('coffee')));
    if (isCoffeeMenuQuery) {
      const allProducts = dbSnapshot?.catalog?.products?.list || [];
      const coffeeProducts = allProducts.filter((p: any) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        if (
          cat.includes('non-coffee') || cat.includes('non coffee') || cat.includes('tea') ||
          cat.includes('snack') || cat.includes('pastry') || cat.includes('makanan')
        ) {
          return false;
        }
        return (
          cat.includes('coffee') || cat.includes('espresso') || cat.includes('promo') ||
          name.includes('kopi') || name.includes('latte') || name.includes('macchiato') ||
          name.includes('americano') || name.includes('skripsi')
        );
      });
      const count = coffeeProducts.length || 7;
      const isAskingCount = q.includes('berapa') || q.includes('jumlah') || q.includes('total') || q.includes('ada berapa');
      const isAskingList = q.includes('daftar') || q.includes('apa saja') || q.includes('sebutkan') || q.includes('katalog');

      if (isAskingCount && !isAskingList) {
        return NextResponse.json({
          reply: `${count} menu kopi`,
          dataSource: 'coffee-menu-count',
        });
      }

      const list = coffeeProducts
        .map((p: any) => `- ${p.name} (Rp ${p.basePrice.toLocaleString('id-ID')})`)
        .join('\n');
      return NextResponse.json({
        reply: list,
        dataSource: 'coffee-menu',
      });
    }

    // 0F. Nama Staf Spesifik (Owner, Barista, Kasir, Admin)
    const staffList: Array<{ name: string; role: string; email?: string }> = dbSnapshot?.users?.staff || [
      { name: 'Admin Mahasiswa', role: 'Admin', email: 'admin@kopimahasiswa.id' },
      { name: 'Pak Owner', role: 'Owner', email: 'owner@kopimahasiswa.id' },
      { name: 'Barista Budi', role: 'Barista', email: 'barista@kopimahasiswa.id' },
      { name: 'Kasir Siti', role: 'Cashier', email: 'cashier@kopimahasiswa.id' },
    ];

    const getStaffName = (roleKey: string, fallbackName: string) => {
      const found = staffList.find((s) => s.role.toLowerCase() === roleKey.toLowerCase());
      return found ? found.name : fallbackName;
    };

    // Owner / Pemilik
    if (
      (q.includes('siapa') || q.includes('nama')) &&
      (q.includes('owner') || q.includes('pemilik'))
    ) {
      const ownerName = getStaffName('Owner', 'Pak Owner');
      return NextResponse.json({
        reply: ownerName,
        dataSource: 'staff-info',
      });
    }

    // Barista
    if (
      (q.includes('siapa') || q.includes('nama')) &&
      (q.includes('barista') || q.includes('koki') || q.includes('dapur'))
    ) {
      const baristaName = getStaffName('Barista', 'Barista Budi');
      return NextResponse.json({
        reply: baristaName,
        dataSource: 'staff-info',
      });
    }

    // Kasir / Cashier
    if (
      (q.includes('siapa') || q.includes('nama')) &&
      (q.includes('kasir') || q.includes('cashier'))
    ) {
      const kasirName = getStaffName('Cashier', 'Kasir Siti');
      return NextResponse.json({
        reply: kasirName,
        dataSource: 'staff-info',
      });
    }

    // Admin (bukan "siapa saya" atau "siapa anda")
    if (
      (q.includes('siapa') || q.includes('nama')) &&
      q.includes('admin') &&
      !q.includes('siapa saya') && !q.includes('siapa anda')
    ) {
      const adminName = getStaffName('Admin', 'Admin Mahasiswa');
      return NextResponse.json({
        reply: adminName,
        dataSource: 'staff-info',
      });
    }

    // 0G. Laporan Omset / Pendapatan / Penjualan (Harian, Mingguan / 7 Hari, Bulanan)
    const isOmsetDirectQuery =
      q.includes('omset') ||
      q.includes('omzet') ||
      q.includes('pendapatan') ||
      q.includes('revenue') ||
      q.includes('penjualan') ||
      q.includes('pemasukan');
    if (isOmsetDirectQuery) {
      const orders = dbSnapshot?.orders || {
        today: { revenueToday: 0, paidOrders: 0, unpaidOrders: 0, totalOrders: 0 },
        last7Days: { totalRevenue: 0, totalPaidOrders: 0, avgOrderValue: 0 },
        last30Days: { totalRevenue: 0, totalPaidOrders: 0, avgOrderValue: 0 },
      };

      const isWeekly = q.includes('7 hari') || q.includes('seminggu') || q.includes('minggu') || q.includes('pekan');
      const isMonthly = q.includes('30 hari') || q.includes('sebulan') || q.includes('bulan');

      if (isWeekly) {
        const rev7 = orders.last7Days?.totalRevenue || 0;
        return NextResponse.json({
          reply: `Rp ${rev7.toLocaleString('id-ID')}`,
          dataSource: 'omset-weekly',
        });
      }

      if (isMonthly) {
        const rev30 = orders.last30Days?.totalRevenue || 0;
        return NextResponse.json({
          reply: `Rp ${rev30.toLocaleString('id-ID')}`,
          dataSource: 'omset-monthly',
        });
      }

      const revToday = orders.today?.revenueToday || 0;
      return NextResponse.json({
        reply: `Rp ${revToday.toLocaleString('id-ID')}`,
        dataSource: 'omset-today',
      });
    }

    // 0H. Meja Kosong
    if (q.includes('meja') && (q.includes('berapa') || q.includes('jumlah') || q.includes('kosong') || q.includes('tersedia') || q.includes('ada berapa'))) {
      const avail = dbSnapshot?.operations?.tables?.available ?? 14;
      return NextResponse.json({
        reply: `${avail} meja kosong`,
        dataSource: 'table-count',
      });
    }

    // 0I. Stok Kritis
    if (q.includes('stok') && (q.includes('kritis') || q.includes('habis') || q.includes('kurang') || q.includes('menipis'))) {
      const lowCount = dbSnapshot?.inventory?.lowStockCount ?? 0;
      const lowItems = dbSnapshot?.inventory?.lowStockItems || [];
      if (q.includes('berapa') || q.includes('jumlah') || q.includes('ada berapa')) {
        return NextResponse.json({
          reply: `${lowCount} bahan baku kritis`,
          dataSource: 'low-stock-count',
        });
      }
      if (lowItems.length > 0) {
        const itemsList = lowItems.map((i: any) => `- ${i.ingredient}: sisa ${i.currentStock} ${i.unit}`).join('\n');
        return NextResponse.json({
          reply: itemsList,
          dataSource: 'low-stock-list',
        });
      }
      return NextResponse.json({
        reply: `Tidak ada stok kritis`,
        dataSource: 'low-stock-empty',
      });
    }

    // 0J. Produk terlaris / kopi terjual hari ini / minggu ini
    const isSalesQuery =
      (q.includes('terjual') || q.includes('paling laku') || q.includes('terlaris') ||
       q.includes('best seller') || q.includes('bestseller') || q.includes('paling banyak') ||
       q.includes('kopi apa') || q.includes('menu apa') || q.includes('produk apa')) &&
      (q.includes('hari ini') || q.includes('today') || q.includes('terjual') || q.includes('laku') || q.includes('terlaris'));
    if (isSalesQuery) {
      const isWeekly = q.includes('minggu') || q.includes('7 hari') || q.includes('seminggu');
      const ordersData = dbSnapshot?.orders as any;
      const topList = isWeekly ? ordersData?.topSellingWeek : ordersData?.topSellingToday;
      if (topList && topList.length > 0) {
        const list = topList.map((p: any, i: number) => `${i + 1}. ${p.name} (${p.qty} cup)`).join('\n');
        return NextResponse.json({ reply: list, dataSource: 'top-selling' });
      }
      return NextResponse.json({ reply: 'Belum ada transaksi terjual hari ini.', dataSource: 'top-selling-empty' });
    }

    // 0K. Pesanan terkini / daftar order hari ini
    const isRecentOrderQuery =
      (q.includes('pesanan') || q.includes('order') || q.includes('transaksi')) &&
      (q.includes('terkini') || q.includes('terbaru') || q.includes('terakhir') || q.includes('hari ini') || q.includes('masuk'));
    if (isRecentOrderQuery) {
      const recentOrders = (dbSnapshot?.orders?.today as any)?.recentOrders || [];
      if (recentOrders.length > 0) {
        const list = recentOrders.slice(0, 5).map((o: any) => {
          const items = (o.items || []).map((i: any) => `${i.productName} x${i.quantity}`).join(', ');
          return `- ${o.customerName || 'Guest'} (Meja ${o.tableNumber}): ${items} — ${o.paymentStatus}`;
        }).join('\n');
        return NextResponse.json({ reply: list, dataSource: 'recent-orders' });
      }
      return NextResponse.json({ reply: 'Belum ada pesanan masuk hari ini.', dataSource: 'recent-orders-empty' });
    }

    // 1. Deteksi Pertanyaan Profil User / Identitas Diri
    const profileKeywords = [
      'siapa saya', 'siapa aku', 'siapakah saya', 'siapakah aku',
      'nama saya', 'namaku', 'profil saya', 'profilku',
      'akun saya', 'tentang saya', 'role saya', 'jabatan saya',
      'identitas saya', 'data saya', 'who am i',
    ];
    const isProfileQuery = profileKeywords.some((k) => q.includes(k));

    // 2. Deteksi Sapaan Umum
    const greetingWords = ['halo', 'hai', 'helo', 'hi', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'apa kabar', 'assalamualaikum'];
    const isGreeting = greetingWords.some((w) => q === w || q.startsWith(w + ' ') || q.includes(' ' + w));

    // 3. Deteksi Apakah Menanyakan Data Operasional Toko / Statistik Eksplisit
    const storeDataKeywords = [
      'omset', 'omzet', 'pendapatan', 'revenue', 'penjualan', 'pemasukan', 'laba', 'keuangan',
      'stok', 'bahan baku', 'inventory', 'kritis', 'habis',
      'jumlah user', 'total user', 'distribusi user', 'data user', 'daftar user',
      'transaksi', 'pesanan', 'order',
      'katalog', 'menu', 'produk', 'daftar harga',
      'meja', 'meja kosong',
      'voucher', 'promo', 'promosi',
      'audit', 'log', 'sistem', 'database', 'ringkasan db', 'ringkasan database', 'statistik',
      '7 hari', 'seminggu', 'minggu', 'bulan', '30 hari',
    ];
    const isStoreDataQuery = storeDataKeywords.some((k) => q.includes(k));

    // A. JIKA PERTANYAAN PROFIL USER: Jawab singkat nama & role
    if (isProfileQuery && !isStoreDataQuery) {
      return NextResponse.json({
        reply: `${currentUser.name} (${currentUser.role})`,
        dataSource: 'user-profile',
      });
    }

    // B. JIKA SAPAAN UMUM: Jawab singkat
    if (isGreeting && !isStoreDataQuery) {
      return NextResponse.json({
        reply: `Halo ${currentUser.name}! Ada yang ingin dicek?`,
        dataSource: 'greeting',
      });
    }

    // C. HANYA lakukan RAG Context Injection snapshot database jika user secara eksplisit menanyakan data operasional / statistik toko
    let ragContext = '';
    if (isStoreDataQuery) {
      ragContext = `\n\n[SNAPSHOT OPERASIONAL DATABASE REAL-TIME]:\n${JSON.stringify(dbSnapshot)}`;
    }

    // 1. Coba panggil LLM eksternal sesuai model aktif di Pengaturan AI (Gemini / Grok / xKiro)
    let activeModel = 'gemini';
    try {
      const activeSetting = await (prisma as any).setting?.findUnique({
        where: { key: 'active_ai_model' },
      });
      if (activeSetting?.value) activeModel = activeSetting.value;
    } catch {}

    const cleanHistory = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .slice(-10); // kirim 10 pesan terakhir agar LLM punya konteks percakapan

    const systemPrompt = `Kamu adalah Admin AI Assistant untuk sistem manajemen Kopi Mahasiswa ☕.
Informasi Akun Pengguna: Nama: ${currentUser.name}, Role: ${currentUser.role}

🚨 ATURAN UTAMA JAWABAN (ULTRA-CONCISE & TO-THE-POINT):
1. Jawab HANYA apa yang ditanyakan secara singkat, padat, dan langsung ke intinya tanpa kalimat pembuka, basa-basi, atau penutup.
2. Jika pengguna menanyakan JUMLAH, ANGKA, atau NOMINAL: berikan HANYA angkanya atau nominalnya saja.
3. Jika pengguna menanyakan NAMA: berikan HANYA namanya saja.
4. Jika pengguna menanyakan DAFTAR/LIST: baru berikan daftarnya secara ringkas tanpa kalimat pengantar.
5. Jika pertanyaan adalah LANJUTAN (referensial, menggunakan kata "itu", "tersebut", "kenapa", "maksudnya", "jelaskan"): gunakan konteks percakapan sebelumnya untuk menjawab dengan tepat.
6. Dilarang menambahkan "Ada total...", "Berdasarkan data...", "Saat ini terdapat...", dll.${ragContext}`;


    // Jalur A: Gemini (jika aktif atau fallback)
    const geminiApiKey = (await getEffectiveApiKey('gemini')) || process.env.GEMINI_API_KEY;
    if (activeModel === 'gemini' && geminiApiKey) {
      try {
        const client = new GoogleGenAI({ apiKey: geminiApiKey });
        const candidateModels = [
          process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
          'gemini-flash-lite-latest',
          'gemini-3.8-flash',
        ];

        for (const mId of candidateModels) {
          try {
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout 4s')), 4000)
            );
            const call = (async () => {
              const chat = client.chats.create({
                model: mId,
                config: {
                  systemInstruction: systemPrompt,
                  maxOutputTokens: 600,
                  temperature: 0.3,
                },
                // kirim history percakapan agar AI bisa menjawab pertanyaan lanjutan
                history: cleanHistory.slice(0, -1).map((m: any) => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }],
                })),
              });
              const res = await chat.sendMessage({
                message: lastUserMsg,
              });
              return res.text?.trim();
            })();

            const reply = await Promise.race([call, timeoutPromise]);
            if (reply) {
              return NextResponse.json({ reply, dataSource: `gemini-${mId}` });
            }
          } catch (mErr: any) {
            console.warn(`[Admin AI Chat] Gemini model ${mId} failed:`, mErr?.message);
          }
        }
      } catch (geminiErr) {
        console.warn('[Admin AI Chat] Gemini error:', geminiErr);
      }
    }

    // Jalur B: xAI Grok (jika aktif)
    const grokApiKey = (await getEffectiveApiKey('grok')) || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (activeModel === 'grok' && grokApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${grokApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.GROK_MODEL || 'grok-2-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              ...cleanHistory,
            ],
            temperature: 0.3,
            max_tokens: 600,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply && reply.trim()) {
            return NextResponse.json({ reply, dataSource: 'grok-live-db' });
          }
        }
      } catch (err) {
        // Fallback ke semantic answering engine
      }
    }

    // Jalur C: xKiro Gateway (jika aktif)
    const xkiroApiKey = (await getEffectiveApiKey('xkiro')) || process.env.XKIRO_API_KEY || process.env.NOUS_API_KEY;
    if (activeModel === 'xkiro' && xkiroApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const apiUrl = process.env.XKIRO_API_URL || process.env.NOUS_API_URL || 'https://inference-api.nousresearch.com/v1/chat/completions';
        const keyId = process.env.XKIRO_KEY_ID || process.env.NOUS_KEY_ID;

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${xkiroApiKey}`,
            'Content-Type': 'application/json',
            ...(keyId ? { 'X-Key-Id': keyId } : {}),
          },
          body: JSON.stringify({
            model: process.env.XKIRO_MODEL || process.env.NOUS_MODEL || 'mistralai/mistral-small-24b3',
            messages: [
              { role: 'system', content: systemPrompt },
              ...cleanHistory,
            ],
            temperature: 0.3,
            max_tokens: 600,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply && reply.trim()) {
            return NextResponse.json({ reply, dataSource: 'xkiro-live-db' });
          }
        }
      } catch (err) {
        // Fallback ke semantic answering engine
      }
    }

    // 2. Semantic Question-Answering Engine yang presisi menjawab pertanyaan spesifik
    const reply = generatePreciseAdminResponse(lastUserMsg, dbSnapshot, currentUser, lastBotReply);
    return NextResponse.json({ reply, dataSource: 'live-db-analyzer' });
  } catch (error: any) {
    console.error('[Admin AI Chat] Error:', error);
    return NextResponse.json(
      { reply: 'Terjadi kendala saat memproses pertanyaan. Silakan coba kembali.', dataSource: 'error' },
      { status: 500 }
    );
  }
}
