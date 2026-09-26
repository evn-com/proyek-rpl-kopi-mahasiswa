import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Barista' && userPayload.role !== 'Admin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Barista view: CONFIRMED, PREPARING, READY
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'READY'] },
      },
      include: {
        items: {
          include: { toppings: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching barista KDS orders:', error);
    return NextResponse.json({ error: 'Gagal mengambil data KDS barista.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Barista' && userPayload.role !== 'Admin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { orderId, targetStatus } = await req.json();

    if (!orderId || !['PREPARING', 'READY', 'COMPLETED'].includes(targetStatus)) {
      return NextResponse.json({ error: 'Target status tidak valid.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    let statusNote = 'Status diperbarui barista.';
    if (targetStatus === 'PREPARING') statusNote = 'Barista sedang meracik pesanan.';
    if (targetStatus === 'READY') statusNote = 'Pesanan sudah siap di konter / disajikan!';
    if (targetStatus === 'COMPLETED') statusNote = 'Pesanan telah diterima pelanggan.';

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: targetStatus,
        history: {
          create: {
            status: targetStatus,
            notes: statusNote,
            updatedById: userPayload.userId,
          },
        },
      },
      include: { items: true },
    });

    await createAuditLog({
      userId: userPayload.userId,
      action: `BARISTA_STATUS_${targetStatus}`,
      resource: 'ORDER',
      details: `Barista ${userPayload.name} updated Order ${order.orderNumber} to ${targetStatus}`,
    });

    return NextResponse.json({ message: 'Status barista berhasil diperbarui.', order: updatedOrder });
  } catch (error) {
    console.error('Error updating barista order status:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status barista.' }, { status: 500 });
  }
}
