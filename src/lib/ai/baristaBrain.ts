/**
 * lib/ai/baristaBrain.ts
 * ──────────────────────────────────────────────────────────────
 * Core WhatsApp AI Barista Brain untuk Kopi Mahasiswa.
 * Menggabungkan:
 * 1. Manajemen percakapan (Conversation History) per nomor pelanggan dengan TTL
 * 2. Idempotency & deduplikasi webhook (mencegah proses berulang saat webhook retry)
 * 3. Retrieval cerdas data real-time database (Menu, Harga, Promo, Meja, Order Status, Membership)
 * 4. Penanganan Opt-in / Opt-out promo ("STOP", "BERHENTI", "PROMO ON")
 * 5. Guardrail ketat: Tidak mengarang harga/promo palsu, mengakui keterbatasan informasi,
 *    dan menawarkan bantuan staf manusia jika diperlukan.
 */

import { prisma } from '../prisma';
import { formatPhoneNumber } from '../whatsapp/fonnteClient';
import { formatOptOutConfirmationMessage, formatOptInConfirmationMessage } from '../whatsapp/templates';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// In-Memory Conversation Memory per normalized phone number
const conversationStore = new Map<string, ChatTurn[]>();
// In-Memory Webhook Deduplication Cache (key: sender+messageHash, value: timestamp)
const deduplicationCache = new Map<string, number>();

const CONVERSATION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEDUPLICATION_WINDOW_MS = 15 * 1000; // 15 seconds

/**
 * Membersihkan cache kadaluarsa secara berkala
 */
function cleanupExpiredCache() {
  const now = Date.now();
  for (const [phone, history] of conversationStore.entries()) {
    const validTurns = history.filter((turn) => now - turn.timestamp < CONVERSATION_TTL_MS);
    if (validTurns.length === 0) {
      conversationStore.delete(phone);
    } else {
      conversationStore.set(phone, validTurns);
    }
  }

  for (const [key, timestamp] of deduplicationCache.entries()) {
    if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
      deduplicationCache.delete(key);
    }
  }
}

/**
 * Cek apakah pesan masuk adalah duplikat dari webhook retry
 */
export function isDuplicateWebhookMessage(sender: string, message: string): boolean {
  cleanupExpiredCache();
  const normalizedPhone = formatPhoneNumber(sender);
  const key = `${normalizedPhone}:${message.trim().toLowerCase()}`;
  const now = Date.now();

  const lastSeen = deduplicationCache.get(key);
  if (lastSeen && now - lastSeen < DEDUPLICATION_WINDOW_MS) {
    return true;
  }

  deduplicationCache.set(key, now);
  return false;
}

/**
 * Simpan riwayat chat per nomor pelanggan
 */
export function appendConversation(phone: string, role: 'user' | 'assistant', content: string) {
  const normalizedPhone = formatPhoneNumber(phone);
  if (!normalizedPhone) return;

  const current = conversationStore.get(normalizedPhone) || [];
  current.push({ role, content, timestamp: Date.now() });

  // Batasi riwayat maksimal 8 interaksi terakhir agar efisien dan relevan
  if (current.length > 8) {
    current.shift();
  }
  conversationStore.set(normalizedPhone, current);
}

/**
 * Ambil riwayat chat per nomor pelanggan
 */
export function getConversationHistory(phone: string): ChatTurn[] {
  const normalizedPhone = formatPhoneNumber(phone);
  if (!normalizedPhone) return [];
  return conversationStore.get(normalizedPhone) || [];
}

/**
 * Mengambil data promo & voucher aktif yang benar-benar valid di database
 */
export async function getVerifiedActivePromotions() {
  const now = new Date();

  const [promotions, vouchers] = await Promise.all([
    prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.voucher.findMany({
      where: {
        isActive: true,
        expiryDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { promotions, vouchers };
}

/**
 * Cek status pesanan pelanggan berdasarkan no WA atau nomor pesanan spesifik
 */
export async function checkOrderStatusByQuery(phone: string, query: string) {
  const normalizedPhone = formatPhoneNumber(phone);

  // Cek apakah ada nomor order di teks (misal: KM-20261023-001 atau #001 atau KM-...)
  const orderNumberMatch = query.match(/KM-[A-Z0-9-]+/i) || query.match(/#([A-Z0-9-]+)/i);
  let order = null;

  if (orderNumberMatch) {
    const rawNumber = orderNumberMatch[1] || orderNumberMatch[0];
    order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: rawNumber.replace('#', '') },
          { orderNumber: { contains: rawNumber.replace('#', '') } },
        ],
      },
      include: { items: true, history: { orderBy: { createdAt: 'desc' } } },
    });
  }

  // Jika belum ditemukan nomor order spesifik, cari order terbaru berdasarkan nomor telepon
  if (!order && normalizedPhone) {
    order = await prisma.order.findFirst({
      where: {
        OR: [
          { customerPhone: normalizedPhone },
          { customerPhone: { contains: normalizedPhone.slice(-9) } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { items: true, history: { orderBy: { createdAt: 'desc' } } },
    });
  }

  return order;
}

/**
 * Cek data profil / status membership pelanggan
 */
export async function getCustomerMembershipData(phone: string) {
  const normalizedPhone = formatPhoneNumber(phone);
  if (!normalizedPhone) return null;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: normalizedPhone },
        { phone: { contains: normalizedPhone.slice(-9) } },
      ],
    },
    include: {
      profile: true,
      membership: true,
    },
  });

  return user;
}

/**
 * Pemroses Utama Jawaban Chatbot WhatsApp
 */
export async function processWhatsAppMessage(
  senderPhone: string,
  incomingMessage: string,
  senderName?: string
): Promise<string> {
  const rawMsg = incomingMessage.trim();
  const lowerMsg = rawMsg.toLowerCase();
  const normalizedPhone = formatPhoneNumber(senderPhone);
  const now = new Date();

  // 1. Tangani Pesan Kosong
  if (!rawMsg) {
    return 'Halo kak! Ada yang bisa Barista Kopi Mahasiswa bantu seputar menu, promo, atau reservasi meja hari ini? ☕✨';
  }

  // 2. Tangani Perintah Opt-out Promo ("STOP", "BERHENTI", "UNSUBSCRIBE")
  const stopKeywords = ['stop', 'berhenti', 'unsubscribe', 'stop promo', 'jangan kirim promo'];
  if (stopKeywords.includes(lowerMsg)) {
    const user = await getCustomerMembershipData(normalizedPhone);
    if (user?.membership) {
      await prisma.membership.update({
        where: { id: user.membership.id },
        data: { promoConsent: false },
      });
    }
    const optOutReply = formatOptOutConfirmationMessage(senderName || user?.name);
    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', optOutReply);
    return optOutReply;
  }

  // 3. Tangani Perintah Opt-in Promo ("PROMO ON", "START PROMO", "AKTIFKAN PROMO")
  const optInKeywords = ['promo on', 'start promo', 'aktifkan promo', 'langganan promo'];
  if (optInKeywords.includes(lowerMsg)) {
    const user = await getCustomerMembershipData(normalizedPhone);
    if (user?.membership) {
      await prisma.membership.update({
        where: { id: user.membership.id },
        data: { promoConsent: true },
      });
    }
    const optInReply = formatOptInConfirmationMessage(senderName || user?.name);
    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', optInReply);
    return optInReply;
  }

  // 4. Riwayat interaksi sebelumnya
  const history = getConversationHistory(normalizedPhone);
  const previousTurn = history.length > 0 ? history[history.length - 1] : null;

  // ── 5. SAPAAN RAMAH ALAMI (GREETINGS & IDENTITAS AI BARISTA) ──
  const greetingWords = [
    'halo', 'hai', 'helo', 'hello', 'hi', 'hey', 'pagi', 'siang', 'sore', 'malam',
    'assalamualaikum', "assalamu'alaikum", 'permisi', 'p', 'tes', 'test', 'ping'
  ];

  const isGreetingWord = greetingWords.some((g) => {
    return (
      lowerMsg === g ||
      lowerMsg === `${g}!` ||
      lowerMsg === `${g}.` ||
      lowerMsg.startsWith(`${g} `) ||
      lowerMsg.endsWith(` ${g}`) ||
      lowerMsg.includes(` ${g} `)
    );
  });

  const isWhoAreYou =
    lowerMsg.includes('siapa kamu') ||
    lowerMsg.includes('siapa anda') ||
    lowerMsg.includes('kamu siapa') ||
    lowerMsg.includes('bot apa') ||
    lowerMsg.includes('bantuan') ||
    lowerMsg.includes('help');

  const hasSpecificTopic =
    lowerMsg.includes('menu') ||
    lowerMsg.includes('katalog') ||
    lowerMsg.includes('kopi') ||
    lowerMsg.includes('coffee') ||
    lowerMsg.includes('harga') ||
    lowerMsg.includes('pesanan') ||
    lowerMsg.includes('order') ||
    lowerMsg.includes('lacak') ||
    lowerMsg.includes('promo') ||
    lowerMsg.includes('diskon') ||
    lowerMsg.includes('voucher') ||
    lowerMsg.includes('meja') ||
    lowerMsg.includes('kursi') ||
    lowerMsg.includes('member') ||
    lowerMsg.includes('poin') ||
    lowerMsg.includes('jam buka') ||
    lowerMsg.includes('lokasi') ||
    lowerMsg.includes('alamat') ||
    lowerMsg.includes('topping') ||
    lowerMsg.includes('croissant') ||
    lowerMsg.includes('americano') ||
    lowerMsg.includes('latte') ||
    lowerMsg.includes('matcha') ||
    lowerMsg.includes('chocolate') ||
    lowerMsg.includes('kentang') ||
    lowerMsg.includes('skripsi') ||
    lowerMsg.includes('begadang') ||
    lowerMsg.includes('maag') ||
    lowerMsg.includes('hemat') ||
    lowerMsg.includes('murah');

  if ((isGreetingWord || isWhoAreYou) && !hasSpecificTopic) {
    const hour = now.getHours();
    const timeGreeting =
      hour < 11
        ? 'Selamat pagi'
        : hour < 15
        ? 'Selamat siang'
        : hour < 18
        ? 'Selamat sore'
        : 'Selamat malam';
    const clientName = senderName ? `Kak ${senderName}` : 'Sobat Kopi Mahasiswa';

    const greetingReply = `${timeGreeting}, ${clientName}! ☕✨

Saya adalah *Barista & Asisten AI Kopi Mahasiswa*. Saya siap membantu Kakak seputar informasi kafe real-time:
• ☕ Rekomendasi Menu & Harga Kopi (Ketik: *"menu coffee"*)
• 🎟️ Cek Promo Diskon & Kode Voucher (Ketik: *"promo"*)
• 🪑 Cek Ketersediaan Meja Kosong & Colokan (Ketik: *"status meja"*)
• 📦 Lacak Status Pesanan yang Sedang Diracik (Ketik: *"lacak pesanan"*)
• 🎓 Info Poin & Diskon 10% Membership (Ketik: *"member"*)
• 📍 Jam Buka, Fasilitas WiFi & Lokasi (Ketik: *"lokasi"*)

Ada yang bisa saya bantu untuk menemani harimu sekarang? 😊`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', greetingReply);
    return greetingReply;
  }

  // ── PENCARIAN STATUS PESANAN (REAL-TIME ORDER TRACKING) ──
  const isOrderQuery =
    lowerMsg.includes('pesanan') ||
    lowerMsg.includes('order') ||
    lowerMsg.includes('status pesanan') ||
    lowerMsg.includes('lacak') ||
    lowerMsg.includes('sudah siap') ||
    lowerMsg.includes('kapan jadi') ||
    lowerMsg.match(/KM-[A-Z0-9-]+/i);

  if (isOrderQuery) {
    const order = await checkOrderStatusByQuery(normalizedPhone, rawMsg);
    if (order) {
      const statusMap: Record<string, string> = {
        WAITING: '⏳ Menunggu Konfirmasi Kasir',
        PENDING_CASHIER: '⏳ Menunggu Pembayaran di Kasir',
        ACCEPTED: '📋 Dikonfirmasi (Masuk antrean barista)',
        CONFIRMED: '📋 Dikonfirmasi (Masuk antrean barista)',
        PROCESSING: '☕ Sedang Diracik oleh Barista',
        PREPARING: '☕ Sedang Diracik oleh Barista',
        READY: '🎉 Pesanan Siap! Silakan ambil di konter barista',
        COMPLETED: '✅ Pesanan Selesai Dinikmati',
        CANCELLED: '❌ Pesanan Dibatalkan',
      };

      const statusText = statusMap[order.status] || order.status;
      const itemList = order.items.map((i) => `• ${i.productName} (${i.quantity}x)`).join('\n');

      const orderReply = `📋 *Status Pesanan Anda (#${order.orderNumber})*

• *Nama Pemesan:* ${order.customerName}
• *Meja:* ${order.tableNumber}
• *Status Saat Ini:* *${statusText}*
• *Metode Bayar:* ${order.paymentMethod === 'ONLINE_PAYMENT' ? 'Online / QRIS' : 'Bayar di Kasir'} (${order.paymentStatus})
• *Total Belanja:* Rp ${order.finalAmount.toLocaleString('id-ID')}

*Menu yang Dipesan:*
${itemList || '• Detail menu tercatat di kasir'}

${
  order.status === 'READY'
    ? '✨ Pesanan sudah siap disajikan! Tunjukkan pesan ini ke barista di konter ya.'
    : order.status === 'PROCESSING'
    ? '☕ Barista sedang menyeduh pesananmu dengan sepenuh hati. Mohon tunggu sebentar ya!'
    : 'Kami akan otomatis mengirim notifikasi WhatsApp jika pesananmu sudah siap disajikan. Selamat bersantai di Kopi Mahasiswa!'
}`;

      appendConversation(normalizedPhone, 'user', rawMsg);
      appendConversation(normalizedPhone, 'assistant', orderReply);
      return orderReply;
    } else {
      const noOrderReply = `Halo kak ${senderName || ''}! Saya belum menemukan pesanan aktif yang terhubung dengan nomor WhatsApp ini.

Jika Kakak baru saja memesan di meja, silakan sebutkan *Nomor Pesanan* (contoh: *#KM-0123*) atau nama pemesan saat checkout agar saya bantu cek langsung ke sistem barista kami ya! ☕🔍`;
      appendConversation(normalizedPhone, 'user', rawMsg);
      appendConversation(normalizedPhone, 'assistant', noOrderReply);
      return noOrderReply;
    }
  }

  // ── PENCARIAN MEMBERSHIP (REAL-TIME STATUS & POIN) ──
  const isMembershipQuery =
    lowerMsg.includes('member') ||
    lowerMsg.includes('membership') ||
    lowerMsg.includes('poin') ||
    lowerMsg.includes('points') ||
    lowerMsg.includes('daftar member') ||
    lowerMsg.includes('kartu member');

  if (isMembershipQuery) {
    const user = await getCustomerMembershipData(normalizedPhone);
    if (user) {
      const membershipStatus = user.membership?.status || 'APPROVED';
      const points = user.profile?.points || 0;

      let memberDetail = '';
      if (membershipStatus === 'PENDING') {
        memberDetail = `Status pendaftaran membership Kakak saat ini sedang *PENDING (Menunggu Persetujuan Admin)*.

Tim Admin kami sedang memverifikasi identitas mahasiswa Kakak. Segera setelah disetujui, Kakak akan menerima pesan WhatsApp konfirmasi dan otomatis mendapatkan bonus 50 poin serta diskon 10% seumur hidup! 🎉`;
      } else if (membershipStatus === 'REJECTED') {
        memberDetail = `Status membership Kakak tercatat *Ditolak*. Alasan: ${user.membership?.rejectionReason || 'Data belum sesuai kriteria'}. Kakak dapat mengajukan kembali melalui website dengan data yang valid ya.`;
      } else {
        memberDetail = `Status Membership: *AKTIF (Member Mahasiswa Resmi)* 🎉
• Saldo Poin Kamu: *${points} Poin*
• Manfaat: Diskon 10% di setiap transaksi menggunakan kode voucher *MEMBER10* saat checkout di meja!`;
      }

      const memberReply = `🎓 *Informasi Akun Member Kopi Mahasiswa*

Halo kak *${user.name}*!
${memberDetail}

Ada yang ingin Kakak tanyakan lagi seputar cara penggunaan poin atau promo member? ☕`;

      appendConversation(normalizedPhone, 'user', rawMsg);
      appendConversation(normalizedPhone, 'assistant', memberReply);
      return memberReply;
    } else {
      const registerInfoReply = `🎓 *Program Membership Kopi Mahasiswa 2026*

Belum terdaftar sebagai member? Yuk daftar sekarang, gratis dan cepat!
*Keuntungan Menjadi Member:*
• 🏷️ *Diskon 10%* untuk seluruh menu kopi & minuman (Kode: *MEMBER10*)
• 🎁 *Bonus 50 Poin Sambutan* langsung masuk ke akun
• ⚡ Akses eksklusif promo bulanan & info event nugas

*Cara Daftar:*
Kunjungi link pendaftaran kami di https://kopimahasiswa.id/register (cukup masukkan Nama, No WA, dan Asal Kampus). Pendaftaran akan ditinjau Admin dan otomatis dikonfirmasi via WhatsApp!`;

      appendConversation(normalizedPhone, 'user', rawMsg);
      appendConversation(normalizedPhone, 'assistant', registerInfoReply);
      return registerInfoReply;
    }
  }

  // ── PENCARIAN PROMO & VOUCHER AKTIF DARI DATABASE ──
  const isPromoQuery =
    lowerMsg.includes('promo') ||
    lowerMsg.includes('diskon') ||
    lowerMsg.includes('voucher') ||
    lowerMsg.includes('potongan') ||
    lowerMsg.includes('kupon') ||
    lowerMsg.includes('hemat') ||
    lowerMsg.includes('penawaran');

  if (isPromoQuery) {
    const { promotions, vouchers } = await getVerifiedActivePromotions();

    if (promotions.length === 0 && vouchers.length === 0) {
      const noPromoReply = `Halo kak! Saat ini belum ada promo spesial baru yang sedang berlangsung di Kopi Mahasiswa.

Namun, Kakak tetap bisa menikmati:
• *Diskon 10% Member Mahasiswa* dengan mendaftar di https://kopimahasiswa.id/register
• Paket ramah kantong mahasiswa mulai *Rp 15.000*
• Fasilitas *WiFi 100 Mbps Gratis & Stopkontak* di setiap meja!

Mau saya rekomendasikan menu kopi hemat untuk hari ini? ☕✨`;
      appendConversation(normalizedPhone, 'user', rawMsg);
      appendConversation(normalizedPhone, 'assistant', noPromoReply);
      return noPromoReply;
    }

    const promoLines = promotions.map((p) => {
      const periodStr = `${p.startDate.toISOString().slice(0, 10)} s/d ${p.endDate.toISOString().slice(0, 10)}`;
      const discStr = p.discountType === 'PERCENTAGE' ? `${p.discountValue || p.discountPercent}%` : `Rp ${p.discountValue.toLocaleString('id-ID')}`;
      return `• 🔥 *${p.title}* (Diskon ${discStr}): ${p.description} _(Berlaku s/d ${periodStr})_`;
    });

    const voucherLines = vouchers.map((v) => {
      const discStr = v.discountType === 'PERCENTAGE' ? `${v.discountAmount}%` : `Rp ${v.discountAmount.toLocaleString('id-ID')}`;
      const minStr = v.minSpend > 0 ? ` (Min. belanja Rp ${v.minSpend.toLocaleString('id-ID')})` : '';
      return `• 🏷️ Kode Voucher: *${v.code}* — Potongan ${discStr}${minStr}`;
    });

    const promoReply = `🎉 *Promo & Voucher Aktif Kopi Mahasiswa Hari Ini!*

${promoLines.length > 0 ? `*Promo Sedang Berjalan:*\n${promoLines.join('\n')}\n\n` : ''}${
      voucherLines.length > 0 ? `*Voucher yang Bisa Kamu Gunakan di Keranjang:*\n${voucherLines.join('\n')}\n\n` : ''
}💡 _Gunakan kode voucher saat checkout di website atau sebutkan ke kasir saat memesan ya! Mau pesan menu apa hari ini?_ ☕✨`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', promoReply);
    return promoReply;
  }

  // ── PENCARIAN KETERSEDIAAN MEJA REAL-TIME ──
  const isTableQuery =
    lowerMsg.includes('meja') ||
    lowerMsg.includes('kursi') ||
    lowerMsg.includes('tempat duduk') ||
    lowerMsg.includes('penuh') ||
    lowerMsg.includes('kapasitas') ||
    lowerMsg.includes('reservasi');

  if (isTableQuery) {
    const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
    const total = tables.length;
    const availableTables = tables.filter((t) => t.status === 'AVAILABLE');
    const availableCount = availableTables.length;
    const occupiedCount = total - availableCount;
    const sampleNumbers = availableTables.slice(0, 6).map((t) => t.number).join(', ');

    const tableReply = `🪑 *Status Ketersediaan Meja Kopi Mahasiswa:*

Saat ini tersedia *${availableCount} meja kosong* dari total ${total} meja (${occupiedCount} meja sedang digunakan).
${availableCount > 0 ? `• Meja siap pakai: *${sampleNumbers}${availableTables.length > 6 ? ', dan lainnya' : ''}*` : '• Saat ini meja sedang penuh. Silakan menunggu beberapa menit ya kak.'}

*Fasilitas Setiap Meja:*
⚡ Stopkontak & colokan charger di setiap meja
📶 WiFi kecepatan tinggi 100 Mbps (Password: nugasbebasantre)
❄️ Ruangan AC dingin & Area Outdoor santai

Kamu bisa langsung datang dan memilih meja melalui menu *'Pilih Meja'* di website kami! ☕✨`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', tableReply);
    return tableReply;
  }

  // ── PENCARIAN JAM BUKA, LOKASI, DAN FASILITAS ──
  const isStoreInfoQuery =
    lowerMsg.includes('jam buka') ||
    lowerMsg.includes('operasional') ||
    lowerMsg.includes('tutup') ||
    lowerMsg.includes('lokasi') ||
    lowerMsg.includes('alamat') ||
    lowerMsg.includes('wifi') ||
    lowerMsg.includes('colokan') ||
    lowerMsg.includes('fasilitas') ||
    lowerMsg.includes('parkir') ||
    lowerMsg.includes('musholla');

  if (isStoreInfoQuery) {
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    const storeName = branch?.name || 'Kopi Mahasiswa Kampus Utama';
    const address = branch?.address || 'Jl. Ganesha No. 10, Bandung (Dekat Gerbang Utama Kampus)';
    const phone = branch?.phone || '+62 812-3456-7890';

    const storeReply = `☕ *Informasi Kedai Kopi Mahasiswa:*

📍 *Lokasi & Cabang:*
*${storeName}*
${address}
📞 Kontak: ${phone}

⏰ *Jam Operasional:*
*Buka Setiap Hari: 08.00 - 23.00 WIB*
(Cocok untuk nugas pagi sampai begadang skripsi malam hari!)

✨ *Fasilitas Kedai:*
• Stopkontak & USB charger di setiap meja
• WiFi 100 Mbps berkecepatan tinggi gratis
• Chatbot AI Barista WhatsApp 24 jam
• Pembayaran QRIS, Kasir, dan E-Wallet
• Area indoor ber-AC sejuk & outdoor santai

Ditunggu kedatangannya ya kak! 🚀`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', storeReply);
    return storeReply;
  }

  // ── PENCARIAN DAFTAR MENU LENGKAP / KATALOG KOPI & MINUMAN REAL-TIME ──
  const isMenuGeneralQuery =
    lowerMsg.includes('menu') ||
    lowerMsg.includes('katalog') ||
    lowerMsg.includes('daftar menu') ||
    lowerMsg.includes('list menu') ||
    lowerMsg.includes('ada apa aja') ||
    lowerMsg.includes('ada apa saja') ||
    lowerMsg.includes('ada menu apa') ||
    lowerMsg.includes('pilihan menu') ||
    lowerMsg.includes('semua menu') ||
    lowerMsg.includes('buku menu') ||
    lowerMsg.includes('katalog kopi') ||
    lowerMsg.includes('menu kopi') ||
    lowerMsg.includes('menu coffee') ||
    lowerMsg === 'kopi' ||
    lowerMsg === 'coffee' ||
    lowerMsg === 'minuman' ||
    lowerMsg === 'daftar kopi' ||
    lowerMsg.includes('berikan menu');

  if (isMenuGeneralQuery) {
    const categoriesWithProducts = await prisma.category.findMany({
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { basePrice: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const categorySections = categoriesWithProducts
      .filter((cat) => cat.products.length > 0)
      .map((cat) => {
        const productLines = cat.products.map(
          (p) => `• *${p.name}* — Rp ${p.basePrice.toLocaleString('id-ID')}`
        );
        return `🏷️ *${cat.name}:*\n${productLines.join('\n')}`;
      })
      .join('\n\n');

    const menuReply = `☕ *DAFTAR MENU & HARGA KOPI MAHASISWA* ☕
_(Real-time update dari sistem kasir & barista)_

${categorySections}

💡 *Informasi Pemesanan & Diskon:*
• 🏷️ *Diskon Member:* Dapatkan potongan 10% dengan kode voucher *MEMBER10*
• 🍨 *Topping Tambahan:* Extra Shot Espresso, Boba, Jelly, Salted Caramel (Ketik: *"topping"*)
• 📱 *Pesan di Meja:* Pilih meja & checkout langsung di website https://kopimahasiswa.id

Ketik nama menu di atas (contoh: *"Americano"* atau *"KSM"*) untuk melihat deskripsi lengkap dan varian rasanya! ☕✨`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', menuReply);
    return menuReply;
  }

  // ── PENCARIAN PRODUK SPESIFIK & TOPPING REAL-TIME ──
  const allProducts = await prisma.product.findMany({
    include: { category: true, variants: true },
    orderBy: { basePrice: 'asc' },
  });

  const allToppings = await prisma.topping.findMany({
    where: { isAvailable: true },
  });

  // Jika user bertanya tentang topping
  if (
    lowerMsg.includes('topping') ||
    lowerMsg.includes('boba') ||
    lowerMsg.includes('jelly') ||
    lowerMsg.includes('syrup') ||
    lowerMsg.includes('extra shot')
  ) {
    const toppingList = allToppings
      .map((t) => `• *${t.name}* (+Rp ${t.price.toLocaleString('id-ID')})`)
      .join('\n');
    const toppingReply = `🍨 *Daftar Pilihan Topping Kopi Mahasiswa:*

${toppingList || '• Extra Shot Espresso (Rp 5.000)\n• Brown Sugar Boba (Rp 4.000)\n• Grass Jelly (Rp 3.000)\n• Salted Caramel Syrup (Rp 4.000)'}

Bisa ditambahkan ke racikan minuman favoritmu saat memesan di meja ya kak! Mau dipadukan dengan kopi apa? ☕`;
    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', toppingReply);
    return toppingReply;
  }

  // Cari apakah ada produk spesifik yang disebut dalam pesan
  const genericKeywords = new Set([
    'kopi', 'coffee', 'susu', 'mahasiswa', 'series', 'crispy', 'bumbu', 'classic', 'paket', 'menu', 'daftar', 'harga', 'minuman'
  ]);

  const matchedProducts = allProducts.filter((p) => {
    const pName = p.name.toLowerCase();
    const pSlug = p.slug.toLowerCase();

    // Exact match nama atau slug
    if (lowerMsg.includes(pName) || lowerMsg.includes(pSlug)) {
      return true;
    }

    // Singkatan KSM
    if (p.name.includes('(KSM)') && (lowerMsg.includes('ksm') || lowerMsg.includes('kopi susu mahasiswa'))) {
      return true;
    }

    // Kata kunci spesifik (abaikan stopwords umum)
    const words = pName.split(/[\s()]+/);
    return words.some((w) => w.length > 3 && !genericKeywords.has(w) && lowerMsg.includes(w));
  });

  // Jika ditemukan produk spesifik di database
  if (matchedProducts.length > 0 && matchedProducts.length <= 4) {
    const productCards = matchedProducts.map((p) => {
      const variantList =
        p.variants.length > 0
          ? `\n  _Pilihan Varian:_ ${p.variants.map((v) => `${v.name} (${v.priceAdjustment >= 0 ? '+' : ''}Rp ${v.priceAdjustment.toLocaleString('id-ID')})`).join(', ')}`
          : '';
      const stockStatus = p.isAvailable ? '✅ *Tersedia*' : '⚠️ *Habis / Sold Out*';

      return `☕ *${p.name}* — *Rp ${p.basePrice.toLocaleString('id-ID')}* [${stockStatus}]
• Kategori: ${p.category?.name || 'Kopi'}
• Deskripsi: ${p.description}${variantList}`;
    });

    const productReply = `Berikut detail menu Kopi Mahasiswa yang Kakak cari:

${productCards.join('\n\n')}

Mau disajikan panas atau dingin (iced)? Kakak bisa langsung pesan dari meja melalui menu website kami ya! ☕✨`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', productReply);
    return productReply;
  }

  // ── REKOMENDASI TEMA KHUSUS (BEGADANG / MAAG / BUDGET / MANIS) ──
  // 1. Begadang / Nugas / Melek (Kafein Tinggi)
  if (
    lowerMsg.includes('begadang') ||
    lowerMsg.includes('skripsi') ||
    lowerMsg.includes('ngantuk') ||
    lowerMsg.includes('kantuk') ||
    lowerMsg.includes('melek') ||
    lowerMsg.includes('strong') ||
    lowerMsg.includes('kafein')
  ) {
    const strongItems = allProducts.filter(
      (p) =>
        (p.name.toLowerCase().includes('americano') ||
          p.name.toLowerCase().includes('espresso') ||
          p.name.toLowerCase().includes('skripsi') ||
          p.name.toLowerCase().includes('double shot')) &&
        p.isAvailable
    );

    const listStr = strongItems
      .slice(0, 3)
      .map((p) => `• *${p.name}* (Rp ${p.basePrice.toLocaleString('id-ID')}): ${p.description}`)
      .join('\n');

    const strongReply = `⚡ *Rekomendasi Menu Begadang & Nugas Semalaman (High Caffeine):*

${listStr || '• *Americano Double Shot* (Rp 16.000): Espresso murni pekat tanpa gula, bikin melek instan!\n• *Paket Skripsi Begadang* (Rp 28.000): Kopi Susu Double Shot + Butter Croissant hangat.'}

Kadar kafein optimal (~120-160mg) siap menemani deadline tugasmu sampai subuh. Mau disajikan panas (Hot) atau dingin (Iced)? ☕🔥`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', strongReply);
    return strongReply;
  }

  // 2. Lambung / Maag / Non-Coffee
  if (
    lowerMsg.includes('maag') ||
    lowerMsg.includes('lambung') ||
    lowerMsg.includes('non-coffee') ||
    lowerMsg.includes('non coffee') ||
    lowerMsg.includes('tanpa kopi') ||
    lowerMsg.includes('teh') ||
    lowerMsg.includes('matcha') ||
    lowerMsg.includes('cokelat') ||
    lowerMsg.includes('chocolate')
  ) {
    const nonCoffeeItems = allProducts.filter(
      (p) =>
        (p.category?.name.toLowerCase().includes('non-coffee') ||
          p.name.toLowerCase().includes('matcha') ||
          p.name.toLowerCase().includes('chocolate') ||
          p.name.toLowerCase().includes('tea')) &&
        p.isAvailable
    );

    const listStr = nonCoffeeItems
      .slice(0, 3)
      .map((p) => `• *${p.name}* (Rp ${p.basePrice.toLocaleString('id-ID')}): ${p.description}`)
      .join('\n');

    const safeReply = `🍃 *Rekomendasi Menu Aman Lambung & Bebas Kafein:*

${listStr || '• *Matcha Latte Uji* (Rp 20.000): Matcha murni kaya antioksidan, 100% aman untuk maag.\n• *Belgian Chocolate Warm* (Rp 20.000): Cokelat Belgia lembut dan creamy menenangkan.'}

Semua menu di atas dibuat tanpa kafein kopi, sehingga sangat nyaman di perut saat nugas lama! 🍵✨`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', safeReply);
    return safeReply;
  }

  // 3. Rekomendasi Budget Mahasiswa (Murah, Hemat)
  if (
    lowerMsg.includes('budget') ||
    lowerMsg.includes('murah') ||
    lowerMsg.includes('hemat') ||
    lowerMsg.includes('kantong') ||
    lowerMsg.includes('15') ||
    lowerMsg.includes('20')
  ) {
    const cheapItems = allProducts
      .filter((p) => p.basePrice <= 20000 && p.isAvailable)
      .slice(0, 4);

    const listStr = cheapItems
      .map((p) => `• *${p.name}* — Rp ${p.basePrice.toLocaleString('id-ID')}`)
      .join('\n');

    const cheapReply = `💰 *Pilihan Menu Paling Hemat Ramah Kantong Mahasiswa (≤ Rp 20.000):*

${listStr}

Daftar member di https://kopimahasiswa.id/register untuk klaim diskon tambahan 10% di setiap pesanan ya! Mau yang mana? ☕✨`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', cheapReply);
    return cheapReply;
  }

  // 4. Makanan / Snack / Lapar
  if (lowerMsg.includes('makan') || lowerMsg.includes('snack') || lowerMsg.includes('roti') || lowerMsg.includes('croissant') || lowerMsg.includes('toast') || lowerMsg.includes('kentang')) {
    const snackItems = allProducts.filter(
      (p) =>
        (p.category?.name.toLowerCase().includes('snack') ||
          p.category?.name.toLowerCase().includes('pastry') ||
          p.name.toLowerCase().includes('croissant') ||
          p.name.toLowerCase().includes('toast') ||
          p.name.toLowerCase().includes('fries')) &&
        p.isAvailable
    );

    const listStr = snackItems
      .slice(0, 3)
      .map((p) => `• *${p.name}* (Rp ${p.basePrice.toLocaleString('id-ID')}): ${p.description}`)
      .join('\n');

    const snackReply = `🥐 *Menu Camilan Hangat Pendamping Nugas:*

${listStr || '• *Butter Croissant Panas* (Rp 15.000): Renyah di luar lembut di dalam.\n• *French Fries Mahasiswa* (Rp 16.000): Kentang goreng renyah saus keju pedas.'}

Dipanggang fresh saat pesanan masuk. Cocok dinikmati bareng es kopi susu! ☕🥖`;

    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', snackReply);
    return snackReply;
  }

  // ── DETEKSI PERTANYAAN DI LUAR MENU / DI LUAR LAYANAN KEDAI ──
  // Contoh: minta nasi padang, bakso, pizza, atau coding, politik
  const outOfScopeItems = ['nasi padang', 'mie ayam', 'bakso', 'pizza', 'soto', 'pecel', 'seblak', 'ayam geprek', 'babi', 'alkohol', 'bir', 'python', 'javascript', 'html', 'coding', 'matematika'];
  const hasOutOfScope = outOfScopeItems.some((item) => lowerMsg.includes(item));

  if (hasOutOfScope) {
    const outReply = `Mohon maaf kak ${senderName || ''} 🙏, Kopi Mahasiswa saat ini khusus menyajikan minuman olahan espresso, kopi susu kekinian, artisan tea, non-coffee, serta camilan pendamping nugas seperti butter croissant dan kentang goreng.

Menu yang Kakak tanyakan belum tersedia di kedai kami. Mau saya rekomendasikan menu kopi atau camilan favorit mahasiswa yang tersedia saat ini? ☕✨`;
    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', outReply);
    return outReply;
  }

  // ── PERTANYAAN AMBIGU / TERLALU PENDEK ──
  if (rawMsg.length < 4) {
    const clarifyReply = `Halo kak! Pertanyaannya agak kurang jelas. Mau mencari rekomendasi kopi yang pekat (tahan kantuk), kopi susu manis creamy, menu non-kopi yang aman di lambung, atau ingin cek status pesanan meja? Beri tahu saya ya ☕😊`;
    appendConversation(normalizedPhone, 'user', rawMsg);
    appendConversation(normalizedPhone, 'assistant', clarifyReply);
    return clarifyReply;
  }

  // ── FALLBACK CERDAS & SOPAN JIKA TIDAK DITEMUKAN ──
  const fallbackReply = `Terima kasih atas pertanyaannya kak ${senderName || ''}! ☕

Untuk pertanyaan spesifik mengenai hal tersebut, saat ini informasi lengkapnya belum tercatat di sistem digital saya. Agar mendapat bantuan langsung:
• Kakak dapat bertanya langsung ke *Barista di konter kedai*, atau
• Hubungi WhatsApp Customer Service kami di *+62 812-3456-7890*.

Kakak juga bisa menanyakan seputar daftar menu, harga, promo hari ini, status meja, atau lacak pesanan aktif. Ada yang bisa saya bantu? ✨`;

  appendConversation(normalizedPhone, 'user', rawMsg);
  appendConversation(normalizedPhone, 'assistant', fallbackReply);
  return fallbackReply;
}
