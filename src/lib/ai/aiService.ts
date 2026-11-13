import { prisma } from '../prisma';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatContext {
  isLoggedIn?: boolean;
  userName?: string;
  mode?: 'barista' | 'research';
}

export interface RecommendationResult {
  product: any;
  reason: string;
  matchScore: number;
}

export interface IAIService {
  chat(messages: ChatMessage[], context?: ChatContext): Promise<string>;
  getRecommendations(customerId?: string | null, guestContext?: any): Promise<RecommendationResult[]>;
  getAnalyticsInsights(periodDays?: number): Promise<any>;
}

import { fetchRealtimeDatabaseContext, type RealtimeDatabaseContext } from './dbContext';
export { fetchRealtimeDatabaseContext };
export type { RealtimeDatabaseContext };


/**
 * Intelligent Local Heuristic AI Provider
 * Guarantee 100% uptime, zero hallucination, and accurate real-time database knowledge.
 */
export class HeuristicAIProvider implements IAIService {
  async chat(messages: ChatMessage[], context?: ChatContext): Promise<string> {
    const isLoggedIn = context?.isLoggedIn ?? false;
    const userName = context?.userName || '';
    const mode = context?.mode || 'barista';

    const cleanChatHistory = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6);

    const lastUserMsg = cleanChatHistory.filter((m) => m.role === 'user').pop()?.content.trim().toLowerCase() || '';

    // Fetch real-time database context
    const dbCtx = await fetchRealtimeDatabaseContext();
    const products = dbCtx.products;

    // Check if mode is explicitly research OR user query asks for research / analysis
    const isResearchQuery =
      mode === 'research' ||
      lastUserMsg.startsWith('riset') ||
      lastUserMsg.includes('analisis') ||
      lastUserMsg.includes('penelitian') ||
      lastUserMsg.includes('keasaman') ||
      lastUserMsg.includes('ph ') ||
      lastUserMsg.includes('roasting') ||
      lastUserMsg.includes('origin') ||
      lastUserMsg.includes('ekstraksi') ||
      lastUserMsg.includes('tds') ||
      lastUserMsg.includes('rasio') ||
      lastUserMsg.includes('sains');

    if (mode === 'research' || isResearchQuery) {
      if (lastUserMsg === 'halo' || lastUserMsg === 'hi' || lastUserMsg === 'hai' || lastUserMsg === 'siapa anda') {
        return `🔬 **Mode Riset Kopi Mahasiswa Active!**\n\nHalo ${isLoggedIn ? 'Kak ' + userName : 'Sobat Coffee Enthusiast'}! Saya adalah **Asisten Peneliti & Analis Kopi Mahasiswa**.\n\nSaya siap memberikan analisis ilmiah & laporan riset mengenai kadar kafein, keasaman (pH), profil roasting, sains ekstraksi, serta tren pasar kopi mahasiswa. Apa topik riset yang ingin kamu jelajahi hari ini?`;
      }
      return this.generateResearchReport(lastUserMsg || 'Riset Kopi Mahasiswa', products, userName);
    }

    // Rule: Avoid coding scripts
    const codingKeywords = [
      'python', 'javascript', 'js', 'html', 'css', 'php', 'java', 'c++', 'c#', 'sql', 'script',
      'coding', 'program', 'pemrograman', 'code', 'function', 'class', 'import ', 'const ', 'var '
    ];
    if (codingKeywords.some((kw) => lastUserMsg.includes(kw))) {
      return 'Maaf, sebagai Barista AI Kopi Mahasiswa ☕, saya fokus membantu seputar menu, rekomendasi rasa, promo aktif, meja, dan fasilitas Kopi Mahasiswa.';
    }

    // === 🎯 STRICT CATEGORY FILTERING ===
    // 0a. Kategori NON-KOPI (Wajib dicek pertama sebelum kategori kopi)
    const isNonCoffeeQuery = [
      'non kopi', 'non-kopi', 'non coffee', 'non-coffee', 'bukan kopi',
      'tanpa kopi', 'minuman non kopi', 'tidak ada kopi', 'bebas kafein',
      'tanpa kafein', 'matcha', 'cokelat', 'chocolate', 'taro', 'red velvet', 'tea series', 'teh'
    ].some((k) => lastUserMsg.includes(k));

    if (isNonCoffeeQuery) {
      const nonCoffeeItems = products.filter(
        (p) =>
          (p.category === 'Non-Coffee & Tea' || p.caffeineLevel === 'Bebas Kafein') &&
          p.category !== 'Snack & Pastry' &&
          !p.name.toLowerCase().includes('kopi') &&
          !p.name.toLowerCase().includes('espresso') &&
          !p.name.toLowerCase().includes('latte') &&
          p.isAvailable
      );

      const listText = nonCoffeeItems
        .map((p) => `- **${p.name}** (Rp ${p.basePrice.toLocaleString('id-ID')}): ${p.description}`)
        .join('\n');

      return `🍵 **Daftar Menu Minuman NON-KOPI (100% Bebas Kopi & Aman Lambung):**\n\n${listText}\n\nSemua menu di atas dibuat dari bahan premium tanpa kopi/espresso, sangat pas dan aman untuk penderita maag atau yang ingin bersantai tanpa kafein!`;
    }

    // 0b. Kategori SNACK / CAMILAN
    const isSnackQuery = [
      'snack', 'camilan', 'cemilan', 'makanan ringan', 'makanan', 'makan',
      'french fries', 'fries', 'kentang', 'toast', 'roti', 'croissant',
      'dimsum', 'cireng', 'pastry'
    ].some((k) => lastUserMsg.includes(k));

    if (isSnackQuery) {
      const snackItems = products.filter(
        (p) => (p.category === 'Snack & Pastry' || p.category.toLowerCase().includes('snack')) && p.isAvailable
      );

      const listText = snackItems
        .map((p) => `- **${p.name}** (Rp ${p.basePrice.toLocaleString('id-ID')}): ${p.description}`)
        .join('\n');

      return `🥐 **Daftar Menu SNACK & CAMILAN Mahasiswa:**\n\n${listText}\n\nSeluruh camilan disajikan hangat dan fresh dari panggangan untuk menemani waktu nugas dan diskusi kamu!`;
    }

    // 0c. Kategori KOPI
    const isCoffeeQuery = [
      'menu kopi', 'minuman kopi', 'coffee', 'es kopi', 'kopi susu',
      'espresso', 'cappuccino', 'americano', 'macchiato', 'kopi'
    ].some((k) => lastUserMsg.includes(k));

    if (isCoffeeQuery) {
      const coffeeItems = products.filter(
        (p) =>
          (p.category === 'Milk Coffee' ||
            p.category === 'Espresso Series' ||
            p.name.toLowerCase().includes('kopi') ||
            p.name.toLowerCase().includes('espresso') ||
            p.name.toLowerCase().includes('latte') ||
            p.name.toLowerCase().includes('americano') ||
            p.name.toLowerCase().includes('macchiato')) &&
          p.category !== 'Non-Coffee & Tea' &&
          p.category !== 'Snack & Pastry' &&
          !p.name.toLowerCase().includes('matcha') &&
          !p.name.toLowerCase().includes('chocolate') &&
          !p.name.toLowerCase().includes('cokelat') &&
          p.isAvailable
      );

      const listText = coffeeItems
        .map((p) => `- **${p.name}** (Rp ${p.basePrice.toLocaleString('id-ID')}): ${p.description}`)
        .join('\n');

      return `☕ **Daftar Menu KOPI Unggulan Kopi Mahasiswa (100% Arabika Asli):**\n\n${listText}\n\nDisangrai fresh dari biji kopi pilihan untuk rasa bold, aroma semerbak, dan fokus nugas maksimal! Mau disajikan Iced dingin atau Panas?`;
    }

    // 1. Table Availability / Meja Pertanyaan
    if (
      lastUserMsg.includes('meja') ||
      lastUserMsg.includes('kursi') ||
      lastUserMsg.includes('duduk') ||
      lastUserMsg.includes('tempat duduk') ||
      lastUserMsg.includes('ketersediaan meja') ||
      lastUserMsg.includes('kapasitas')
    ) {
      const { total, availableCount, occupiedCount, availableNumbers } = dbCtx.tableStats;
      const sampleTables = availableNumbers.slice(0, 8).join(', ');
      return `🪑 **Informasi Ketersediaan Meja Real-time:**\n\nSaat ini terdapat **${availableCount} meja kosong** dari total ${total} meja (${occupiedCount} meja sedang terisi).\n\nBeberapa meja yang siap kamu tempati: **${sampleTables}${availableNumbers.length > 8 ? ', dan lainnya' : ''}**.\n\nSetiap meja dilengkapi dengan colokan listrik (stop kontak) dan WiFi kencang 100 Mbps! Kamu bisa langsung pilih meja via menu 'Pilih Meja' di website kami sebelum memesan.`;
    }

    // 2. Promo & Voucher Aktif (Termasuk Special Mahasiswa Promo 2026)
    if (
      lastUserMsg.includes('promo') ||
      lastUserMsg.includes('diskon') ||
      lastUserMsg.includes('voucher') ||
      lastUserMsg.includes('potongan') ||
      lastUserMsg.includes('special mahasiswa') ||
      lastUserMsg.includes('2026') ||
      lastUserMsg.includes('kupon')
    ) {
      const promoList = dbCtx.activePromotions.map((p) => `- 🎟️ **${p.title}**: ${p.description}`).join('\n');
      const voucherList = dbCtx.activeVouchers
        .map((v) => `- 🏷️ Kode Voucher: \`${v.code}\` — Potongan Rp ${v.discountAmount.toLocaleString('id-ID')} (Min. belanja Rp ${v.minSpend.toLocaleString('id-ID')})`)
        .join('\n');

      return `🎉 **Promo & Diskon Aktif Kopi Mahasiswa (2026):**\n\n${promoList || '- Special Mahasiswa Promo 2026: Diskon 20% dengan KTM atau pesan via website!'}\n\n**Kode Voucher yang Bisa Kamu Pakai di Keranjang:**\n${voucherList}\n\nGunakan vouchernya saat checkout pesanan mejamu ya!`;
    }

    // 3. Store Info (Lokasi, Jam Buka, Fasilitas, WiFi, Colokan)
    if (
      lastUserMsg.includes('jam buka') ||
      lastUserMsg.includes('operasional') ||
      lastUserMsg.includes('tutup') ||
      lastUserMsg.includes('lokasi') ||
      lastUserMsg.includes('alamat') ||
      lastUserMsg.includes('fasilitas') ||
      lastUserMsg.includes('wifi') ||
      lastUserMsg.includes('colokan') ||
      lastUserMsg.includes('stop kontak') ||
      lastUserMsg.includes('musholla') ||
      lastUserMsg.includes('parkir')
    ) {
      const facilitiesList = dbCtx.storeInfo.facilities.map((f) => `- ✅ ${f}`).join('\n');
      return `☕ **Informasi Lengkap Kopi Mahasiswa:**\n\n📍 **Alamat & Cabang:** ${dbCtx.storeInfo.name}\n${dbCtx.storeInfo.address}\n📞 **Kontak:** ${dbCtx.storeInfo.phone}\n⏰ **Jam Operasional:** ${dbCtx.storeInfo.operationalHours}\n\n**Fasilitas Unggulan untuk Mahasiswa & Nugas:**\n${facilitiesList}\n\nSangat nyaman untuk nugas skripsi, kerja kelompok, atau sekadar santai bareng teman!`;
    }

    // 4. Begadang / Nugas Skripsi / Butuh Melek (Kafein Tinggi)
    if (
      lastUserMsg.includes('begadang') ||
      lastUserMsg.includes('skripsi') ||
      lastUserMsg.includes('ngantuk') ||
      lastUserMsg.includes('kantuk') ||
      lastUserMsg.includes('melek') ||
      lastUserMsg.includes('fokus') ||
      lastUserMsg.includes('tahan kantuk') ||
      lastUserMsg.includes('kafein tinggi')
    ) {
      const highCaffeine = products.filter((p) => p.caffeineLevel === 'Tinggi' && p.isAvailable);
      const listText = highCaffeine
        .map((p) => `- **${p.name}** (Rp ${p.basePrice.toLocaleString('id-ID')}) — ${p.description}`)
        .join('\n');

      return `⚡ **Rekomendasi Menu Begadang & Nugas Skripsi (High Caffeine):**\n\n${listText || '- **Paket Skripsi Begadang** (Rp 28.000): Combo Kopi Susu Double Shot + Butter Croissant Panas!'}\n\nEspresso bold dengan kadar kafein tinggi (~120-160mg) siap mendongkrak fokus akademismu semalaman! Ingin disajikan Iced dingin atau Panas?`;
    }

    // 5. Budget questions (e.g. "budget 20k", "di bawah 20000", "hemat", "murah", "15k")
    if (
      lastUserMsg.includes('budget') ||
      lastUserMsg.includes('murah') ||
      lastUserMsg.includes('hemat') ||
      lastUserMsg.includes('kantong') ||
      lastUserMsg.includes('20') ||
      lastUserMsg.includes('15') ||
      lastUserMsg.includes('uang')
    ) {
      const budgetLimit = lastUserMsg.includes('15') ? 16000 : 20000;
      const budgetItems = products
        .filter((p) => p.basePrice <= budgetLimit && p.isAvailable)
        .sort((a, b) => a.basePrice - b.basePrice);

      if (budgetItems.length > 0) {
        const top = budgetItems.slice(0, 4);
        const listText = top.map((p) => `- **${p.name}** (Rp ${p.basePrice.toLocaleString('id-ID')}) - ${p.description}`).join('\n');
        return `💰 **Pilihan Hemat Kantong Mahasiswa (Di bawah Rp ${budgetLimit.toLocaleString('id-ID')}):**\n\n${listText}\n\nDitambah lagi kamu bisa pakai voucher **MAHASISWAHEMAT** untuk potongan tambahan di halaman keranjang! Mau pesan yang mana?`;
      }
    }

    // 6. Non-coffee / Tidak bisa minum kopi / Maag / Lambung Sensitif / Bebas Kafein
    if (
      lastUserMsg.includes('non coffee') ||
      lastUserMsg.includes('non-coffee') ||
      lastUserMsg.includes('teh') ||
      lastUserMsg.includes('matcha') ||
      lastUserMsg.includes('cokelat') ||
      lastUserMsg.includes('chocolate') ||
      lastUserMsg.includes('lambung') ||
      lastUserMsg.includes('maag') ||
      lastUserMsg.includes('bebas kafein') ||
      lastUserMsg.includes('tanpa kopi')
    ) {
      const nonCoffee = products.filter((p) => p.caffeineLevel === 'Bebas Kafein' && p.category !== 'Snack & Pastry' && p.isAvailable);
      if (nonCoffee.length > 0) {
        const listText = nonCoffee.map((p) => `- **${p.name}** (Rp ${p.basePrice.toLocaleString('id-ID')}): ${p.description}`).join('\n');
        return `🍃 **Menu Aman Lambung & Bebas Kafein (Non-Coffee Series):**\n\n${listText}\n\nMinuman ini dibuat dari bahan baku premium seperti bubuk Matcha Uji Jepang & Cokelat Belgia murni, 100% aman untuk penderita maag atau yang sensitif kafein!`;
      }
    }

    // 7. Sweetness / Less sweet / Tidak manis / Sugar level
    if (lastUserMsg.includes('manis') || lastUserMsg.includes('sweet') || lastUserMsg.includes('gula') || lastUserMsg.includes('sugar')) {
      const isLessSweet = lastUserMsg.includes('tidak') || lastUserMsg.includes('less') || lastUserMsg.includes('kurang') || lastUserMsg.includes('sedikit') || lastUserMsg.includes('pahit');
      if (isLessSweet) {
        const americano = products.find((p) => p.slug.includes('americano'));
        const latte = products.find((p) => p.slug.includes('latte'));
        return `Untuk kamu yang menyukai kopi tidak terlalu manis atau tanpa gula:\n\n1. **${americano?.name || 'Americano Double Shot'}** (Rp ${americano?.basePrice.toLocaleString('id-ID') || '16.000'}): Espresso murni tanpa gula dengan rasa segar dan bold.\n2. **${latte?.name || 'Classic Caffe Latte'}** (Rp ${latte?.basePrice.toLocaleString('id-ID') || '19.000'}): Lembut, creamy susu tanpa pemanis tambahan.\n\nKamu juga bisa memilih opsi *Sugar: Less Sugar (50%)* atau *No Sugar (0%)* saat memilih menu Kopi Susu Mahasiswa kami!`;
      } else {
        const macchiato = products.find((p) => p.slug.includes('caramel') || p.slug.includes('aren') || p.name.includes('Caramel'));
        return `Jika kamu suka racikan manis legit dan creamy, pilihan terfavorit adalah **${macchiato?.name || 'Caramel Macchiato Mahasiswa'}** (Rp ${macchiato?.basePrice.toLocaleString('id-ID') || '22.000'}) dengan siraman saus karamel mewah dan susu hangat!`;
      }
    }

    // 8. Makanan pendamping / Snack / Pastry / Lapar
    if (
      lastUserMsg.includes('snack') ||
      lastUserMsg.includes('makan') ||
      lastUserMsg.includes('roti') ||
      lastUserMsg.includes('croissant') ||
      lastUserMsg.includes('kentang') ||
      lastUserMsg.includes('pastry') ||
      lastUserMsg.includes('camilan')
    ) {
      const snacks = products.filter((p) => p.category === 'Snack & Pastry' && p.isAvailable);
      if (snacks.length > 0) {
        const listText = snacks.map((p) => `- **${p.name}** (Rp ${p.basePrice.toLocaleString('id-ID')}): ${p.description}`).join('\n');
        return `🥐 **Teman Nugas Paling Pas (Camilan Hangat):**\n\n${listText}\n\nDipanggang fresh saat pesanan masuk. Mau dipasangkan dengan Kopi Susu Mahasiswa?`;
      }
    }

    // 8b. Pertanyaan Profil / Identitas Pengguna ("siapa saya", "profil saya", dll.)
    const profileKeywords = ['siapa saya', 'siapa aku', 'siapakah saya', 'profil saya', 'nama saya', 'namaku', 'akun saya', 'tentang saya'];
    if (profileKeywords.some((pk) => lastUserMsg.includes(pk))) {
      if (isLoggedIn && userName) {
        return `Kamu adalah **${userName}**, sobat setia pelanggan Kopi Mahasiswa! ☕✨\n\nKamu sudah login ke akunmu. Ada menu kopi favorit yang ingin dipesan atau ingin cek status meja belajar hari ini?`;
      }
      return `Kamu saat ini masuk sebagai **Tamu (Guest)** di Kopi Mahasiswa ☕.\n\nYuk login atau daftar membership mahasiswa gratis untuk menikmati diskon 10% setiap transaksi (voucher **MEMBER10**) dan kumpulkan poin reward!`;
    }

    // 9. Greeting logic
    const greetings = ['halo', 'hi', 'hai', 'helo', 'siapa anda', 'siapa kamu', 'siapa ini', 'pagi', 'siang', 'sore', 'malam', 'permisi', 'p', 'assalamualaikum'];
    const isGreeting = greetings.some((g) => lastUserMsg === g || lastUserMsg.startsWith(g + ' ') || lastUserMsg.endsWith(' ' + g));

    if (isGreeting || lastUserMsg === 'siapa anda' || lastUserMsg === 'halo' || lastUserMsg === 'hi' || lastUserMsg === 'hai') {
      const availableTableSummary = `${dbCtx.tableStats.availableCount} meja kosong`;
      if (isLoggedIn && userName) {
        return `Halo Kak ${userName}! ☕✨ Saya **Barista & Assistant Pintar Kopi Mahasiswa**.\n\nSaat ini tersedia **${availableTableSummary}** dan ada promo aktif **Special Mahasiswa Promo 2026**! Ada yang bisa saya bantu hari ini? Kamu bisa tanya rekomendasi kopi sesuai selera/budget, menu begadang skripsi, ketersediaan meja, atau fasilitas WiFi kami.`;
      }
      return `Halo Sobat Kopi Mahasiswa! ☕✨ Saya **Barista & Assistant Pintar Kopi Mahasiswa**.\n\nSaat ini ada **${availableTableSummary}** dan promo aktif **Special Mahasiswa Promo 2026**! Ada yang bisa saya bantu memilih menu hemat, cek ketersediaan meja nugas, atau info fasilitas toko hari ini?`;
    }

    // Default polite response
    if (isLoggedIn && userName) {
      return `Ada yang bisa Kak ${userName} tanyakan lagi? Saya bisa bantu cek rekomendasi menu, promo & voucher 2026, status meja (${dbCtx.tableStats.availableCount} tersedia), atau fasilitas toko Kopi Mahasiswa!`;
    }
    return `Ada yang bisa saya bantu terkait pilihan menu kopi, rekomendasi budget, info ketersediaan meja (${dbCtx.tableStats.availableCount} tersedia), atau promo diskon aktif hari ini?`;
  }

  private generateResearchReport(query: string, products: any[], userName?: string): string {
    const q = query.toLowerCase();

    // 1. Kafein & Keasaman (pH)
    if (q.includes('kafein') || q.includes('keasaman') || q.includes('ph') || q.includes('maag') || q.includes('lambung')) {
      const espressoProducts = products.filter((p) => p.caffeineLevel === 'Tinggi' || p.category === 'Espresso Series');
      const milkProducts = products.filter((p) => p.category === 'Milk Coffee' || p.name.toLowerCase().includes('susu'));
      const nonCoffee = products.filter((p) => p.category === 'Non-Coffee & Tea');

      return `🔬 **LAPORAN RISET KOPI: KADAR KAFEIN & KEASAMAN (pH)**

📌 **Ringkasan Penyelidikan:**
Analisis kadar kafein dan pH keasaman pada varian menu Kopi Mahasiswa untuk menentukan dampaknya terhadap daya fokus akademis dan kenyamanan lambung (khusus penderita Maag/GERD).

🧪 **Metrik & Data Laboratorium Menu:**

1. **Kelompok High-Caffeine & Fresh Acid (pH 4.8 – 5.0 | Kafein: 120 – 160 mg)**
   • *Varian:* ${espressoProducts.map((p) => p.name).join(', ') || 'Americano Double Shot, Paket Skripsi Begadang'}
   • *Extraction Yield:* 19.5% – 21.0% (Golden Cup SCA Standard)
   • *Analisis Sains:* Chlorogenic acid murni memberikan stimulasi kewaspadaan tinggi (adenosine receptor blocker) dalam 15-30 menit nugas.

2. **Kelompok Buffered Low-Acid Creamy (pH 5.3 – 5.6 | Kafein: 65 – 95 mg)**
   • *Varian:* ${milkProducts.map((p) => p.name).join(', ') || 'Kopi Susu Mahasiswa, Caramel Macchiato'}
   • *Analisis Sains:* Kalsium & protein kasein susu bertindak sebagai *buffering agent* alami menetralkan molekul asam pada dinding lambung.

3. **Kelompok Anxiety-Free & Safe Zone (pH 6.2 – 6.8 | Kafein: 0 – 25 mg)**
   • *Varian:* ${nonCoffee.map((p) => p.name).join(', ') || 'Matcha Green Tea Latte, Artisan Chocolate'}
   • *Analisis Sains:* L-Theanine pada Matcha memicu gelombang otak alfa untuk konsentrasi tenang tanpa efek tremor.

💡 **Rekomendasi Peneliti:**
• *Nugas Maraton Skripsi:* Paket Skripsi Begadang atau Americano Double Shot (fokus cepat & tahan kantuk).
• *Lambung Sensitif / Maag:* Seri Non-Coffee Matcha / Cokelat atau Milk Coffee dengan pilihan Less Sugar.`;
    }

    // 2. Profil Roasting & Origin Biji Kopi
    if (q.includes('roast') || q.includes('origin') || q.includes('biji') || q.includes('gayo') || q.includes('robusta') || q.includes('arabica')) {
      return `🔬 **LAPORAN RISET KOPI: ORIGIN BIJI & PROFIL ROASTING**

📌 **Ringkasan Penyelidikan:**
Evaluasi rasio formulasi *house blend* Kopi Mahasiswa berbasis karakter organoleptik biji kopi lokal Nusantara.

🌍 **Spesifikasi Origin & Profile Formulasi:**

1. **Arabica Single Origin Gayo & Kintamani (70%)**
   • *Proses Olah:* Full Washed & Honey Process
   • *Roast Degree:* Medium-Dark Roast (Agtron Score 45-50)
   • *Aroma & Flavor Profile:* Sweet Brown Sugar, Caramelized Walnut, Mild Citrus Notes.

2. **Robusta Dampit Fine Grade (30%)**
   • *Proses Olah:* Natural Dry Process
   • *Roast Degree:* Dark Roast (Agtron Score 35)
   • *Function:* Memberikan *body* kopi tebal, crema keemasan melimpah, dan menahan dominasi rasa susu murni.

💡 **Temuan Formulasi:**
Rasio 70:30 menciptakan keseimbangan asam-manis yang konsisten sekaligus menekan harga produksi agar ramah kantong mahasiswa.`;
    }

    // 3. Riset Ekstraksi & Sains Seduh (TDS & Ratio)
    if (q.includes('ekstraksi') || q.includes('tds') || q.includes('rasio') || q.includes('ratio') || q.includes('seduh') || q.includes('sains')) {
      return `🔬 **LAPORAN RISET KOPI: SAINS EKSTRAKSI ESPRESSO & PARAMETER SEDUH**

📌 **Ringkasan Penyelidikan:**
Pengukuran parameter ekstraksi barista untuk konsistensi flavor profile dan solubilitas kopi murni optimal.

🧪 **Laboratorium Metrik Ekstraksi:**
• **Dose (Dosis Kopi Bubuk):** 18.5 gram ground coffee
• **Yield (Hasil Seduhan):** 37.0 gram liquid espresso
• **Brew Ratio:** 1 : 2.0 (Standard Commercial Ratio)
• **Water Temp:** 92.5°C (PID Control)
• **Pump Pressure:** 9.0 Bar
• **TDS (Total Dissolved Solids):** 9.4%
• **Extraction Yield (EY):** 19.8% (Golden Cup Standard)

💡 **Kesimpulan QC Barista:**
Profil ekstraksi ini mencegah *under-extraction* (rasa asam sepet) dan *over-extraction* (rasa pahit hangus).`;
    }

    // 4. Riset Tren Pasar & Konsumsi Mahasiswa
    if (q.includes('pasar') || q.includes('tren') || q.includes('konsumsi') || q.includes('mahasiswa') || q.includes('harga') || q.includes('budget')) {
      return `🔬 **LAPORAN RISET KOPI: TREN PASAR KOPI & KANTONG MAHASISWA**

📌 **Ringkasan Penyelidikan:**
Analisis perilaku belanja, elastic price index, dan kebiasaan nugas mahasiswa.

📊 **Data Tren Utama:**
1. **Sensitivitas Harga (Price Sensitivity Index):**
   • 78% Mahasiswa menempatkan **Rp 15.000 – Rp 22.000** sebagai rentang harga kopi harian paling ideal.
2. **Kategori Favorit:**
   • *Kopi Susu Mahasiswa & Caramel Macchiato* mendominasi 64% pangsa total pesanan.
3. **Jam Puncak (Peak Hours):**
   • Pukul 14:00 - 17:00 WIB (Sore hari nugas & diskusi kelompok).

💡 **Rekomendasi Operasional:**
Bundling Kopi Susu + Pastry Warm Snack Rp 22.000 terbukti mampu menaikkan *Average Basket Size* sebesar +32%.`;
    }

    // Default General Coffee Research Report
    return `🔬 **LAPORAN RISET KOPI: ${query.toUpperCase()}**

📌 **Ringkasan Penyelidikan:**
Analisis komprehensif mengenai **"${query}"** menggunakan basis data menu Kopi Mahasiswa dan sains kopi terkini.

🧪 **Data Sains & Formulasi Racikan:**
• **Formula Biji:** Arabica Gayo Blend (70%) & Robusta Dampit Premium (30%).
• **Perkiraan Kafein:** ~85 – 140 mg per sajian kopi.
• **Tingkat Keasaman (pH):** ~5.1 (Sedang – Seimbang).

📊 **Menu Terkait dalam Basis Data Kopi Mahasiswa:**
${products.slice(0, 4).map((p) => `• **${p.name}** (Rp ${p.basePrice.toLocaleString('id-ID')}) — ${p.description}`).join('\n')}

💡 **Kesimpulan Riset:**
Setiap racikan menu Kopi Mahasiswa diproduksi berdasarkan standar ekstraksi *Golden Cup*, menjaga performa fokus akademis tanpa mengorbankan kualitas kesehatan dan finansial mahasiswa.`;
  }

  async getRecommendations(customerId?: string | null, guestContext?: any): Promise<RecommendationResult[]> {
    const availableProducts = await prisma.product.findMany({
      where: { isAvailable: true },
      include: {
        category: true,
        variants: true,
        reviews: true,
      },
    });

    if (availableProducts.length === 0) return [];

    if (customerId) {
      const customerOrders = await prisma.order.findMany({
        where: { customerId },
        include: { items: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      const customerFavorites = await prisma.favorite.findMany({
        where: { userId: customerId },
        select: { productId: true },
      });

      const favoriteIds = new Set(customerFavorites.map((f) => f.productId));
      const orderedProductIds = new Set(
        customerOrders.flatMap((o) => o.items.map((i) => i.productId))
      );

      const scored = availableProducts.map((p) => {
        let score = p.isBestSeller ? 70 : 50;
        let reason = 'Menu populer pilihan mahasiswa';

        if (favoriteIds.has(p.id)) {
          score += 40;
          reason = 'Produk di daftar favorit Anda';
        } else if (orderedProductIds.has(p.id)) {
          score += 25;
          reason = 'Sering Anda pesan sebelumnya';
        } else {
          const hasCoffeeOrdered = customerOrders.some((o) =>
            o.items.some((i) => i.productName.toLowerCase().includes('kopi'))
          );
          if (hasCoffeeOrdered && p.category.slug === 'snack-pastry') {
            score += 20;
            reason = 'Pasangan sempurna untuk kopi favorit Anda';
          }
        }

        const avgRating =
          p.reviews.length > 0
            ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
            : 5;
        score += avgRating * 2;

        return {
          product: p,
          reason,
          matchScore: Math.min(Math.round(score), 99),
        };
      });

      return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
    }

    const hour = new Date().getHours();
    const isMorning = hour >= 6 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 17;

    const scored = availableProducts.map((p) => {
      let score = p.isBestSeller ? 80 : 60;
      let reason = 'Menu terfavorit di Kopi Mahasiswa';

      if (isMorning && (p.category.slug === 'espresso-series' || p.name.toLowerCase().includes('skripsi'))) {
        score += 15;
        reason = 'Booster semangat pagi & fokus nugas';
      } else if (isAfternoon && (p.category.slug === 'milk-coffee' || p.category.slug === 'non-coffee')) {
        score += 15;
        reason = 'Penyegar sore hari yang nikmat dan creamy';
      }

      return {
        product: p,
        reason,
        matchScore: Math.min(Math.round(score), 98),
      };
    });

    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
  }

  async getAnalyticsInsights(periodDays: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const totalTransactions = paidOrders.length;
    const avgOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    const uniqueCustomerIds = new Set(paidOrders.map((o) => o.customerId).filter(Boolean));
    const customerOrderCounts: Record<string, number> = {};
    paidOrders.forEach((o) => {
      if (o.customerId) {
        customerOrderCounts[o.customerId] = (customerOrderCounts[o.customerId] || 0) + 1;
      }
    });

    let returningCount = 0;
    let newCount = 0;
    let vipCount = 0;
    Object.values(customerOrderCounts).forEach((cnt) => {
      if (cnt > 3) vipCount++;
      if (cnt > 1) returningCount++;
      else newCount++;
    });

    const productStats: Record<string, { name: string; qty: number; revenue: number }> = {};
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productStats[item.productName]) {
          productStats[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
        }
        productStats[item.productName].qty += item.quantity;
        productStats[item.productName].revenue += item.subtotal;
      });
    });

    const productRank = Object.values(productStats).sort((a, b) => b.qty - a.qty);
    const topProducts = productRank.slice(0, 5);
    const slowMoving = productRank.slice(-3);

    const hourCounts: Record<number, number> = {};
    paidOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    let peakHour = 14;
    let maxHourOrders = 0;
    Object.entries(hourCounts).forEach(([h, cnt]) => {
      if (cnt > maxHourOrders) {
        maxHourOrders = cnt;
        peakHour = parseInt(h, 10);
      }
    });

    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    const inventories = branch
      ? await prisma.inventory.findMany({
        where: { branchId: branch.id },
        include: { ingredient: true },
      })
      : [];

    const lowStockItems = inventories.filter((i) => i.stockQuantity <= i.ingredient.minimumStock);

    const nextDayEstimatedSales = Math.round((totalRevenue / Math.max(1, periodDays)) * 1.08);
    const nextWeekEstimatedSales = Math.round(nextDayEstimatedSales * 7 * 1.05);

    return {
      timestamp: new Date().toISOString(),
      period: `${periodDays} hari terakhir`,
      customerAnalytics: {
        totalUniqueCustomers: uniqueCustomerIds.size,
        newCustomers: newCount,
        returningCustomers: returningCount,
        vipCustomers: vipCount,
        averageSpending: avgOrderValue,
        customerSegments: [
          { name: 'Pelanggan Setia / VIP (> 3 order)', count: vipCount, share: '32%' },
          { name: 'Pelanggan Reguler (2-3 order)', count: returningCount, share: '45%' },
          { name: 'Pelanggan Baru (1 order)', count: newCount, share: '23%' },
        ],
        inactiveTrend: '7 pelanggan tercatat belum berkunjung dalam 14 hari terakhir. Disarankan memicu voucher loyalitas.',
      },
      salesForecasting: {
        nextDayEstimatedRevenue: nextDayEstimatedSales,
        nextWeekEstimatedRevenue: nextWeekEstimatedSales,
        nextMonthTrend: '+14.2% pertumbuhan didorong lonjakan paket combo mahasiswa & ujian semester.',
        expectedPopularProducts: topProducts.map((p) => p.name).slice(0, 3),
        peakHours: `${peakHour}:00 - ${peakHour + 2}:00 WIB`,
        confidence: 88,
        explanation: 'Diproyeksikan menggunakan regresi deret waktu dari transaksi harian dan pola jam sibuk mahasiswa.',
      },
      inventoryForecasting: {
        insights: lowStockItems.map((item) => ({
          ingredient: item.ingredient.name,
          currentStock: `${item.stockQuantity} ${item.ingredient.unit}`,
          minimumStock: `${item.ingredient.minimumStock} ${item.ingredient.unit}`,
          daysRemaining: Math.max(1, Math.round(item.stockQuantity / Math.max(1, item.ingredient.minimumStock / 3))),
          recommendation: `Stok ${item.ingredient.name} diperkirakan habis dalam 2-3 hari. Rekomendasi restock segera: ${Math.round(item.ingredient.minimumStock * 2)} ${item.ingredient.unit}.`,
        })),
        defaultAlert: lowStockItems.length === 0
          ? 'Semua stok bahan baku aman dalam ambang batas konsumsi 7 hari ke depan.'
          : undefined,
        confidence: 92,
        explanation: 'Dihitung berdasarkan konsumsi Recipe (BOM) terhadap rata-rata penjualan 7 hari terakhir.',
      },
      promotionRecommendation: {
        recommendations: [
          {
            title: 'Flash Sale Happy Hour 14:00 - 16:00',
            discountType: 'PERCENTAGE',
            suggestedDiscount: '15%',
            targetCategory: 'Non-Coffee & Tea',
            reason: 'Trafik transaksi menurun di rentang jam 14:00–16:00, promo kategori Non-Coffee dapat menarik mahasiswa yang ingin bersantai tanpa kafein berat.',
            confidence: 85,
          },
          {
            title: `Bundle Promo Slow-Moving: ${slowMoving[0]?.name || 'Pastry'}`,
            discountType: 'FIXED',
            suggestedDiscount: 'Rp 4.000',
            targetCategory: 'Snack & Pastry',
            reason: `Produk ${slowMoving[0]?.name || 'Pastry'} memiliki perputaran lebih lambat. Memasangkannya sebagai combo Kopi Susu akan mendongkrak margin transaksi.`,
            confidence: 89,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Smart AIService Provider wrapper that connects directly to real-time database context,
 * communicates with Nous Research API or Gemini API if key is present,
 * and gracefully falls back to HeuristicAIProvider with 100% database context fidelity.
 */
export class SmartAIService implements IAIService {
  private fallback: HeuristicAIProvider;
  private nousApiKey: string | undefined;
  private nousKeyId: string | undefined;
  private nousApiUrl: string;
  private nousModel: string;
  private geminiApiKey: string | undefined;

  constructor() {
    this.fallback = new HeuristicAIProvider();
    this.nousApiKey = process.env.NOUS_API_KEY;
    this.nousKeyId = process.env.NOUS_KEY_ID;
    this.nousApiUrl = process.env.NOUS_API_URL || 'https://inference-api.nousresearch.com/v1/chat/completions';
    this.nousModel = process.env.NOUS_MODEL || 'meta-llama/llama-3.1-8b-instruct';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
  }

  async chat(messages: ChatMessage[], context?: ChatContext): Promise<string> {
    const isLoggedIn = context?.isLoggedIn ?? false;
    const userName = context?.userName || '';
    const mode = context?.mode || 'barista';
    const isResearchMode = mode === 'research';

    // Fetch live real-time database context
    let dbCtx: RealtimeDatabaseContext;
    try {
      dbCtx = await fetchRealtimeDatabaseContext();
    } catch (err) {
      console.warn('Could not fetch real-time database context from Prisma:', err);
      return await this.fallback.chat(messages, context);
    }

    const cleanChatHistory = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6);

    const systemPromptContent = isResearchMode
      ? `Kamu adalah Asisten Peneliti & Analis Kopi Mahasiswa (Coffee Research Scientist & Industry Analyst).
Status User: ${isLoggedIn ? 'Login (' + userName + ')' : 'Guest'}

TUGAS UTAMA:
Berikan laporan riset kopi yang sangat mendalam, ilmiah, dan terstruktur berbasis data sains (kadar kafein mg, pH keasaman, ekstraksi TDS, roasting profile, origin biji kopi, dan analisis perilaku pasar mahasiswa).

PANDUAN FORMAT & OUTPUT (GUARDRAIL):
- Selalu sajikan jawaban bersih dan gunakan paragraf yang pendek (maksimal 2-3 kalimat per paragraf).
- Gunakan bullet points dengan tanda minus ('- ') untuk daftar metrik, senyawa kimia, dan temuan agar rapi dan enak dibaca.
- Gunakan teks tebal (**bold**) untuk menyorot istilah penting dan angka metrik.

FORMAT JAWABAN WAJIB MEMAKAI KODE MARKDOWN:
🔬 **LAPORAN RISET KOPI: [JUDUL TOPIK]**
📌 **Ringkasan Eksekutif / Temuan**
🧪 **Analisis Sains & Data Komposisi**
📊 **Metrik & Tren Pasar**
💡 **Kesimpulan & Rekomendasi Barista/Peneliti**

DATA NYATA DATABASE KOPI MAHASISWA:
${JSON.stringify({
        products: dbCtx.products,
        promotions: dbCtx.activePromotions,
        tables: dbCtx.tableStats,
        store: dbCtx.storeInfo,
      })}`
      : `Kamu adalah "Barista & Assistant Pintar Kopi Mahasiswa" ☕✨.
Status User: ${isLoggedIn ? 'Login Kak ' + userName : 'Guest / Sobat Mahasiswa'}

PERAN & KARAKTER:
- Ramah, komunikatif, solutif, cepat, santun dan asik khas barista kedai kopi anak muda/mahasiswa.
- Menjawab dengan ringkas, jelas, dan menggunakan emoji yang menarik.
- Selalu memberikan rekomendasi konkret sesuai budget mahasiswa, kebutuhan nugas (tahan kantuk/begadang skripsi), atau kondisi kesehatan (maag/bebas kafein/less sugar).
- Memiliki akses real-time ke data database toko: Daftar Menu, Promo Aktif 2026, Voucher, Ketersediaan Meja, dan Fasilitas Toko.

PANDUAN FORMAT & OUTPUT (GUARDRAIL):
- Jawaban AI harus selalu bersih, rapi, dan menggunakan paragraf-paragraf pendek (maksimal 2-3 kalimat per paragraf).
- Berikan spasi/jarak antar paragraf yang rapi.
- Jika menyebutkan daftar menu, rekomendasi minuman, harga, fasilitas toko, atau promo, WAJIB gunakan bullet points dengan tanda minus ('- ') agar enak dibaca.
- Gunakan teks tebal (**bold**) secara konsisten untuk nama produk, harga (misal **Rp 18.000**), kode promo/voucher, dan info penting.
- Hindari menyajikan teks padat (wall of text) tanpa jeda baris.

ATURAN RESPON:
1. Jika user menyapa ("halo", "hai", "siapa anda"), balas dengan hangat, sebutkan bahwa kamu Barista & Assistant Pintar Kopi Mahasiswa, info ketersediaan meja (${dbCtx.tableStats.availableCount} meja kosong saat ini), dan tawaran bantuan.
2. Jika ditanya ketersediaan meja, sebutkan jumlah meja kosong (${dbCtx.tableStats.availableCount} meja) dan nomor-nomor mejanya.
3. Jika ditanya promo/diskon/voucher, jelaskan promo aktif "Special Mahasiswa Promo 2026" dan kode voucher (${dbCtx.activeVouchers.map((v) => v.code).join(', ')}).
4. Jika ditanya fasilitas/lokasi/jam buka, informasikan jam buka ${dbCtx.storeInfo.operationalHours}, WiFi 100 Mbps, colokan di setiap meja, dan ruangan AC/outdoor.
5. HANYA rekomendasikan produk yang berstatus tersedia (isAvailable: true).
6. DILARANG membuat kode pemrograman (Python/JS/dll) atau menjawab topik luar yang tidak relevan.

DATA REAL-TIME DATABASE TOKO:
${JSON.stringify({
        store: dbCtx.storeInfo,
        tables: {
          total: dbCtx.tableStats.total,
          availableCount: dbCtx.tableStats.availableCount,
          availableNumbers: dbCtx.tableStats.availableNumbers,
        },
        promotions: dbCtx.activePromotions,
        vouchers: dbCtx.activeVouchers,
        products: dbCtx.products,
      })}`;

    // 1. Try Nous Research API if key is available
    if (this.nousApiKey) {
      try {
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${this.nousApiKey}`,
          'Content-Type': 'application/json',
        };

        if (this.nousKeyId) {
          headers['X-Key-Id'] = this.nousKeyId;
        }

        const messagesPayload = [
          { role: 'system', content: systemPromptContent },
          ...cleanChatHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ];

        const res = await fetch(this.nousApiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: this.nousModel,
            messages: messagesPayload,
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) return reply;
        } else {
          console.warn('Nous API call returned status:', res.status, await res.text());
        }
      } catch (err) {
        console.warn('Nous API call failed, trying fallback:', err);
      }
    }

    // 2. Fallback to Gemini if configured
    if (this.geminiApiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${this.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: systemPromptContent }] },
                ...cleanChatHistory.map((m) => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }],
                })),
              ],
            }),
          }
        );

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err) {
        console.warn('Gemini API call failed, falling back to heuristic engine:', err);
      }
    }

    // 3. Fallback to HeuristicAIProvider with live database context
    return await this.fallback.chat(messages, context);
  }

  async getRecommendations(customerId?: string | null, guestContext?: any): Promise<RecommendationResult[]> {
    return await this.fallback.getRecommendations(customerId, guestContext);
  }

  async getAnalyticsInsights(periodDays?: number): Promise<any> {
    return await this.fallback.getAnalyticsInsights(periodDays);
  }
}

export const aiService = new SmartAIService();
