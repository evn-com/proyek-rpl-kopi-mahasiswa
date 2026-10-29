import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/memberships
 * Mengambil daftar pendaftaran membership mahasiswa dengan filter status & pencarian.
 * Otorisasi: Wajib role Admin.
 */
export async function GET(req: Request) {
  const auth = requireRole(req, ['Admin']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const url = new URL(req.url);
    const statusParam = url.searchParams.get('status') || 'ALL';
    const searchQuery = url.searchParams.get('search') || '';

    // Build filter
    const whereClause: any = {};

    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam;
    }

    if (searchQuery.trim()) {
      whereClause.OR = [
        { user: { name: { contains: searchQuery } } },
        { user: { phone: { contains: searchQuery } } },
        { user: { email: { contains: searchQuery } } },
        { campus: { contains: searchQuery } },
      ];
    }

    const [memberships, totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.membership.findMany({
        where: whereClause,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          approvedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.membership.count(),
      prisma.membership.count({ where: { status: 'PENDING' } }),
      prisma.membership.count({ where: { status: 'APPROVED' } }),
      prisma.membership.count({ where: { status: 'REJECTED' } }),
    ]);

    const formattedList = memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      phone: m.user.phone,
      email: m.user.email,
      campus: m.campus || '-',
      points: m.user.profile?.points || 0,
      status: m.status, // PENDING, APPROVED, REJECTED
      rejectionReason: m.rejectionReason,
      approvedAt: m.approvedAt,
      approvedByName: m.approvedBy?.name || null,
      rejectedAt: m.rejectedAt,
      whatsappConsent: m.whatsappConsent,
      promoConsent: m.promoConsent,
      whatsappNotificationStatus: m.whatsappNotificationStatus, // PENDING, SENT, FAILED, SKIPPED
      whatsappNotificationError: m.whatsappNotificationError,
      whatsappNotifiedAt: m.whatsappNotifiedAt,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      memberships: formattedList,
      counts: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin memberships:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data membership', details: error?.message },
      { status: 500 }
    );
  }
}
