import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const VALID_MODELS = ['gemini', 'gpt', 'deepseek', 'nous'] as const;
type AIModel = (typeof VALID_MODELS)[number];

type ApiKeyProvider = 'gemini' | 'openai' | 'deepseek' | 'nous';

/** Ambil API key dari DB (override), fallback ke env */
async function getApiKeyFromDb(provider: ApiKeyProvider): Promise<{ value: string | null; updatedAt: string | null }> {
  try {
    const settingDelegate = (prisma as any).setting;
    if (!settingDelegate) return { value: null, updatedAt: null };
    const setting = await settingDelegate.findUnique({
      where: { key: `ai_api_key_${provider}` },
    });
    return {
      value: setting?.value || null,
      updatedAt: setting?.updatedAt ? new Date(setting.updatedAt).toISOString() : null,
    };
  } catch {
    return { value: null, updatedAt: null };
  }
}

/** Ambil riwayat tes latency model dari DB */
async function getModelTestResult(modelId: string): Promise<{ lastTested: string | null; latencyMs: number | null; status: string | null; error?: string }> {
  try {
    const settingDelegate = (prisma as any).setting;
    if (!settingDelegate) return { lastTested: null, latencyMs: null, status: null };
    const setting = await settingDelegate.findUnique({
      where: { key: `ai_test_${modelId}` },
    });
    if (setting?.value) {
      return JSON.parse(setting.value);
    }
  } catch {
    // ignore
  }
  return { lastTested: null, latencyMs: null, status: null };
}

function maskApiKey(key: string | null): string {
  if (!key || key.length < 8) return '';
  return key.slice(0, 8) + '••••••••' + key.slice(-4);
}

/**
 * Uji koneksi model dan ukur latensi respons (ms)
 */
async function testModelConnection(model: AIModel, customKey?: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    if (model === 'gemini') {
      const dbKey = (await getApiKeyFromDb('gemini')).value;
      const apiKey = customKey || dbKey || process.env.GEMINI_API_KEY || '';
      if (!apiKey) throw new Error('API Key Google Gemini belum diatur.');

      const client = new GoogleGenAI({ apiKey });
      const chat = client.chats.create({
        model: 'gemini-2.5-flash',
        config: { maxOutputTokens: 5, temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } },
      });
      await chat.sendMessage({ message: 'ping' });
      return { success: true, latencyMs: Date.now() - start };
    }

    if (model === 'gpt') {
      const dbKey = (await getApiKeyFromDb('openai')).value;
      const apiKey = customKey || dbKey || process.env.OPENAI_API_KEY || '';
      if (apiKey) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`OpenAI HTTP ${res.status}: ${err.slice(0, 100)}`);
        }
        return { success: true, latencyMs: Date.now() - start };
      }

      // Fallback ke Nous jika OpenAI key tidak ada
      const dbNousKey = (await getApiKeyFromDb('nous')).value;
      const nousKey = dbNousKey || process.env.NOUS_API_KEY || '';
      if (nousKey) {
        const res = await fetch(process.env.NOUS_API_URL || 'https://inference-api.nousresearch.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${nousKey}`,
            ...(process.env.NOUS_KEY_ID ? { 'X-Key-Id': process.env.NOUS_KEY_ID } : {}),
          },
          body: JSON.stringify({
            model: process.env.NOUS_MODEL || 'meta-llama/llama-3.1-8b-instruct',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) throw new Error(`Nous HTTP ${res.status}`);
        return { success: true, latencyMs: Date.now() - start };
      }
      throw new Error('API Key OpenAI / Nous belum diatur.');
    }

    if (model === 'deepseek') {
      const dbKey = (await getApiKeyFromDb('deepseek')).value;
      const apiKey = customKey || dbKey || process.env.DEEPSEEK_API_KEY || '';
      if (!apiKey) throw new Error('API Key DeepSeek belum diatur.');

      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`DeepSeek HTTP ${res.status}: ${err.slice(0, 100)}`);
      }
      return { success: true, latencyMs: Date.now() - start };
    }

    if (model === 'nous') {
      const dbKey = (await getApiKeyFromDb('nous')).value;
      const apiKey = customKey || dbKey || process.env.NOUS_API_KEY || '';
      if (!apiKey) throw new Error('API Key Nous Research belum diatur.');

      const res = await fetch(process.env.NOUS_API_URL || 'https://inference-api.nousresearch.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(process.env.NOUS_KEY_ID ? { 'X-Key-Id': process.env.NOUS_KEY_ID } : {}),
        },
        body: JSON.stringify({
          model: process.env.NOUS_MODEL || 'meta-llama/llama-3.1-8b-instruct',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
      });
      if (!res.ok) throw new Error(`Nous HTTP ${res.status}`);
      return { success: true, latencyMs: Date.now() - start };
    }

    throw new Error('Model tidak didukung untuk tes.');
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - start, error: err.message || 'Koneksi gagal.' };
  }
}

/**
 * GET /api/settings/ai
 * Mengambil model AI aktif, status API key setiap provider, dan hasil tes terkini.
 */
export async function GET(req: Request) {
  try {
    const settingDelegate = (prisma as any).setting;
    let activeModel = 'gemini';

    if (settingDelegate) {
      const setting = await settingDelegate.findUnique({
        where: { key: 'active_ai_model' },
      });
      if (setting?.value) {
        activeModel = setting.value;
      }
    }

    // Ambil API key dari DB (override) atau env
    const [dbGemini, dbOpenAi, dbDeepSeek, dbNous] = await Promise.all([
      getApiKeyFromDb('gemini'),
      getApiKeyFromDb('openai'),
      getApiKeyFromDb('deepseek'),
      getApiKeyFromDb('nous'),
    ]);

    const geminiKey = dbGemini.value || process.env.GEMINI_API_KEY || '';
    const openaiKey = dbOpenAi.value || process.env.OPENAI_API_KEY || '';
    const deepseekKey = dbDeepSeek.value || process.env.DEEPSEEK_API_KEY || '';
    const nousKey = dbNous.value || process.env.NOUS_API_KEY || '';

    // Ambil riwayat tes latency
    const [testGemini, testGpt, testDeepSeek, testNous] = await Promise.all([
      getModelTestResult('gemini'),
      getModelTestResult('gpt'),
      getModelTestResult('deepseek'),
      getModelTestResult('nous'),
    ]);

    return NextResponse.json({
      success: true,
      activeModel,
      apiKeys: {
        gemini: {
          provider: 'gemini',
          label: 'Google Gemini',
          isConfigured: !!geminiKey,
          maskedKey: maskApiKey(geminiKey),
          rawKey: geminiKey || '',
          source: dbGemini.value ? 'database' : (process.env.GEMINI_API_KEY ? 'environment' : 'none'),
          updatedAt: dbGemini.updatedAt || (process.env.GEMINI_API_KEY ? 'Environment (.env)' : null),
        },
        openai: {
          provider: 'openai',
          label: 'OpenAI GPT',
          isConfigured: !!openaiKey,
          maskedKey: maskApiKey(openaiKey),
          rawKey: openaiKey || '',
          source: dbOpenAi.value ? 'database' : (process.env.OPENAI_API_KEY ? 'environment' : 'none'),
          updatedAt: dbOpenAi.updatedAt || (process.env.OPENAI_API_KEY ? 'Environment (.env)' : null),
        },
        deepseek: {
          provider: 'deepseek',
          label: 'DeepSeek',
          isConfigured: !!deepseekKey,
          maskedKey: maskApiKey(deepseekKey),
          rawKey: deepseekKey || '',
          source: dbDeepSeek.value ? 'database' : (process.env.DEEPSEEK_API_KEY ? 'environment' : 'none'),
          updatedAt: dbDeepSeek.updatedAt || (process.env.DEEPSEEK_API_KEY ? 'Environment (.env)' : null),
        },
        nous: {
          provider: 'nous',
          label: 'Nous Research',
          isConfigured: !!nousKey,
          maskedKey: maskApiKey(nousKey),
          rawKey: nousKey || '',
          source: dbNous.value ? 'database' : (process.env.NOUS_API_KEY ? 'environment' : 'none'),
          updatedAt: dbNous.updatedAt || (process.env.NOUS_API_KEY ? 'Environment (.env)' : null),
        },
      },
      availableModels: [
        {
          id: 'gemini',
          name: 'Google Gemini',
          subName: 'Gemini 2.5 Flash',
          modelId: 'gemini-2.5-flash',
          providerKey: 'gemini',
          contextWindow: '1.000.000 token',
          tag: 'Rekomendasi Utama',
          description: 'Model utama Google yang sudah diuji dengan penalaran menu real-time dan latensi ultra cepat.',
          isConfigured: !!geminiKey,
          lastTested: testGemini.lastTested,
          latencyMs: testGemini.latencyMs,
          testStatus: testGemini.status,
        },
        {
          id: 'gpt',
          name: 'OpenAI GPT',
          subName: 'GPT-4o Mini / GPT-3.5',
          modelId: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          providerKey: 'openai',
          contextWindow: '128.000 token',
          tag: 'High Reasoning',
          description: 'Model percakapan cerdas dengan analisis mendalam, gaya santai, dan gateway OpenAI API.',
          isConfigured: !!openaiKey || !!nousKey,
          lastTested: testGpt.lastTested,
          latencyMs: testGpt.latencyMs,
          testStatus: testGpt.status,
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          subName: 'DeepSeek V3 / R1',
          modelId: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          providerKey: 'deepseek',
          contextWindow: '64.000 token',
          tag: 'Cost Efficient',
          description: 'Arsitektur efisiensi komputasi tinggi untuk volume chat besar dan kalkulasi budget mahasiswa.',
          isConfigured: !!deepseekKey || !!nousKey,
          lastTested: testDeepSeek.lastTested,
          latencyMs: testDeepSeek.latencyMs,
          testStatus: testDeepSeek.status,
        },
        {
          id: 'nous',
          name: 'Command / Llama 3.1',
          subName: 'Meta Llama 3.1 8B Instruct',
          modelId: process.env.NOUS_MODEL || 'meta-llama/llama-3.1-8b-instruct',
          providerKey: 'nous',
          contextWindow: '128.000 token',
          tag: 'Open Weights Gateway',
          description: 'Model asisten alternatif yang diuji melalui Nous Research Inference API sebagai cadangan handal.',
          isConfigured: !!nousKey,
          lastTested: testNous.lastTested,
          latencyMs: testNous.latencyMs,
          testStatus: testNous.status,
        },
      ],
    });
  } catch (err: any) {
    console.error('[API Setting AI GET] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat konfigurasi model AI.', activeModel: 'gemini' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/ai
 * Menangani:
 * 1. Aktivasi Model: { model: 'gemini' | 'gpt' | 'deepseek' | 'nous' }
 * 2. Simpan API Key: { provider: 'gemini', apiKey: '...' }
 * 3. Reset API Key: { provider: 'gemini', reset: true }
 * 4. Uji Model: { action: 'test_model', model: 'gemini' }
 */
export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    const userRole = userPayload?.role?.toLowerCase();
    if (!userPayload || (userRole !== 'admin' && userRole !== 'owner')) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Hanya Admin/Owner yang dapat mengubah konfigurasi AI.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const settingDelegate = (prisma as any).setting;

    // ─── 1. UJI MODEL LANGSUNG ────────────────────────────────────────────────
    if (body.action === 'test_model') {
      const { model } = body;
      if (!model || !VALID_MODELS.includes(model as AIModel)) {
        return NextResponse.json({ success: false, error: 'Model tidak valid untuk diuji.' }, { status: 400 });
      }

      const testResult = await testModelConnection(model as AIModel);
      const testRecord = {
        lastTested: new Date().toISOString(),
        latencyMs: testResult.latencyMs,
        status: testResult.success ? 'ok' : 'error',
        error: testResult.error ? testResult.error.slice(0, 200) : undefined,
      };

      if (settingDelegate) {
        try {
          await settingDelegate.upsert({
            where: { key: `ai_test_${model}` },
            update: { value: JSON.stringify(testRecord) },
            create: { key: `ai_test_${model}`, value: JSON.stringify(testRecord) },
          });
        } catch (dbErr) {
          console.warn('[AI Settings] Could not save test record:', dbErr);
        }
      }

      return NextResponse.json({
        success: testResult.success,
        latencyMs: testResult.latencyMs,
        lastTested: testRecord.lastTested,
        error: testResult.error,
        message: testResult.success
          ? `Model ${model.toUpperCase()} berhasil merespons dalam ${testResult.latencyMs} ms!`
          : `Gagal menghubungi model ${model.toUpperCase()}: ${testResult.error}`,
      });
    }

    // ─── 2. UPDATE ACTIVE MODEL ───────────────────────────────────────────────
    if (body.model !== undefined && body.action !== 'test_model') {
      const { model } = body;
      if (!model || !VALID_MODELS.includes(model as AIModel)) {
        return NextResponse.json(
          { success: false, error: `Model AI tidak valid. Pilihan: ${VALID_MODELS.join(', ')}` },
          { status: 400 }
        );
      }

      if (!settingDelegate) {
        return NextResponse.json({ success: false, error: 'Setting model belum siap.' }, { status: 500 });
      }

      await settingDelegate.upsert({
        where: { key: 'active_ai_model' },
        update: { value: model },
        create: { key: 'active_ai_model', value: model },
      });

      if (userPayload?.userId) {
        await createAuditLog({
          userId: userPayload.userId,
          action: 'UPDATE_AI_MODEL',
          resource: 'SETTING',
          details: `Mengaktifkan AI model ${model.toUpperCase()}`,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Model AI berhasil diaktifkan ke ${model.toUpperCase()}`,
        activeModel: model,
      });
    }

    // ─── 3. UPDATE / RESET API KEY ────────────────────────────────────────────
    if (body.provider !== undefined) {
      const { provider, apiKey, reset } = body;
      const validProviders: ApiKeyProvider[] = ['gemini', 'openai', 'deepseek', 'nous'];
      if (!validProviders.includes(provider)) {
        return NextResponse.json({ success: false, error: 'Provider tidak valid.' }, { status: 400 });
      }

      if (!settingDelegate) {
        return NextResponse.json({ success: false, error: 'Setting model belum siap.' }, { status: 500 });
      }

      const dbKey = `ai_api_key_${provider}`;

      if (reset) {
        // Hapus override dari DB → kembali pakai .env
        await settingDelegate.deleteMany({ where: { key: dbKey } });

        if (userPayload?.userId) {
          await createAuditLog({
            userId: userPayload.userId,
            action: 'RESET_AI_API_KEY',
            resource: 'SETTING',
            details: `Reset API key ${provider.toUpperCase()} ke environment (.env)`,
          });
        }

        return NextResponse.json({
          success: true,
          message: `API key ${provider.toUpperCase()} berhasil dikembalikan ke environment variable.`,
        });
      }

      // Simpan/update API key ke DB
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
        return NextResponse.json(
          { success: false, error: 'API key tidak valid atau terlalu pendek (minimal 8 karakter).' },
          { status: 400 }
        );
      }

      // Opsional: Langsung coba tes API key baru
      const trimmedKey = apiKey.trim();
      const modelToTest: AIModel = provider === 'openai' ? 'gpt' : (provider as AIModel);
      const testCheck = await testModelConnection(modelToTest, trimmedKey);

      await settingDelegate.upsert({
        where: { key: dbKey },
        update: { value: trimmedKey },
        create: { key: dbKey, value: trimmedKey },
      });

      // Simpan catatan uji jika berhasil
      if (testCheck.success) {
        const testRecord = {
          lastTested: new Date().toISOString(),
          latencyMs: testCheck.latencyMs,
          status: 'ok',
        };
        try {
          await settingDelegate.upsert({
            where: { key: `ai_test_${modelToTest}` },
            update: { value: JSON.stringify(testRecord) },
            create: { key: `ai_test_${modelToTest}`, value: JSON.stringify(testRecord) },
          });
        } catch (dbErr) {
          console.warn('[AI Settings] Could not save test record on key update:', dbErr);
        }
      }

      if (userPayload?.userId) {
        await createAuditLog({
          userId: userPayload.userId,
          action: 'UPDATE_AI_API_KEY',
          resource: 'SETTING',
          details: `Memperbarui API key ${provider.toUpperCase()} (${trimmedKey.slice(0, 8)}••••)`,
        });
      }

      return NextResponse.json({
        success: true,
        message: testCheck.success
          ? `API key ${provider.toUpperCase()} berhasil disimpan dan teruji aktif (${testCheck.latencyMs} ms)!`
          : `API key ${provider.toUpperCase()} berhasil disimpan ke database. Catatan: tes koneksi mengembalikan (${testCheck.error}).`,
        testResult: testCheck,
      });
    }

    return NextResponse.json({ success: false, error: 'Request tidak valid.' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Setting AI POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal memproses konfigurasi AI.' },
      { status: 500 }
    );
  }
}
