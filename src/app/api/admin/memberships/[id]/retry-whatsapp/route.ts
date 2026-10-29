import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { sendMembershipApprovedWA, formatPhoneNumber } from '@/lib/whatsapp/fonnteClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/memberships/[id]/retry-whatsapp
 * Mencoba kembali mengirimkan notifikasi WhatsApp persetujuan membership jika gagal.
 * Mencegah pengiriman ganda jika status sudah 'SENT'.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;

  try {
    const membership = await prisma.membership.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Data membership tidak ditemukan.' }, { status: 404 });
    }

    if (membership.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Notifikasi persetujuan hanya dapat dikirim untuk membership dengan status APPROVED.' },
        { status: 400 }
      );
    }

    // Cegah pengiriman duplikat jika sudah terkirim
    if (membership.whatsappNotificationStatus === 'SENT') {
      return NextResponse.json(
        { message: 'Notifikasi WhatsApp sudah berstatus TERKIRIM (SENT). Pengiriman duplikat dibatalkan.' },
        { status: 400 }
      );
    }

    if (!membership.whatsappConsent) {
      return NextResponse.json(
        { error: 'Pelanggan tidak memberikan persetujuan menerima pesan WhatsApp (Opt-out).' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(membership.user.phone || '');
    if (!formattedPhone || formattedPhone.length < 9) {
      return NextResponse.json({ error: 'Nomor telepon WhatsApp pelanggan tidak valid.' }, { status: 400 });
    }

    const sendResult = await sendMembershipApprovedWA(formattedPhone, membership.user.name);

    if (sendResult.success) {
      const updated = await prisma.membership.update({
        where: { id },
        data: {
          whatsappNotificationStatus: 'SENT',
          whatsappNotificationError: null,
          whatsappNotifiedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Notifikasi WhatsApp berhasil dikirim ulang!',
        membership: updated,
      });
    } else {
      const updated = await prisma.membership.update({
        where: { id },
        data: {
          whatsappNotificationStatus: 'FAILED',
          whatsappNotificationError: sendResult.error || 'Gagal mengirim pesan via WhatsApp',
        },
      });

      return NextResponse.json({
        success: false,
        error: sendResult.error || 'Gagal mengirim WhatsApp',
        membership: updated,
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Error retrying whatsapp notification:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mencoba mengirim ulang WhatsApp', details: error?.message },
      { status: 500 }
    );
  }
}
