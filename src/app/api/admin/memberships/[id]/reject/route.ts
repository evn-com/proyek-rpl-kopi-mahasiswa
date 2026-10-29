import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/memberships/[id]/reject
 * Menolak pendaftaran membership mahasiswa dengan alasan penolakan.
 * Otorisasi: Wajib role Admin.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;

  try {
    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Data pendaftaran membership tidak ditemukan.' }, { status: 404 });
    }

    const rejectionReason = reason?.trim() || 'Data identitas mahasiswa tidak sesuai atau belum lengkap.';

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason,
      },
      include: { user: true },
    });

    // PENTING: Pendaftaran yang ditolak TIDAK BOLEH menerima notifikasi persetujuan!

    await createAuditLog({
      userId: auth.user.userId,
      action: 'REJECT_MEMBERSHIP',
      resource: 'MEMBERSHIP',
      details: `Admin menolak membership user: ${updated.user.name} (${updated.user.phone}) - Alasan: ${rejectionReason}`,
    });

    return NextResponse.json({
      success: true,
      message: `Pendaftaran membership ${updated.user.name} telah ditolak.`,
      membership: updated,
    });
  } catch (error: any) {
    console.error('Error rejecting membership:', error);
    return NextResponse.json(
      { error: 'Gagal memproses penolakan membership', details: error?.message },
      { status: 500 }
    );
  }
}
