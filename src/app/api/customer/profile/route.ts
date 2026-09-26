import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hashPassword, comparePassword, createAuditLog } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      include: {
        profile: true,
        branch: { select: { id: true, name: true, code: true } },
        _count: {
          select: {
            orders: true,
            favorites: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Calculate total spend
    const completedOrders = await prisma.order.findMany({
      where: {
        customerId: user.id,
        paymentStatus: 'PAID',
      },
      select: { finalAmount: true },
    });

    const totalSpent = completedOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userPayload.role,
        branch: user.branch,
        points: user.profile?.points || 0,
        birthDate: user.profile?.birthDate || null,
        totalOrders: user._count.orders,
        totalFavorites: user._count.favorites,
        totalReviews: user._count.reviews,
        totalSpent,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Gagal memuat profil' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, birthDate, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = sanitizeInput(name);
    if (phone !== undefined) updateData.phone = sanitizeInput(phone);

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password saat ini wajib diisi untuk mengubah password.' }, { status: 400 });
      }

      const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Password saat ini tidak cocok.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 });
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userPayload.userId },
      data: updateData,
    });

    // Update customer profile birthDate if provided
    if (birthDate !== undefined) {
      await prisma.customerProfile.upsert({
        where: { userId: userPayload.userId },
        create: {
          userId: userPayload.userId,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
        update: {
          birthDate: birthDate ? new Date(birthDate) : null,
        },
      });
    }

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_PROFILE',
      resource: 'USER',
      details: `User ${user.email} updated their profile info.`,
    });

    return NextResponse.json({
      message: 'Profil berhasil diperbarui!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Gagal memperbarui profil' }, { status: 500 });
  }
}
