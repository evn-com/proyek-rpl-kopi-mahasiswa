import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { updateHandoverStatus } from '@/lib/whatsapp/handoverService';
import { createAuditLog } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/whatsapp/handover
 * Mengubah status percakapan antara BOT_ACTIVE dan HUMAN_ACTIVE.
 * Otorisasi: Wajib role Admin.
 */
export async function POST(req: Request) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { phone, status } = body; // status: 'BOT_ACTIVE' | 'HUMAN_ACTIVE'

    if (!phone || (status !== 'BOT_ACTIVE' && status !== 'HUMAN_ACTIVE')) {
      return NextResponse.json(
        { error: 'Nomor telepon dan status (BOT_ACTIVE / HUMAN_ACTIVE) wajib diisi.' },
        { status: 400 }
      );
    }

    const staffName = auth.user.name || 'Admin';
    const updated = updateHandoverStatus(phone, status, staffName);

    await createAuditLog({
      userId: auth.user.userId,
      action: status === 'HUMAN_ACTIVE' ? 'WHATSAPP_HANDOVER_TO_HUMAN' : 'WHATSAPP_HANDOVER_TO_BOT',
      resource: 'WHATSAPP_CHAT',
      details: `${staffName} mengubah status percakapan WhatsApp ${phone} menjadi ${status}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Status percakapan berhasil diubah menjadi ${status}.`,
      conversation: updated,
    });
  } catch (error: any) {
    console.error('Error updating whatsapp handover status:', error);
    return NextResponse.json(
      { error: 'Gagal mengubah status handover: ' + error?.message },
      { status: 500 }
    );
  }
}
