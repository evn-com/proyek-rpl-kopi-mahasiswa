/**
 * lib/ai/openAiCompatible.ts
 * ──────────────────────────────────────────────────────────────
 * Provider streaming untuk model OpenAI (GPT-4o / GPT-3.5) & DeepSeek (V3 / R1).
 * Mendukung direct OpenAI/DeepSeek API serta Nous Research gateway fallback.
 */

import { BARISTA_SYSTEM_INSTRUCTION, RESEARCH_SYSTEM_INSTRUCTION } from './geminiClient';
import { fetchRealtimeDatabaseContext, detectMenuCategoryIntent, type RealtimeDatabaseContext } from './dbContext';
import { getEffectiveApiKey } from './aiConfig';

export interface OpenAiCompatibleOptions {
  modelType: 'gpt' | 'deepseek';
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode?: 'barista' | 'research';
}

/**
 * Memeriksa apakah provider memiliki API key yang valid di DB atau environment
 */
export async function isOpenAiConfigured(): Promise<boolean> {
  const openaiKey = await getEffectiveApiKey('openai');
  const nousKey = await getEffectiveApiKey('nous');
  return Boolean(openaiKey || nousKey);
}

export async function isDeepSeekConfigured(): Promise<boolean> {
  const deepseekKey = await getEffectiveApiKey('deepseek');
  const nousKey = await getEffectiveApiKey('nous');
  return Boolean(deepseekKey || nousKey);
}

/**
 * Generator streaming yang memanggil endpoint OpenAI / DeepSeek / Nous
 * dan mengembalikan teks chunk-by-chunk.
 */
export async function* generateOpenAiCompatibleStream(
  options: OpenAiCompatibleOptions
): AsyncGenerator<string, void, unknown> {
  const { modelType, messages, mode = 'barista' } = options;

  let apiUrl = '';
  let apiKey = '';
  let modelName = '';
  const extraHeaders: Record<string, string> = {};

  if (modelType === 'gpt') {
    const openaiKey = await getEffectiveApiKey('openai');
    const nousKey = await getEffectiveApiKey('nous');

    if (openaiKey) {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = openaiKey;
      modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    } else if (nousKey) {
      apiUrl = process.env.NOUS_API_URL || 'https://inference-api.nousresearch.com/v1/chat/completions';
      apiKey = nousKey;
      modelName = process.env.NOUS_MODEL || 'meta-llama/llama-3.1-8b-instruct';
      if (process.env.NOUS_KEY_ID) {
        extraHeaders['X-Key-Id'] = process.env.NOUS_KEY_ID;
      }
    } else {
      throw new Error('API key OpenAI tidak ditemukan di Pengaturan AI maupun .env.');
    }
  } else if (modelType === 'deepseek') {
    const deepseekKey = await getEffectiveApiKey('deepseek');
    const nousKey = await getEffectiveApiKey('nous');

    if (deepseekKey) {
      apiUrl = 'https://api.deepseek.com/chat/completions';
      apiKey = deepseekKey;
      modelName = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    } else if (nousKey) {
      apiUrl = process.env.NOUS_API_URL || 'https://inference-api.nousresearch.com/v1/chat/completions';
      apiKey = nousKey;
      modelName = process.env.NOUS_MODEL || 'meta-llama/llama-3.1-8b-instruct';
      if (process.env.NOUS_KEY_ID) {
        extraHeaders['X-Key-Id'] = process.env.NOUS_KEY_ID;
      }
    } else {
      throw new Error('API key DeepSeek tidak ditemukan di Pengaturan AI maupun .env.');
    }
  }

  // Siapkan prompt sistem & konteks database
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
  const intent = detectMenuCategoryIntent(lastUserMsg);
  const ctx: RealtimeDatabaseContext = await fetchRealtimeDatabaseContext(intent);

  let filterNotice = 'Kategori: Semua Menu';
  if (intent === 'coffee') {
    filterNotice = '🚨 STRICT FILTER: HANYA MENU KOPI. Dilarang keras menyertakan produk Non-Kopi atau Camilan/Snack!';
  } else if (intent === 'non-coffee') {
    filterNotice = '🚨 STRICT FILTER: HANYA MENU NON-KOPI (Bebas Kafein). Dilarang menyertakan kopi atau snack!';
  } else if (intent === 'snack') {
    filterNotice = '🚨 STRICT FILTER: HANYA CAMILAN / SNACK / MAKANAN. Dilarang menyertakan minuman kopi atau non-kopi!';
  }

  const productListStr = ctx.products
    .map((p) => `- **${p.name}** (Rp ${(p.basePrice ?? 0).toLocaleString('id-ID')}): ${p.description || 'Tersedia'}`)
    .join('\n');

  const promoListStr = ctx.activePromotions
    .map((pr) => `- **${pr.title}**: ${pr.description}`)
    .join('\n');

  const systemPrompt = mode === 'research'
    ? `${RESEARCH_SYSTEM_INSTRUCTION}

KONTEKS DATABASE:
${JSON.stringify({ products: ctx.products, tables: ctx.tableStats })}`
    : `${BARISTA_SYSTEM_INSTRUCTION}

=== 📊 KONTEKS DATABASE REAL-TIME KOPI MAHASISWA ===
${filterNotice}
Total Menu Tersedia: ${ctx.products.length} item

DAFTAR MENU:
${productListStr}

PROMO MAHASISWA AKTIF:
${promoListStr || 'Belum ada promo spesifik aktif hari ini'}

KETERSEDIAAN MEJA:
${ctx.tableStats.availableCount} meja kosong (Nomor: ${ctx.tableStats.availableNumbers.join(', ') || 'Penuh'})

INFORMASI KEDAI:
Jam Buka: ${ctx.storeInfo.operationalHours}
WiFi: Kecepatan 100 Mbps Gratis & Colokan di setiap meja
Pembayaran: QRIS, E-Wallet & Kasir`;

  const payloadMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: modelName,
      messages: payloadMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API ${modelType.toUpperCase()} error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ReadableStream tidak didukung pada response API.');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const rawData = trimmed.replace(/^data:\s*/, '');
      if (rawData === '[DONE]') return;

      try {
        const parsed = JSON.parse(rawData);
        const text = parsed?.choices?.[0]?.delta?.content;
        if (text) {
          yield text;
        }
      } catch {
        // Abaikan parse error untuk chunk non-JSON
      }
    }
  }

  // Flush buffer sisa jika ada
  if (buffer.trim().startsWith('data:')) {
    const rawData = buffer.trim().replace(/^data:\s*/, '');
    if (rawData !== '[DONE]') {
      try {
        const parsed = JSON.parse(rawData);
        const text = parsed?.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {}
    }
  }
}
