import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Mengambil daftar pengguna dengan filter role, status membership, dan pencarian.
 * Otorisasi: Wajib role Admin.
 */
export async function GET(req: Request) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.trim() || '';
    const role = url.searchParams.get('role')?.trim() || '';
    const membershipStatus = url.searchParams.get('membershipStatus')?.trim() || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '15', 10)));

    const where: any = {};

    if (role) {
      where.role = { name: role };
    }

    if (membershipStatus) {
      if (membershipStatus === 'NONE') {
        where.membership = null;
      } else {
        where.membership = { status: membershipStatus };
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { membership: { campus: { contains: search } } },
      ];
    }

    // Role counts for tab badges / summary
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { users: true },
        },
      },
    });

    const roleCounts: Record<string, number> = {};
    for (const r of roles) {
      roleCounts[r.name] = r._count.users;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isGuest: true,
          passwordHash: true,
          createdAt: true,
          role: { select: { name: true } },
          profile: { select: { points: true } },
          membership: { select: { status: true, campus: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const mappedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role?.name || 'Customer',
      isGuest: u.isGuest,
      isActive: !u.passwordHash.startsWith('DISABLED:'),
      membershipStatus: u.membership?.status || null,
      campus: u.membership?.campus || null,
      points: u.profile?.points || 0,
      createdAt: u.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      users: mappedUsers,
      total,
      totalPages,
      page,
      roleCounts,
    });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data pengguna: ' + (error?.message || 'Server error') },
      { status: 500 }
    );
  }
}
