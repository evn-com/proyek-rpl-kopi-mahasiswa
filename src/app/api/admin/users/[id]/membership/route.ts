import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/users/[id]/membership
 * Menghapus data membership mahasiswa tanpa menghapus akun pengguna atau data historisnya.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) return auth.errorResponse;

  const { id } = params;

  try {
    const membership = await prisma.membership.findUnique({
      where: { userId: id },
      include: { user: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Pengguna ini tidak memiliki data membership aktif.' }, { status: 404 });
    }

    const userName = membership.user.name;

    // Hapus data membership saja
    await prisma.membership.delete({
      where: { id: membership.id },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'ADMIN_DELETE_MEMBERSHIP',
      resource: 'MEMBERSHIP',
      details: `Admin menghapus membership dari pengguna: ${userName} (${id}). Akun utama tetap aktif.`,
    });

    return NextResponse.json({
      success: true,
      message: `Membership untuk "${userName}" berhasil dihapus. Akun dan data transaksi tetap dipertahankan.`,
    });
  } catch (error: any) {
    console.error('Error deleting membership:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus membership: ' + error?.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]/membership
 * Menonaktifkan status membership menjadi INACTIVE tanpa menghapus rekaman.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) return auth.errorResponse;

  const { id } = params;

  try {
    const body = await req.json();
    const { status } = body; // 'INACTIVE', 'REJECTED', 'APPROVED'

    const membership = await prisma.membership.findUnique({
      where: { userId: id },
      include: { user: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Data membership tidak ditemukan.' }, { status: 404 });
    }

    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: status || 'INACTIVE',
      },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'ADMIN_UPDATE_MEMBERSHIP_STATUS',
      resource: 'MEMBERSHIP',
      details: `Admin mengubah status membership ${membership.user.name} menjadi ${updated.status}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Status membership berhasil diubah menjadi ${updated.status}.`,
      membership: updated,
    });
  } catch (error: any) {
    console.error('Error updating membership status:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui membership: ' + error?.message },
      { status: 500 }
    );
  }
}
