import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: userPayload.userId },
          { targetRole: userPayload.role },
          { userId: null, targetRole: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Gagal memuat notifikasi' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, all } = body;

    if (all) {
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: userPayload.userId },
            { targetRole: userPayload.role },
          ],
          isRead: false,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'Semua notifikasi ditandai sudah dibaca' });
    }

    if (id) {
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return NextResponse.json({ message: 'Notifikasi ditandai dibaca', notification: updated });
    }

    return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status notifikasi' }, { status: 500 });
  }
}
