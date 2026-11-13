/**
 * lib/ai/geminiClient.ts
 * ──────────────────────────────────────────────────────────────
 * Singleton Gemini client menggunakan @google/genai SDK resmi.
 * Model: gemini-2.5-flash (cepat, hemat kuota).
 *
 * Menyediakan:
 *  - generateStream() → untuk streaming SSE ke client
 *  - generate()       → untuk one-shot (non-streaming) response
 */

import { GoogleGenAI } from '@google/genai';
import { fetchRealtimeDatabaseContext, detectMenuCategoryIntent, type RealtimeDatabaseContext } from './dbContext';
import { getEffectiveApiKey } from './aiConfig';

const MODEL_ID = 'gemini-2.5-flash';

/** Output token limit — batasi agar hemat kuota */
const MAX_OUTPUT_TOKENS = 600;

/** System instruction inti: paksa AI tetap on-topic Kopi Mahasiswa dengan filter kategori ketat */
export const BARISTA_SYSTEM_INSTRUCTION = `Kamu adalah "Barista & Assistant Pintar Kopi Mahasiswa" ☕✨ — chatbot resmi kedai kopi mahasiswa.

PERAN & KARAKTER:
- Ramah, solutif, cepat, dan santun khas barista anak muda.
- Menjawab dengan bahasa Indonesia yang ringkas, jelas, dan menggunakan emoji menarik.
- Memberikan rekomendasi konkret sesuai budget mahasiswa (menu hemat, nugas, begadang, maag/kafein rendah).
- Memiliki akses real-time ke data menu, promo aktif, ketersediaan meja, dan fasilitas toko.

=== 🎯 ATURAN UTAMA JAWABAN AI (STRICT CATEGORY FILTERING) ===
Patuhi aturan ketat pemilahan kategori menu berikut tanpa toleransi:

1. Kategori KOPI:
   - Jika user menanyakan "menu kopi", "coffee", "es kopi", "minuman kopi", atau racikan kopi:
   - HANYA tampilkan produk yang termasuk kategori Kopi (misal: Kopi Susu Mahasiswa, Caramel Macchiato, Hazelnut Latte, Pandan Aren Latte, Americano, Classic Caffe Latte).
   - DILARANG KERAS menyertakan menu Non-Kopi atau Camilan/Snack.

2. Kategori NON-KOPI:
   - Jika user menanyakan "menu non kopi", "minuman non kopi", "bukan kopi", "tanpa kopi", "bebas kafein", atau sejenisnya:
   - HANYA tampilkan produk yang TIDAK mengandung kopi/espresso (misal: Matcha Green Tea Latte, Artisan Chocolate, Red Velvet, Taro, Tea Series).
   - DILARANG KERAS menyertakan menu berunsur kopi (seperti Kopi Susu, Espresso, Macchiato, Latte, Americano) maupun makanan/camilan.

3. Kategori SNACK / CAMILAN:
   - Jika user menanyakan "snack", "camilan", "makanan ringan", atau "makanan":
   - HANYA tampilkan produk dalam kategori makanan/snack (misal: French Fries, Toast, Roti Bakar, Croissant, Dimsum, Cireng).
   - DILARANG KERAS menyertakan menu minuman kopi maupun minuman non-kopi.

4. SUMBER DATA:
   - HANYA gunakan daftar produk yang disediakan dalam konteks database. DILARANG membuat data/menu/promo yang tidak ada di konteks database.

PANDUAN FORMAT & OUTPUT (GUARDRAIL):
- Jawaban harus selalu bersih, terstruktur, dan menggunakan paragraf yang pendek (maksimal 2-3 kalimat per paragraf).
- Berikan jarak baris antar-paragraf yang rapi agar nyaman dibaca.
- Jika menyebutkan daftar menu, rekomendasi minuman, harga, fasilitas, atau promo, WAJIB gunakan bullet points dengan tanda minus ('- ') agar enak dibaca:
  Format item: - **Nama Produk** (Harga): Deskripsi singkat
- Gunakan teks tebal (**bold**) secara konsisten untuk menonjolkan nama menu, harga produk, kode voucher, atau informasi penting.
- Hindari paragraf panjang yang menumpuk tanpa pemisah baris.
- Jika pengguna menanyakan IDENTITAS DIRI (misal: "siapa saya", "profil saya", "siapa aku"): jawab dengan ramah bahwa ia adalah sobat setia pelanggan Kopi Mahasiswa dan tanyakan apa yang ingin dipesan. JANGAN PERNAH memuntahkan data omset atau ringkasan database jika tidak diminta!
- TOLAK dengan sopan pertanyaan yang tidak relevan (coding, politik, matematika umum, dll): "Maaf Kak, saya hanya bisa membantu seputar menu & layanan Kopi Mahasiswa ☕"
- Jangan menyebut nama kompetitor kafe lain.
- Format jawaban: markdown rapi (bold, bullet list dengan minus '-') — maks 3-4 paragraf pendek.`;

export const RESEARCH_SYSTEM_INSTRUCTION = `Kamu adalah "Asisten Peneliti & Analis Kopi" — asisten ilmiah seputar dunia kopi.

PERAN:
- Memberikan laporan riset mendalam: kadar kafein (mg), keasaman (pH), profil roasting, origin biji kopi, sains ekstraksi (TDS, rasio).
- Menganalisis tren konsumsi kopi mahasiswa secara ilmiah.

PANDUAN FORMAT & OUTPUT (GUARDRAIL):
- Jawaban harus selalu bersih, ilmiah, dan menggunakan paragraf yang pendek.
- Gunakan bullet points dengan tanda minus ('- ') untuk rincian data metrik, komposisi, dan perbandingan agar mudah dibaca.
- Gunakan teks tebal (**bold**) untuk menyorot angka metrik, parameter seduh, dan istilah sains kunci.
- Format respons wajib memakai struktur riset: Ringkasan → Analisis Sains → Data/Metrik → Kesimpulan.

ATURAN:
1. HANYA menjawab topik seputar sains, kimia, dan tren pasar kopi.
2. Tolak topik lain di luar domain kopi & F&B.
3. Sertakan angka/data sains yang akurat (mg kafein, pH, suhu ekstraksi).`;

// Dynamic Gemini client
let _client: GoogleGenAI | null = null;
let _cachedKey: string = '';

async function getClient(): Promise<GoogleGenAI> {
  const apiKey = await getEffectiveApiKey('gemini');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di Pengaturan AI maupun .env');
  }
  if (!_client || _cachedKey !== apiKey) {
    _client = new GoogleGenAI({ apiKey });
    _cachedKey = apiKey;
  }
  return _client;
}

export interface GeminiChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/**
 * Converts our internal ChatMessage format to Gemini's expected format.
 */
export function toChatHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): GeminiChatMessage[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

/**
 * Build a context-enriched user prompt that includes real-time DB snapshot with strict category filtering.
 */
async function buildEnrichedPrompt(
  userMessage: string,
  mode: 'barista' | 'research'
): Promise<string> {
  if (mode === 'research') {
    // Research mode doesn't need live DB context
    return userMessage;
  }

  const q = userMessage.toLowerCase().trim();
  const profileKeywords = ['siapa saya', 'siapa aku', 'siapakah saya', 'siapakah aku', 'nama saya', 'namaku', 'profil saya', 'profilku', 'akun saya', 'who am i'];
  if (profileKeywords.some((pk) => q.includes(pk))) {
    // Jangan injeksi database context untuk pertanyaan profil user agar Gemini menjawab relevan
    return userMessage;
  }

  try {
    // 1. Identifikasi Intent Kategori Menu (Intent Recognition)
    const intent = detectMenuCategoryIntent(userMessage);

    // 2. Query Prisma database yang terfilter ketat sesuai intent kategori
    const ctx: RealtimeDatabaseContext = await fetchRealtimeDatabaseContext(intent);

    let filterNotice = 'Kategori: Semua Menu';
    if (intent === 'coffee') {
      filterNotice = '🚨 STRICT FILTER: HANYA MENU KOPI. Dilarang keras menyertakan produk Non-Kopi atau Camilan/Snack!';
    } else if (intent === 'non-coffee') {
      filterNotice = '🚨 STRICT FILTER: HANYA MENU NON-KOPI (Bebas Kopi). Dilarang keras menyertakan produk Kopi atau Camilan/Snack!';
    } else if (intent === 'snack') {
      filterNotice = '🚨 STRICT FILTER: HANYA MENU SNACK / CAMILAN. Dilarang keras menyertakan minuman kopi maupun non-kopi!';
    }

    const dbSummary = {
      filterKategoriDiminta: intent,
      aturanFilterKetat: filterNotice,
      daftarProdukTerfilter: ctx.products
        .filter((p) => p.isAvailable)
        .map((p) => `${p.name} (Rp${p.basePrice.toLocaleString('id-ID')}) — ${p.description}`),
      meja: {
        tersedia: ctx.tableStats.availableCount,
        total: ctx.tableStats.total,
        nomorKosong: ctx.tableStats.availableNumbers.slice(0, 10),
      },
      promoAktif: ctx.activePromotions.map((p) => p.title),
      voucher: ctx.activeVouchers.map((v) => v.code),
    };

    return `[KONTEKS MENU TERFILTER REAL-TIME]\n${JSON.stringify(dbSummary, null, 2)}\n\n[PERTANYAAN USER]\n${userMessage}`;
  } catch {
    // If DB context fails, still answer without it
    return userMessage;
  }
}

/**
 * Generate a streaming response from Gemini.
 * Returns an AsyncIterable of text chunks.
 */
export async function generateStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  mode: 'barista' | 'research' = 'barista'
): Promise<AsyncIterable<string>> {
  const client = await getClient();
  const systemInstruction = mode === 'research' ? RESEARCH_SYSTEM_INSTRUCTION : BARISTA_SYSTEM_INSTRUCTION;

  // Pisahkan history (tanpa pesan terakhir) dan last user message
  const history = messages.slice(0, -1);
  const lastMsg = messages[messages.length - 1];
  const enrichedPrompt = await buildEnrichedPrompt(lastMsg.content, mode);

  const chatHistory = toChatHistory(history);

  const chat = client.chats.create({
    model: MODEL_ID,
    config: {
      systemInstruction,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      topP: 0.95,
      // Disable thinking mode — required for gemini-2.5-flash to avoid
      // "model output must contain either output text or tool calls" error
      thinkingConfig: { thinkingBudget: 0 },
    },
    history: chatHistory,
  });

  const stream = await chat.sendMessageStream({ message: enrichedPrompt });

  async function* textChunks(): AsyncIterable<string> {
    let hasOutput = false;
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        hasOutput = true;
        yield text;
      }
      // Detect safety block or empty model output
      const finishReason = chunk.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        if (!hasOutput) {
          yield 'Maaf, saya tidak dapat memproses permintaan tersebut saat ini. Silakan coba pertanyaan lain ☕';
        }
        return;
      }
    }
    if (!hasOutput) {
      yield 'Maaf, saya tidak mendapat respons dari AI. Silakan coba lagi ☕';
    }
  }

  return textChunks();
}

/**
 * Generate a non-streaming (full) response from Gemini.
 * Used as fallback when streaming is not needed.
 */
export async function generate(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  mode: 'barista' | 'research' = 'barista'
): Promise<string> {
  const client = await getClient();
  const systemInstruction = mode === 'research' ? RESEARCH_SYSTEM_INSTRUCTION : BARISTA_SYSTEM_INSTRUCTION;

  const history = messages.slice(0, -1);
  const lastMsg = messages[messages.length - 1];
  const enrichedPrompt = await buildEnrichedPrompt(lastMsg.content, mode);

  const chat = client.chats.create({
    model: MODEL_ID,
    config: {
      systemInstruction,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 },
    },
    history: toChatHistory(history),
  });

  const response = await chat.sendMessage({ message: enrichedPrompt });
  const text = response.text?.trim();
  return text || 'Maaf, saya tidak mendapat respons dari AI. Silakan coba lagi ☕';
}

/** Cek apakah Gemini API Key tersedia */
export async function isGeminiConfigured(): Promise<boolean> {
  const key = await getEffectiveApiKey('gemini');
  return Boolean(key && key.length >= 8);
}
