import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { globalEventBus } from '@/lib/events';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userPayload = getUserFromRequest(req);
    const ownerBlock = (await import('@/lib/security')).blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const { id } = params;
    const { reason } = await req.json();

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Alasan pembatalan (cancellation reason) wajib diisi.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (order.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Pesanan yang sudah selesai tidak dapat dibatalkan.' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason.trim(),
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'CANCELLED',
        notes: `Pesanan dibatalkan oleh ${userPayload?.name || 'Kasir/Admin'}. Alasan: ${reason.trim()}`,
        updatedById: userPayload?.userId || null,
      },
    });

    // Free table if linked
    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    await createAuditLog({
      userId: userPayload?.userId,
      action: 'CANCEL_ORDER',
      resource: 'ORDER',
      details: `Order ${order.orderNumber} cancelled. Reason: ${reason.trim()}`,
    });

    globalEventBus.emit('ORDER_CANCELLED', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason: reason.trim(),
    });

    return NextResponse.json({
      message: 'Pesanan berhasil dibatalkan.',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: 'Gagal membatalkan pesanan' }, { status: 500 });
  }
}
