import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { deductStockForOrder } from '@/lib/inventory';
import { globalEventBus } from '@/lib/events';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userPayload = getUserFromRequest(req);
    const { id } = params;
    const { status, notes } = await req.json();

    const ownerBlock = (await import('@/lib/security')).blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const allowedStatuses = ['WAITING', 'ACCEPTED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Status "${status}" tidak valid.` }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { history: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const oldStatus = order.status;

    // Prevent non-cashier/admin from confirming WAITING orders
    if (oldStatus === 'WAITING' && status === 'ACCEPTED') {
      if (!userPayload || !['Cashier', 'Admin'].includes(userPayload.role)) {
        return NextResponse.json({ error: 'Hanya Kasir atau Admin yang dapat mengonfirmasi pesanan.' }, { status: 403 });
      }
    }

    // Customer cannot modify order once accepted
    if (userPayload?.role === 'Customer' && ['ACCEPTED', 'PROCESSING', 'READY', 'COMPLETED'].includes(oldStatus)) {
      return NextResponse.json({ error: 'Pesanan yang sudah diproses tidak dapat diubah oleh pelanggan.' }, { status: 403 });
    }

    // Check if stock deduction should happen when transitioning to ACCEPTED or COMPLETED
    const alreadyDeducted = order.history.some((h) => h.notes && h.notes.includes('stok berkurang'));

    if ((status === 'ACCEPTED' || status === 'COMPLETED') && !alreadyDeducted) {
      const deductionRes = await deductStockForOrder(order.id, userPayload?.userId);
      if (!deductionRes.success) {
        return NextResponse.json({ error: deductionRes.message }, { status: 400 });
      }
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Create Order Status History
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status,
        notes: notes || `Status diubah dari ${oldStatus} menjadi ${status} oleh ${userPayload?.name || 'Sistem'}.` + (status === 'ACCEPTED' ? ' (stok berkurang berdasarkan resep)' : ''),
        updatedById: userPayload?.userId || null,
      },
    });

    // Emit Real-Time Role & Customer Notifications
    if (status === 'ACCEPTED') {
      await globalEventBus.notify({
        targetRole: 'Barista',
        title: `Pesanan Baru Siap Diracik (${order.orderNumber})`,
        message: `Pesanan untuk ${order.tableNumber} telah dikonfirmasi dan menunggu diracik.`,
        type: 'ORDER',
        link: '/barista',
      });
      if (order.customerId) {
        await globalEventBus.notify({
          userId: order.customerId,
          targetRole: 'Customer',
          title: `Pesanan Dikonfirmasi (${order.orderNumber})`,
          message: `Kasir telah mengonfirmasi pesanan Anda. Barista siap meracik!`,
          type: 'ORDER',
          link: `/order-status?id=${order.id}`,
        });
      }
    } else if (status === 'PROCESSING') {
      if (order.customerId) {
        await globalEventBus.notify({
          userId: order.customerId,
          targetRole: 'Customer',
          title: `Kopi Sedang Diracik ☕ (${order.orderNumber})`,
          message: `Barista sedang menyiapkan pesanan nikmat Anda.`,
          type: 'ORDER',
          link: `/order-status?id=${order.id}`,
        });
      }
    } else if (status === 'READY') {
      await globalEventBus.notify({
        targetRole: 'Cashier',
        title: `Pesanan Siap Disajikan (${order.orderNumber})`,
        message: `Pesanan ${order.tableNumber} (${order.customerName}) sudah siap!`,
        type: 'ORDER',
        link: '/cashier',
      });
      if (order.customerId) {
        await globalEventBus.notify({
          userId: order.customerId,
          targetRole: 'Customer',
          title: `🎉 Pesanan Siap! (${order.orderNumber})`,
          message: `Pesanan Anda sudah siap disajikan di ${order.tableNumber} atau diambil di konter!`,
          type: 'ORDER',
          link: `/order-status?id=${order.id}`,
        });
      }
    } else if (status === 'COMPLETED') {
      if (order.customerId) {
        await globalEventBus.notify({
          userId: order.customerId,
          targetRole: 'Customer',
          title: `Pesanan Selesai (${order.orderNumber})`,
          message: `Terima kasih telah berkunjung ke Kopi Mahasiswa! Jangan lupa berikan rating & review ya!`,
          type: 'ORDER',
          link: `/profile`,
        });
      }
    }

    await createAuditLog({
      userId: userPayload?.userId,
      action: 'ORDER_STATUS_UPDATE',
      resource: 'ORDER',
      details: `Order ${order.orderNumber} status changed: ${oldStatus} -> ${status}`,
    });

    // Broadcast SSE realtime update
    globalEventBus.emit('ORDER_STATUS_CHANGED', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      oldStatus,
      newStatus: status,
    });

    return NextResponse.json({
      message: `Status pesanan berhasil diperbarui menjadi ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status pesanan' }, { status: 500 });
  }
}
