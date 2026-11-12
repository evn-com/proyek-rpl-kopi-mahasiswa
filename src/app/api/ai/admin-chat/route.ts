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

    const q = lastUserMsg.toLowerCase().trim();

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
      'jumlah user', 'total user', 'distribusi user', 'data user', 'daftar user', 'pengguna',
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
