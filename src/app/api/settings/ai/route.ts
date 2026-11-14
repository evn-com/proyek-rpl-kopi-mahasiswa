import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const VALID_MODELS = ['gemini', 'grok'] as const;
type AIModel = (typeof VALID_MODELS)[number];

type ApiKeyProvider = 'gemini' | 'grok';

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
      const candidateModels = [
        process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3.8-flash',
      ];

      let lastErr: any = null;
      for (const mId of candidateModels) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout 8s')), 8000)
          );

          const testCall = (async () => {
            const chat = client.chats.create({
              model: mId,
              config: { maxOutputTokens: 5, temperature: 0.1 },
            });
            await chat.sendMessage({ message: 'ping' });
          })();

          await Promise.race([testCall, timeoutPromise]);
          return { success: true, latencyMs: Date.now() - start };
        } catch (err: any) {
          lastErr = err;
          console.warn(`[Gemini Test] Model ${mId} failed, mencoba model berikutnya:`, err?.message);
        }
      }

      const errMsg = lastErr?.message || '';
      if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
        throw new Error('Server Google Gemini sedang sibuk (503 High Demand). Silakan coba beberapa saat lagi.');
      }
      throw lastErr || new Error('Gagal menghubungi model Gemini.');
    }

    if (model === 'grok') {
      const dbKey = (await getApiKeyFromDb('grok')).value;
      const apiKey = customKey || dbKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
      if (!apiKey) throw new Error('API Key xAI Grok belum diatur.');

      const candidateModels = [
        process.env.GROK_MODEL || 'grok-2-latest',
        'grok-2',
        'grok-beta',
      ];

      let lastErr: any = null;
      for (const mId of candidateModels) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout 8s')), 8000)
          );

          const testCall = (async () => {
            const res = await fetch('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: mId,
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 5,
              }),
            });
            if (!res.ok) {
              const err = await res.text();
              throw new Error(`xAI Grok HTTP ${res.status}: ${err.slice(0, 100)}`);
            }
          })();

          await Promise.race([testCall, timeoutPromise]);
          return { success: true, latencyMs: Date.now() - start };
        } catch (err: any) {
          lastErr = err;
          console.warn(`[Grok Test] Model ${mId} failed:`, err?.message);
        }
      }
      throw lastErr || new Error('Gagal menghubungi model xAI Grok.');
    }

    throw new Error('Model tidak didukung untuk tes.');
  } catch (err: any) {
    return { success: false, latencyMs: Date.now() - start, error: err.message || 'Koneksi gagal.' };
  }
}

/**
 * GET /api/settings/ai
 * Mengambil model AI aktif, status API key provider (Gemini & Grok), dan hasil tes terkini.
 */
export async function GET(req: Request) {
  try {
    const settingDelegate = (prisma as any).setting;
    let activeModel = 'gemini';

    if (settingDelegate) {
      const setting = await settingDelegate.findUnique({
        where: { key: 'active_ai_model' },
      });
      if (setting?.value && VALID_MODELS.includes(setting.value as AIModel)) {
        activeModel = setting.value;
      }
    }

    // Ambil API key dari DB (override) atau env
    const [dbGemini, dbGrok] = await Promise.all([
      getApiKeyFromDb('gemini'),
      getApiKeyFromDb('grok'),
    ]);

    const geminiKey = dbGemini.value || process.env.GEMINI_API_KEY || '';
    const grokKey = dbGrok.value || process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';

    // Ambil riwayat tes latency
    const [testGemini, testGrok] = await Promise.all([
      getModelTestResult('gemini'),
      getModelTestResult('grok'),
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
        grok: {
          provider: 'grok',
          label: 'xAI Grok',
          isConfigured: !!grokKey,
          maskedKey: maskApiKey(grokKey),
          rawKey: grokKey || '',
          source: dbGrok.value ? 'database' : ((process.env.GROK_API_KEY || process.env.XAI_API_KEY) ? 'environment' : 'none'),
          updatedAt: dbGrok.updatedAt || ((process.env.GROK_API_KEY || process.env.XAI_API_KEY) ? 'Environment (.env)' : null),
        },
      },
      availableModels: [
        {
          id: 'gemini',
          name: 'Google Gemini',
          subName: 'Gemini Flash Lite (3.5)',
          modelId: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
          providerKey: 'gemini',
          contextWindow: '1.000.000 token',
          tag: 'Rekomendasi Utama',
          description: 'Model cepat Google Gemini Flash Lite — hemat kuota, latensi rendah, cocok untuk produksi.',
          isConfigured: !!geminiKey,
          lastTested: testGemini.lastTested,
          latencyMs: testGemini.latencyMs,
          testStatus: testGemini.status,
        },
        {
          id: 'grok',
          name: 'xAI Grok',
          subName: 'Grok 2 / Grok Beta',
          modelId: process.env.GROK_MODEL || 'grok-2-latest',
          providerKey: 'grok',
          contextWindow: '131.072 token',
          tag: 'xAI Real-time',
          description: 'Model cerdas dari xAI dengan penalaran cepat, gaya responsif, dan pemahaman percakapan mutakhir.',
          isConfigured: !!grokKey,
          lastTested: testGrok.lastTested,
          latencyMs: testGrok.latencyMs,
          testStatus: testGrok.status,
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
 * 1. Aktivasi Model: { model: 'gemini' | 'grok' }
 * 2. Simpan API Key: { provider: 'gemini' | 'grok', apiKey: '...' }
 * 3. Reset API Key: { provider: 'gemini' | 'grok', reset: true }
 * 4. Uji Model: { action: 'test_model', model: 'gemini' | 'grok' }
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
        return NextResponse.json({ success: false, error: 'Model tidak valid untuk diuji. Pilihan: gemini, grok.' }, { status: 400 });
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
      const validProviders: ApiKeyProvider[] = ['gemini', 'grok'];
      if (!validProviders.includes(provider)) {
        return NextResponse.json({ success: false, error: 'Provider tidak valid. Pilihan: gemini, grok.' }, { status: 400 });
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

      const trimmedKey = apiKey.trim();
      const modelToTest: AIModel = provider as AIModel;
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
          : `API key ${provider.toUpperCase()} berhasil disimpan ke database. Catatan tes: (${testCheck.error}).`,
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
