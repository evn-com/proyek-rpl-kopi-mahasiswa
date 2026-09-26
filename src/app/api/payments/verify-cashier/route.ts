import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { globalEventBus } from '@/lib/events';

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || !['Cashier', 'Admin', 'Owner'].includes(userPayload.role)) {
      return NextResponse.json({ error: 'Hanya Kasir atau Admin yang dapat memverifikasi pembayaran.' }, { status: 403 });
    }

    const { orderId, receiptNumber } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'OrderId wajib diisi.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    // Update order payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
      },
    });

    // Update payment record
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          receiptNumber: receiptNumber || `RCP-${Date.now()}`,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: order.paymentMethod || 'PAY_AT_CASHIER',
          status: 'PAID',
          amount: order.finalAmount,
          paidAt: new Date(),
          receiptNumber: receiptNumber || `RCP-${Date.now()}`,
        },
      });
    }

    await createAuditLog({
      userId: userPayload.userId,
      action: 'VERIFY_PAYMENT',
      resource: 'PAYMENT',
      details: `Cashier ${userPayload.name} verified payment for Order ${order.orderNumber} (Rp ${order.finalAmount})`,
    });

    globalEventBus.emit('PAYMENT_UPDATED', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: 'PAID',
    });

    return NextResponse.json({
      message: 'Pembayaran kasir berhasil diverifikasi dan ditandai LUNAS (PAID).',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error verifying cashier payment:', error);
    return NextResponse.json({ error: 'Gagal memverifikasi pembayaran kasir' }, { status: 500 });
  }
}
