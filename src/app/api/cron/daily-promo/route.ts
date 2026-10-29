import { NextResponse } from 'next/server';
import { runDailyPromoBroadcast } from '@/lib/whatsapp/dailyPromoService';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Endpoint Cron & Trigger Pengiriman Promo Harian
 * Dapat dipicu secara otomatis oleh scheduler (cron job harian)
 * atau secara manual oleh Admin melalui dashboard.
 */
export async function GET(req: Request) {
  return handleBroadcast(req);
}

export async function POST(req: Request) {
  return handleBroadcast(req);
}

async function handleBroadcast(req: Request) {
  try {
    // Validasi otorisasi: bisa melalui sesi Admin atau Header Authorization CRON_SECRET
    const user = getUserFromRequest(req);
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'kopi-mahasiswa-cron-secret-2026';

    const isAuthorizedAdmin = user?.role === 'Admin';
    const isAuthorizedCron = authHeader === `Bearer ${cronSecret}`;

    // Catatan: Jika diakses langsung dalam konteks internal development, kita izinkan jika admin atau tanpa parameter khusus
    if (!isAuthorizedAdmin && !isAuthorizedCron) {
      // Periksa apakah query params menyertakan secret
      const url = new URL(req.url);
      const querySecret = url.searchParams.get('secret');
      if (querySecret !== cronSecret && process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Akses ditolak. Memerlukan autentikasi Admin atau Secret Cron.' },
          { status: 403 }
        );
      }
    }

    const broadcastResult = await runDailyPromoBroadcast();

    return NextResponse.json({
      success: broadcastResult.success,
      message: broadcastResult.reason || `Promo harian diproses: ${broadcastResult.sentCount} terkirim, ${broadcastResult.skippedCount} dilewati, ${broadcastResult.failedCount} gagal.`,
      result: broadcastResult,
    });
  } catch (error: any) {
    console.error('[Cron Daily Promo] Error:', error);
    return NextResponse.json(
      { error: 'Gagal menjalankan broadcast promo harian', details: error?.message },
      { status: 500 }
    );
  }
}
