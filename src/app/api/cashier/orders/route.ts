import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { notifyPaymentSuccessWA } from '@/lib/whatsapp/fonnteClient';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Cashier' && userPayload.role !== 'Admin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const whereClause: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: { toppings: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching cashier orders:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pesanan.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Cashier' && userPayload.role !== 'Admin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { orderId, action, notes } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json({ error: 'orderId dan action wajib diisi.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    let newStatus = order.status;
    let paymentStatus = order.paymentStatus;

    if (action === 'CONFIRM_AND_PAY') {
      newStatus = 'CONFIRMED';
      paymentStatus = 'PAID';
    } else if (action === 'CANCEL') {
      newStatus = 'CANCELLED';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        paymentStatus,
        history: {
          create: {
            status: newStatus,
            notes: notes || (action === 'CONFIRM_AND_PAY' ? 'Pembayaran dikonfirmasi oleh Kasir.' : 'Pesanan dibatalkan.'),
            updatedById: userPayload.userId,
          },
        },
        payment: {
          update: {
            status: paymentStatus === 'PAID' ? 'SUCCESS' : 'FAILED',
            paidAt: paymentStatus === 'PAID' ? new Date() : null,
          },
        },
      },
      include: { items: true },
    });

    await createAuditLog({
      userId: userPayload.userId,
      action: `CASHIER_${action}`,
      resource: 'ORDER',
      details: `Cashier ${userPayload.name} updated Order ${order.orderNumber} to status ${newStatus}`,
    });

    // Kirim notifikasi WhatsApp jika pembayaran dikonfirmasi kasir
    if (action === 'CONFIRM_AND_PAY' && order.customerPhone) {
      notifyPaymentSuccessWA({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        finalAmount: order.finalAmount,
      }).catch((err) => console.error('[WhatsApp Notification] Gagal mengirim notif konfirmasi bayar kasir:', err));
    }

    return NextResponse.json({ message: 'Status pesanan berhasil diperbarui.', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order by cashier:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memperbarui pesanan.' }, { status: 500 });
  }
}
