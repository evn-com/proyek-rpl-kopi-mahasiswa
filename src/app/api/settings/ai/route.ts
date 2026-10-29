import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VALID_MODELS = ['gemini', 'gpt', 'deepseek'] as const;
type AIModel = (typeof VALID_MODELS)[number];

/**
 * GET /api/settings/ai
 * Mengambil model AI yang sedang aktif untuk Barista Assistant.
 */
export async function GET(req: Request) {
  try {
    const settingDelegate = (prisma as any).setting;
    let activeModel = 'gemini';

    if (settingDelegate) {
      const setting = await settingDelegate.findUnique({
        where: { key: 'active_ai_model' },
      });
      if (setting && setting.value) {
        activeModel = setting.value;
      }
    }

    return NextResponse.json({
      success: true,
      activeModel,
      availableModels: [
        {
          id: 'gemini',
          name: 'Google Gemini',
          subName: 'Gemini 2.5 Flash',
          tag: 'Rekomendasi Utama',
          description:
            'Model AI ultra-cepat dengan pemrosesan streaming instan, penalaran konteks menu akurat, dan integrasi native Google GenAI SDK.',
          isConfigured: !!process.env.GEMINI_API_KEY,
        },
        {
          id: 'gpt',
          name: 'OpenAI GPT',
          subName: 'GPT-4o / GPT-3.5',
          tag: 'High Reasoning',
          description:
            'Model percakapan cerdas dengan gaya bahasa natural, keahlian analisis mendalam, dan gateway OpenAI API.',
          isConfigured: !!process.env.OPENAI_API_KEY || !!process.env.NOUS_API_KEY,
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          subName: 'DeepSeek V3 / R1',
          tag: 'Cost Efficient & Open Weights',
          description:
            'Arsitektur penalaran logika tinggi dengan efisiensi komputasi modern untuk konsultasi kopi dan rekomendasi hemat.',
          isConfigured: !!process.env.DEEPSEEK_API_KEY || !!process.env.NOUS_API_KEY,
        },
      ],
    });
  } catch (err: any) {
    console.error('[API Setting AI GET] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memuat pengaturan model AI.',
        activeModel: 'gemini',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/ai
 * Memperbarui model AI aktif pilihan admin (gemini, gpt, deepseek).
 */
export async function POST(req: Request) {
  try {
    // Verifikasi hak akses: hanya Admin dan Owner yang dapat mengubah konfigurasi AI
    const userPayload = getUserFromRequest(req);
    const userRole = userPayload?.role?.toLowerCase();
    if (!userPayload || (userRole !== 'admin' && userRole !== 'owner')) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Hanya Admin/Owner yang dapat mengubah konfigurasi AI.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { model } = body;

    if (!model || !VALID_MODELS.includes(model as AIModel)) {
      return NextResponse.json(
        {
          success: false,
          error: `Model AI tidak valid. Pilihan yang tersedia: ${VALID_MODELS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const settingDelegate = (prisma as any).setting;
    if (!settingDelegate) {
      return NextResponse.json(
        { success: false, error: 'Model Setting belum siap di Prisma Client.' },
        { status: 500 }
      );
    }

    const updated = await settingDelegate.upsert({
      where: { key: 'active_ai_model' },
      update: { value: model },
      create: { key: 'active_ai_model', value: model },
    });

    if (userPayload?.userId) {
      await createAuditLog({
        userId: userPayload.userId,
        action: 'UPDATE_AI_MODEL',
        resource: 'SETTING',
        details: `Mengubah active AI model menjadi ${model}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Model AI Barista berhasil diubah ke ${model.toUpperCase()}`,
      activeModel: updated.value,
    });
  } catch (err: any) {
    console.error('[API Setting AI POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Gagal menyimpan pengaturan model AI.' },
      { status: 500 }
    );
  }
}
