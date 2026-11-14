/**
 * app/api/chat/route.ts
 * ──────────────────────────────────────────────────────────────
 * Multi-Model AI Chat API — Streaming (SSE) dengan Rate Limiting
 * Mendukung pergantian dinamis via Model Switcher Setting:
 *  - Google Gemini (Gemini 2.5 Flash)
 *  - OpenAI GPT (GPT-4o / GPT-3.5)
 *  - DeepSeek (DeepSeek V3 / R1)
 *  - Heuristic Fallback Engine
 *
 * Method: POST
 * Body: { messages: [{role, content}][], mode?: 'barista'|'research' }
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { checkRateLimit, extractIdentifier, RATE_LIMIT_CONFIG } from '@/lib/ai/rateLimiter';
import { generateStream, isGeminiConfigured } from '@/lib/ai/geminiClient';
import {
  generateOpenAiCompatibleStream,
  isGrokConfigured,
  isXKiroConfigured,
} from '@/lib/ai/openAiCompatible';
import { aiService } from '@/lib/ai/aiService';
import { detectMenuCategoryIntent } from '@/lib/ai/dbContext';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper untuk membungkus async iterable / generator menjadi Response SSE
 */
function createSseResponse(
  streamGenerator: AsyncIterable<string>,
  activeModel: string,
  providerLabel: string,
  rateLimitRemaining: number,
  categoryIntent: string
): Response {
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of streamGenerator) {
          const payload = JSON.stringify({ chunk });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (streamErr) {
        console.error(`[${providerLabel} Stream] Error during streaming:`, streamErr);
        const errPayload = JSON.stringify({
          error: 'Stream terputus. Jawaban mungkin tidak lengkap.',
        });
        controller.enqueue(encoder.encode(`data: ${errPayload}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-RateLimit-Remaining': String(rateLimitRemaining),
      'X-Category-Intent': categoryIntent,
      'X-Active-Model': activeModel,
      'X-AI-Provider': providerLabel,
    },
  });
}

export async function POST(req: NextRequest) {
  // ── 1. Parse request body ──────────────────────────────────
  let body: { messages?: any[]; mode?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Request body tidak valid (JSON parse error).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages, mode = 'barista' } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Pesan tidak boleh kosong.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 2. Validasi panjang pesan terakhir ─────────────────────
  const lastUserMsg = messages
    .filter((m) => m.role === 'user')
    .pop()?.content ?? '';

  if (typeof lastUserMsg !== 'string' || lastUserMsg.trim() === '') {
    return new Response(
      JSON.stringify({ error: 'Pesan tidak boleh kosong.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (lastUserMsg.length > RATE_LIMIT_CONFIG.maxInputChars) {
    return new Response(
      JSON.stringify({
        error: `Pesan terlalu panjang. Maksimal ${RATE_LIMIT_CONFIG.maxInputChars} karakter. Kamu mengirim ${lastUserMsg.length} karakter.`,
        code: 'INPUT_TOO_LONG',
        maxChars: RATE_LIMIT_CONFIG.maxInputChars,
        currentChars: lastUserMsg.length,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 3. Rate Limiting ──────────────────────────────────────
  const user = getUserFromRequest(req);
  const identifier = extractIdentifier(req, user?.userId);
  const rateLimitResult = checkRateLimit(identifier);

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Anda telah mencapai batas kirim pesan. Silakan tunggu 1 menit lagi.',
        code: 'RATE_LIMIT_EXCEEDED',
        resetInSeconds: rateLimitResult.resetInSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.resetInSeconds),
          'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + rateLimitResult.resetInSeconds),
        },
      }
    );
  }

  // ── 4. Ambil Konfigurasi Active AI Model dari Database ─────
  let activeModel = 'gemini';
  try {
    const settingDelegate = (prisma as any).setting;
    if (settingDelegate) {
      const record = await settingDelegate.findUnique({
        where: { key: 'active_ai_model' },
      });
      if (record?.value) {
        activeModel = record.value;
      }
    }
  } catch (dbErr) {
    console.warn('[Chat API] Could not read active_ai_model setting from database:', dbErr);
  }

  // ── 5. Intent Recognition & Chat Mode ──────────────────────
  const categoryIntent = detectMenuCategoryIntent(lastUserMsg);
  const chatMode = (mode === 'research' ? 'research' : 'barista') as 'barista' | 'research';

  // ── 6. Routing Eksekusi Berdasarkan Model Aktif (Gemini / Grok / xKiro) ──
  // Jalur 1: xAI Grok (jika aktif)
  if (activeModel === 'grok') {
    if (await isGrokConfigured()) {
      try {
        const stream = generateOpenAiCompatibleStream({
          modelType: 'grok',
          messages,
          mode: chatMode,
        });
        return createSseResponse(stream, activeModel, 'xai-grok', rateLimitResult.remaining, categoryIntent);
      } catch (grokErr) {
        console.error('[xAI Grok] Error, falling back to Gemini/Heuristic:', grokErr);
      }
    }
  }

  // Jalur 2: xKiro Gateway (jika aktif)
  if (activeModel === 'xkiro') {
    if (await isXKiroConfigured()) {
      try {
        const stream = generateOpenAiCompatibleStream({
          modelType: 'xkiro',
          messages,
          mode: chatMode,
        });
        return createSseResponse(stream, activeModel, 'xkiro-gateway', rateLimitResult.remaining, categoryIntent);
      } catch (xkiroErr) {
        console.error('[xKiro Gateway] Error, falling back to Gemini/Heuristic:', xkiroErr);
      }
    }
  }

  // Jalur 3: Google Gemini (default atau fallback)
  if (await isGeminiConfigured()) {
    try {
      const stream = await generateStream(messages, chatMode);
      return createSseResponse(stream, activeModel, 'google-gemini', rateLimitResult.remaining, categoryIntent);
    } catch (geminiErr: any) {
      console.error('[Gemini] API Error:', geminiErr?.message ?? geminiErr);
      // Fall through ke heuristic fallback
    }
  }

  // Jalur 4: Heuristic Fallback (Paling handal jika API eksternal belum berkonfigurasi key)
  try {
    const isLoggedIn = !!user;
    const userName = user?.name || '';
    const reply = await aiService.chat(messages, { isLoggedIn, userName, mode: chatMode });

    // Wrap fallback dalam SSE format agar UI client tidak perlu membedakan path
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: reply })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-Active-Model': activeModel,
        'X-AI-Provider': 'heuristic-fallback',
        'X-Category-Intent': categoryIntent,
      },
    });
  } catch (fallbackErr) {
    console.error('[Fallback AI] Error:', fallbackErr);
    return new Response(
      JSON.stringify({
        error: 'Barista AI sedang sibuk. Silakan coba lagi dalam beberapa detik.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
