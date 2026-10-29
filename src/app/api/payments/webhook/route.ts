import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultPaymentGateway, MockPaymentGateway } from '@/lib/payment/MockPaymentGateway';
import { createAuditLog } from '@/lib/auth';
import { globalEventBus } from '@/lib/events';
import { notifyPaymentSuccessWA } from '@/lib/whatsapp/fonnteClient';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { paymentReference, orderNumber, status, amount, signature, timestamp, idempotencyKey } = payload;

    // 1. Signature & Payload Verification
    const gateway = defaultPaymentGateway as MockPaymentGateway;
    const verification = gateway.verifyWebhook({
      paymentReference,
      orderNumber,
      status,
      amount,
      signature,
      timestamp,
      idempotencyKey,
    });

    if (!verification.isValid) {
      console.warn('Webhook Signature Verification Failed:', verification.reason);
      return NextResponse.json({ error: 'Signature verification failed', reason: verification.reason }, { status: 400 });
    }

    // 2. Idempotency Check: Prevent duplicate payment processing
    const existingPayment = await prisma.payment.findFirst({
      where: {
        OR: [{ paymentReference }, { idempotencyKey }],
      },
      include: { order: true },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment reference tidak ditemukan.' }, { status: 404 });
    }

    if (existingPayment.status === 'PAID') {
      return NextResponse.json({
        message: 'Idempotent request: Transaksi sudah berhasil diproses sebelumnya (PAID).',
        status: existingPayment.status,
      });
    }

    // 3. Process Status Updates securely
    const isPaid = status === 'PAID';
    const newPaymentStatus = isPaid ? 'PAID' : status === 'EXPIRED' ? 'EXPIRED' : 'FAILED';
    const newOrderPaymentStatus = isPaid ? 'PAID' : status === 'EXPIRED' ? 'EXPIRED' : 'FAILED';

    const updatedPayment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: newPaymentStatus,
        paidAt: isPaid ? new Date() : null,
        idempotencyKey: idempotencyKey || `IDEM-${Date.now()}`,
        rawCallback: JSON.stringify(payload),
      },
    });

    await prisma.order.update({
      where: { id: existingPayment.orderId },
      data: {
        paymentStatus: newOrderPaymentStatus,
      },
    });

    await createAuditLog({
      action: 'PAYMENT_WEBHOOK_PROCESSED',
      resource: 'PAYMENT',
      details: `Payment webhook for Order ${orderNumber} (${paymentReference}) processed. Status: ${newPaymentStatus}`,
    });

    globalEventBus.emit('PAYMENT_UPDATED', {
      orderId: existingPayment.orderId,
      orderNumber,
      paymentStatus: newOrderPaymentStatus,
    });

    // 4. Kirim notifikasi WhatsApp ke pelanggan (non-blocking, tidak menggagalkan transaksi jika WA down)
    if (isPaid && existingPayment.order?.customerPhone) {
      notifyPaymentSuccessWA({
        orderNumber,
        customerName: existingPayment.order.customerName,
        customerPhone: existingPayment.order.customerPhone,
        finalAmount: existingPayment.amount,
      }).catch((err) => console.warn('[Payment Webhook] Gagal kirim WA pembayaran:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook payment successfully verified and processed',
      status: newPaymentStatus,
    });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json({ error: 'Failed to process payment callback' }, { status: 500 });
  }
}
