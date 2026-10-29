import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { sendWhatsAppMessage, formatPhoneNumber } from '@/lib/whatsapp/fonnteClient';
import { recordStaffMessage } from '@/lib/whatsapp/handoverService';
import { createAuditLog } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/whatsapp/send
 * Mengirim pesan WhatsApp manual dari staf langsung ke pelanggan via Fonnte API.
 * Otorisasi: Wajib role Admin.
 */
export async function POST(req: Request) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message || message.trim() === '') {
      return NextResponse.json({ error: 'Nomor telepon tujuan dan isi pesan wajib diisi.' }, { status: 400 });
    }

    const cleanPhone = formatPhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      return NextResponse.json({ error: 'Nomor telepon tujuan tidak valid.' }, { status: 400 });
    }

    const staffName = auth.user.name || 'Admin';

    // Kirim via Fonnte API
    const sendResult = await sendWhatsAppMessage(cleanPhone, message.trim());

    if (!sendResult.success) {
      return NextResponse.json(
        { error: 'Gagal mengirim pesan via WhatsApp Gateway: ' + (sendResult.error || 'Unknown error') },
        { status: 502 }
      );
    }

    // Catat pesan staf di Handover Inbox
    recordStaffMessage(cleanPhone, message.trim(), staffName);

    await createAuditLog({
      userId: auth.user.userId,
      action: 'ADMIN_SEND_WHATSAPP_MESSAGE',
      resource: 'WHATSAPP_CHAT',
      details: `${staffName} mengirim pesan WhatsApp ke ${cleanPhone}: "${message.trim().slice(0, 50)}..."`,
    });

    return NextResponse.json({
      success: true,
      message: 'Pesan WhatsApp berhasil dikirim ke pelanggan.',
      data: sendResult.data,
    });
  } catch (error: any) {
    console.error('Error sending staff whatsapp message:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim pesan: ' + error?.message },
      { status: 500 }
    );
  }
}
