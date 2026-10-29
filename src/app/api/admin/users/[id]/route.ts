import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id]
 * Mengambil detail lengkap pengguna beserta pesanan, membership, dan profil.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) return auth.errorResponse;

  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        roleId: true,
        passwordHash: true,
        isGuest: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, name: true } },
        profile: true,
        membership: {
          select: {
            id: true,
            status: true,
            campus: true,
            whatsappConsent: true,
            promoConsent: true,
            whatsappNotificationStatus: true,
            createdAt: true,
            approvedAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const isActive = !user.passwordHash.startsWith('DISABLED:');

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        role: user.role?.name || 'Customer',
        isGuest: user.isGuest,
        isActive,
        points: user.profile?.points || 0,
        birthDate: user.profile?.birthDate || null,
        membership: user.membership,
        ordersCount: user._count.orders,
        reviewsCount: user._count.reviews,
        favoritesCount: user._count.favorites,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting user detail:', error);
    return NextResponse.json({ error: 'Gagal memuat detail pengguna' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Mengedit profil, kontak, role, points, atau status aktif pengguna.
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
    const { name, phone, email, roleName, points, isActive, campus } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true, profile: true, membership: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Role check
    let targetRoleId = existingUser.roleId;
    if (roleName && roleName !== existingUser.role.name) {
      const foundRole = await prisma.role.findUnique({ where: { name: roleName } });
      if (!foundRole) {
        return NextResponse.json({ error: `Role "${roleName}" tidak valid` }, { status: 400 });
      }
      targetRoleId = foundRole.id;
    }

    // Email check (staff must have valid non-virtual email)
    let updatedEmail = existingUser.email;
    if (email && email.trim() !== '') {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== existingUser.email) {
        // Cek duplikasi email
        const dup = await prisma.user.findFirst({
          where: { email: cleanEmail, NOT: { id } },
        });
        if (dup) {
          return NextResponse.json({ error: 'Email sudah digunakan oleh pengguna lain' }, { status: 400 });
        }
        updatedEmail = cleanEmail;
      }
    }

    // Deactivation / Activation logic
    let updatedPasswordHash = existingUser.passwordHash;
    if (isActive !== undefined) {
      const isCurrentlyDisabled = existingUser.passwordHash.startsWith('DISABLED:');
      if (!isActive && !isCurrentlyDisabled) {
        // Nonaktifkan akun
        updatedPasswordHash = `DISABLED:${existingUser.passwordHash}`;
      } else if (isActive && isCurrentlyDisabled) {
        // Aktifkan kembali akun
        updatedPasswordHash = existingUser.passwordHash.replace('DISABLED:', '');
      }
    }

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingUser.name,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : existingUser.phone,
        email: updatedEmail,
        roleId: targetRoleId,
        passwordHash: updatedPasswordHash,
      },
      include: { role: true, profile: true, membership: true },
    });

    // Update Profile Points jika diberikan
    if (points !== undefined) {
      const pointsNum = Math.max(0, parseInt(points, 10) || 0);
      if (existingUser.profile) {
        await prisma.customerProfile.update({
          where: { id: existingUser.profile.id },
          data: { points: pointsNum },
        });
      } else {
        await prisma.customerProfile.create({
          data: {
            userId: id,
            points: pointsNum,
          },
        });
      }
    }

    // Update Campus di membership jika ada
    if (campus !== undefined && existingUser.membership) {
      await prisma.membership.update({
        where: { id: existingUser.membership.id },
        data: { campus: campus.trim() || null },
      });
    }

    await createAuditLog({
      userId: auth.user.userId,
      action: 'ADMIN_UPDATE_USER',
      resource: 'USER',
      details: `Admin memperbarui data pengguna: ${updatedUser.name} (${updatedUser.email || updatedUser.phone})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role.name,
        isActive: !updatedUser.passwordHash.startsWith('DISABLED:'),
      },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data pengguna: ' + error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Penghapusan permanen akun hanya dilakukan jika aman dan sesuai kebijakan retensi.
 * Jika pengguna memiliki riwayat pesanan/transaksi, penghapusan ditolak untuk menjaga integritas data akuntansi.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) return auth.errorResponse;

  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            inventoryTransactions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Kebijakan Retensi: Pengguna dengan pesanan / transaksi finansial tidak boleh dihapus secara permanen
    if (user._count.orders > 0 || user._count.inventoryTransactions > 0) {
      return NextResponse.json(
        {
          error: `Pengguna tidak dapat dihapus permanen karena memiliki riwayat ${user._count.orders} pesanan. Silakan gunakan fitur "Nonaktifkan Akun" agar integritas data transaksi dan laporan keuangan tetap terjaga.`,
          retentionBlocked: true,
          ordersCount: user._count.orders,
        },
        { status: 400 }
      );
    }

    // Jika tidak ada pesanan finansial, hapus profil & membership terlebih dahulu jika ada, lalu hapus user
    await prisma.$transaction(async (tx) => {
      await tx.customerProfile.deleteMany({ where: { userId: id } });
      await tx.membership.deleteMany({ where: { userId: id } });
      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.review.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'ADMIN_DELETE_USER',
      resource: 'USER',
      details: `Admin menghapus permanen pengguna tanpa transaksi: ${user.name} (${user.email})`,
    });

    return NextResponse.json({
      success: true,
      message: `Akun "${user.name}" berhasil dihapus permanen sesuai kebijakan retensi.`,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus pengguna: ' + error?.message },
      { status: 500 }
    );
  }
}
