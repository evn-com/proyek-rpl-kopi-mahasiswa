import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, blockIfOwnerWrite } from '@/lib/security';
import { createAuditLog } from '@/lib/auth';
import { globalEventBus } from '@/lib/events';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: { toppings: true },
        },
        payment: true,
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order detail:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail pesanan' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Cashier', 'Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { id } = params;
    const body = await req.json();
    const { tableNumber, notes, customerName } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (existingOrder.status === 'COMPLETED' || existingOrder.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Pesanan yang sudah selesai atau dibatalkan tidak dapat diubah.' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        tableNumber: tableNumber ? String(tableNumber).trim() : existingOrder.tableNumber,
        notes: notes !== undefined ? String(notes).trim() : existingOrder.notes,
        customerName: customerName ? String(customerName).trim() : existingOrder.customerName,
      },
      include: { items: true, payment: true },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: existingOrder.status,
        notes: `Pesanan diubah oleh ${auth.user.name}: Meja=${updated.tableNumber}, Catatan=${updated.notes || '-'}`,
        updatedById: auth.user.userId,
      },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'MODIFY_ORDER',
      resource: 'ORDER',
      details: `Modified order ${existingOrder.orderNumber}: Table=${updated.tableNumber}, Notes=${updated.notes}`,
    });

    globalEventBus.emit('ORDER_UPDATED', { orderId: id, orderNumber: existingOrder.orderNumber });

    return NextResponse.json({
      message: 'Pesanan berhasil diubah',
      order: updated,
    });
  } catch (error) {
    console.error('Error modifying order:', error);
    return NextResponse.json({ error: 'Gagal mengubah pesanan' }, { status: 500 });
  }
}
