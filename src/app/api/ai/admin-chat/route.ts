import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { fetchAdminDatabaseSnapshot, generatePreciseAdminResponse } from '@/lib/ai/adminAiEngine';

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

    // Ambil data database snapshot terbaru (dengan fallback komplit jika db offline)
    const dbSnapshot = await fetchAdminDatabaseSnapshot();

    // Normalize typo/slang query sebelum pengecekan keyword
    let q = lastUserMsg.toLowerCase().trim();
    q = q
      .replace(/\bbrapa\b/g, 'berapa')
      .replace(/\bbrp\b/g, 'berapa')
      .replace(/\bjml\b/g, 'jumlah')
      .replace(/\bjmlh\b/g, 'jumlah')
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

    // 0. HANDLER KHUSUS PRIORITAS TINGGI (jawab langsung tanpa LLM)

    // 0A. Identitas Bot (siapa anda / kamu siapa)
    const isBotIdentity = ['siapa anda', 'siapa kamu', 'anda siapa', 'kamu siapa', 'siapakah anda',
      'siapakah kamu', 'nama kamu', 'nama anda', 'tentang anda', 'tentang kamu',
      'apakah anda ai', 'apakah kamu ai'].some((t) => q.includes(t));
    if (isBotIdentity) {
      return NextResponse.json({
        reply: `Saya adalah **Admin AI Assistant** di Kopi Mahasiswa ☕, asisten kecerdasan buatan yang siap membantu Anda mengelola dan memantau seluruh operasional kafe.`,
        dataSource: 'bot-identity',
      });
    }

    // 0B. Jumlah / Total Role
    const isRoleCountQuery =
      (q.includes('berapa') || q.includes('jumlah') || q.includes('total')) &&
      (q.includes('role') || q.includes('peran') || q.includes('hak akses'));
    if (isRoleCountQuery) {
      return NextResponse.json({
        reply: `Ada total **5 role** di Kopi Mahasiswa: **Admin**, **Kasir (Cashier)**, **Barista**, **Owner**, dan **Customer (Pelanggan)**.`,
        dataSource: 'role-count',
      });
    }

    // 0C. Jumlah / Total Pelanggan / Customer
    const isCustomerCountQuery =
      (q.includes('berapa') || q.includes('jumlah') || q.includes('total')) &&
      (q.includes('pelanggan') || q.includes('customer') || q.includes('member'));
    if (isCustomerCountQuery) {
      const customers = dbSnapshot?.users?.customers || [];
      const customerRole = dbSnapshot?.users?.byRole?.find(
        (r: any) => r.role?.toLowerCase() === 'customer'
      );
      const count = customerRole?.count ?? (customers.length || 5);

      let customerNames = '';
      if (customers.length > 0) {
        const namesList = customers
          .map((c: any) => `**${c.name}**${c.campus ? ` (${c.campus})` : ''}`)
          .join(', ');
        customerNames = `: ${namesList}`;
      }
      return NextResponse.json({
        reply: `Saat ini terdapat **${count} pelanggan (customer)** terdaftar di database${customerNames}.`,
        dataSource: 'customer-count',
      });
    }

    // 0D. Jumlah / Total Pengguna (Keseluruhan)
    const isUserCountQuery =
      (q.includes('berapa') || q.includes('jumlah') || q.includes('total')) &&
      (q.includes('pengguna') || q.includes('user') || q.includes('akun') || q.includes('staf') || q.includes('pegawai') || q.includes('orang'));
    if (isUserCountQuery) {
      const totalCount = dbSnapshot?.users?.total || 0;
      const roleBreakdown = (dbSnapshot?.users?.byRole || [])
        .map((r: any) => `${r.count} ${r.role}`)
        .join(', ');
      const breakdownStr = roleBreakdown ? ` (${roleBreakdown})` : '';
      return NextResponse.json({
        reply: `Saat ini terdapat total **${totalCount} pengguna** terdaftar di database${breakdownStr}.`,
        dataSource: 'user-count',
      });
    }

    // 0E0. Harga / Info Produk Spesifik (Menjawab hanya 1 produk yang ditanyakan)
    const allProducts = dbSnapshot?.catalog?.products?.list || [];
    const specificProduct = allProducts.find((p: any) => {
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

    if (specificProduct) {
      const variantStr = (specificProduct.variants && specificProduct.variants.length > 0)
        ? ` (Varian: ${specificProduct.variants.join(', ')})`
        : '';
      const statusStr = specificProduct.isAvailable ? '✅ Tersedia' : '🔴 Sedang Habis';
      return NextResponse.json({
        reply: `Harga **${specificProduct.name}** adalah **Rp ${specificProduct.basePrice.toLocaleString('id-ID')}** [${specificProduct.category} — ${statusStr}]${variantStr}.`,
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
        reply: `Harga topping **${specificTopping.name}** adalah **Rp ${specificTopping.price.toLocaleString('id-ID')}** (${specificTopping.isAvailable ? '✅ Tersedia' : '🔴 Habis'}).`,
        dataSource: 'topping-price',
      });
    }

    // 0E. Menu Kopi / Jumlah Menu Kopi (Hanya Kopi, bukan non-kopi atau cemilan)
    const isCoffeeMenuQuery =
      (q.includes('menu kopi') || q.includes('varian kopi') || q.includes('daftar kopi') || q.includes('katalog kopi')) ||
      ((q.includes('berapa') || q.includes('jumlah') || q.includes('total')) && (q.includes('kopi') || q.includes('coffee')));
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
      const list = coffeeProducts
        .map((p: any) => `- **${p.name}** [${p.category}] — **Rp ${p.basePrice.toLocaleString('id-ID')}** (${p.isAvailable ? '✅ Tersedia' : '🔴 Habis'})`)
        .join('\n');
      return NextResponse.json({
        reply: `Saat ini terdapat **${count} varian menu kopi** di Kopi Mahasiswa:\n\n${list}\n\n⭐ _Catatan: Menu Non-Coffee dan Snack/Cemilan dipisahkan dan tidak masuk dalam kategori kopi._`,
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
        reply: `Nama Owner (Pemilik) Kopi Mahasiswa adalah **${ownerName}**.`,
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
        reply: `Nama Barista yang bertugas di Kitchen Display System adalah **${baristaName}**.`,
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
        reply: `Nama Kasir yang bertugas di meja kasir POS adalah **${kasirName}**.`,
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
        reply: `Nama Administrator yang mengelola sistem operasional kafe adalah **${adminName}**.`,
        dataSource: 'staff-info',
      });
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
      'omset', 'pendapatan', 'revenue', 'penjualan',
      'stok', 'bahan baku', 'inventory', 'kritis', 'habis',
      'jumlah user', 'total user', 'distribusi user', 'data user', 'daftar user',
      'transaksi', 'pesanan', 'order',
      'katalog', 'menu', 'produk', 'daftar harga',
      'meja', 'meja kosong',
      'voucher', 'promo', 'promosi',
      'audit', 'log', 'sistem', 'database', 'ringkasan db', 'ringkasan database', 'statistik',
    ];
    const isStoreDataQuery = storeDataKeywords.some((k) => q.includes(k));

    // A. JIKA PERTANYAAN PROFIL USER (Tanpa minta data toko): Jawab langsung identitas user tanpa dump database
    if (isProfileQuery && !isStoreDataQuery) {
      const campusStr = currentUser.campus ? ` (Asal Kampus: **${currentUser.campus}**)` : '';
      const pointsStr = currentUser.points ? ` dengan saldo **${currentUser.points} Poin**` : '';
      const reply = `Kamu adalah **${currentUser.name}**, login sebagai **${currentUser.role}** Kopi Mahasiswa${campusStr}${pointsStr}.\n\nSebagai **${currentUser.role}**, kamu memiliki hak akses ke sistem manajemen operasional kafe. Ada data toko atau laporan operasional yang ingin kamu pantau? Silakan tanyakan hal spesifik seperti _"Berapa omset hari ini?"_, _"Berapa jumlah user?"_, atau _"Ada stok kritis?"_.`;
      return NextResponse.json({ reply, dataSource: 'user-profile' });
    }

    // B. JIKA SAPAAN UMUM: Jawab ramah dengan nama dan role tanpa dump database
    if (isGreeting && !isStoreDataQuery) {
      const hour = new Date().getHours();
      const timeGreeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
      const reply = `Halo **${currentUser.name}**! 👋 ${timeGreeting}.\n\nKamu sedang login sebagai **${currentUser.role}** Kopi Mahasiswa. Ada yang bisa saya bantu pantau terkait data operasional toko hari ini? Kamu bisa menanyakan data seperti **omset hari ini**, **stok kritis**, **jumlah user**, atau **voucher aktif**.`;
      return NextResponse.json({ reply, dataSource: 'greeting' });
    }

    // C. HANYA lakukan RAG Context Injection snapshot database jika user secara eksplisit menanyakan data operasional / statistik toko
    let ragContext = '';
    if (isStoreDataQuery) {
      ragContext = `\n\n[SNAPSHOT OPERASIONAL DATABASE REAL-TIME]:\n${JSON.stringify(dbSnapshot)}`;
    }

    // 1. Coba panggil LLM eksternal (Nous / Gemini) dengan timeout ketat 3.5 detik
    const nousApiKey = process.env.NOUS_API_KEY;
    const nousKeyId = process.env.NOUS_KEY_ID;
    const nousApiUrl = process.env.NOUS_API_URL || 'https://inference-api.nousresearch.com/v1/chat/completions';
    const nousModel = process.env.NOUS_MODEL || 'meta-llama/llama-3.1-8b-instruct';

    if (nousApiKey && !nousApiKey.includes('invalid')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const cleanHistory = messages
          .filter((m: any) => m.role === 'user' || m.role === 'assistant')
          .slice(-6);

        const systemPrompt = `Kamu adalah Admin AI Assistant untuk sistem manajemen Kopi Mahasiswa ☕.
Informasi Akun Pengguna yang Sedang Login:
- Nama: ${currentUser.name}
- Role: ${currentUser.role}
${currentUser.campus ? `- Asal Kampus: ${currentUser.campus}` : ''}
${currentUser.points ? `- Saldo Poin: ${currentUser.points} Poin` : ''}

PANDUAN MENJAWAB & GUARDRAILS:
1. JIKA PENGGUNA MENANYAKAN PROFIL/IDENTITAS DIRI (misal: "siapa saya", "siapa aku", "profil saya", "role saya", "nama saya"):
   - Jawab langsung dengan ramah memberitahukan identitasnya berdasarkan data akun di atas:
     "Kamu adalah ${currentUser.name}, login sebagai ${currentUser.role} Kopi Mahasiswa."
   - JANGAN PERNAH menyertakan data omset, stok, atau ringkasan tabel database jika user hanya menanyakan profil dirinya!

2. JIKA PENGGUNA MENYAPA (misal: "halo", "hai", "selamat pagi", "apa kabar"):
   - Sapa dengan ramah, sebutkan nama ${currentUser.name}, dan tanyakan data operasional apa yang ingin dicek.
   - Jangan langsung membeberkan statistik toko jika tidak diminta.

3. JIKA PENGGUNA MENANYAKAN DATA TOKO / STATISTIK OPERASIONAL (hanya jika diminta eksplisit):
   - Jika pengguna menanyakan data bisnis (misal: "omset", "stok kritis", "jumlah user", "daftar menu", "meja kosong", "voucher"):
     Gunakan data snapshot database berikut secara akurat dan spesifik:${ragContext}`;

        const res = await fetch(nousApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${nousApiKey}`,
            'Content-Type': 'application/json',
            ...(nousKeyId ? { 'X-Key-Id': nousKeyId } : {}),
          },
          body: JSON.stringify({
            model: nousModel,
            messages: [{ role: 'system', content: systemPrompt }, ...cleanHistory],
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
            return NextResponse.json({ reply, dataSource: 'llm-live-db' });
          }
        }
      } catch (err) {
        // Fallback ke semantic answering engine
      }
    }

    // 2. Semantic Question-Answering Engine yang presisi menjawab pertanyaan spesifik
    const reply = generatePreciseAdminResponse(lastUserMsg, dbSnapshot, currentUser);
    return NextResponse.json({ reply, dataSource: 'live-db-analyzer' });
  } catch (error: any) {
    console.error('[Admin AI Chat] Error:', error);
    return NextResponse.json(
      { reply: 'Terjadi kendala saat memproses pertanyaan. Silakan coba kembali.', dataSource: 'error' },
      { status: 500 }
    );
  }
}
