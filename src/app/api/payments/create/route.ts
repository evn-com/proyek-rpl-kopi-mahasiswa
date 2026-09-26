import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultPaymentGateway, MockPaymentGateway } from '@/lib/payment/MockPaymentGateway';

export async function POST(req: Request) {
  try {
    const { orderId, simulateSuccess } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'OrderId wajib diisi.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    const gateway = defaultPaymentGateway as MockPaymentGateway;

    // Create payment session via Gateway
    const paymentRes = await gateway.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.finalAmount,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      paymentMethod: 'ONLINE_PAYMENT',
    });

    // Update DB record with reference
    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        method: 'ONLINE_PAYMENT',
        status: 'PENDING',
        amount: order.finalAmount,
        paymentReference: paymentRes.paymentReference,
        expiresAt: paymentRes.expiresAt,
      },
      update: {
        method: 'ONLINE_PAYMENT',
        status: 'PENDING',
        amount: order.finalAmount,
        paymentReference: paymentRes.paymentReference,
        expiresAt: paymentRes.expiresAt,
      },
    });

    // If simulateSuccess is true (for quick testing/mocking in UI)
    if (simulateSuccess) {
      const timestamp = new Date().toISOString();
      const idempotencyKey = `SIM-${Date.now()}`;
      const signature = gateway.generateMockSignature(
        order.orderNumber,
        paymentRes.paymentReference,
        order.finalAmount,
        timestamp
      );

      // Trigger internal callback handling
      const webhookPayload = {
        paymentReference: paymentRes.paymentReference,
        orderNumber: order.orderNumber,
        status: 'PAID',
        amount: order.finalAmount,
        signature,
        timestamp,
        idempotencyKey,
      };

      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payments/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      }).catch((e) => console.log('Simulated internal webhook fetch warning:', e.message));
    }

    return NextResponse.json({
      success: true,
      paymentReference: paymentRes.paymentReference,
      qrCodeUrl: paymentRes.qrCodeUrl,
      expiresAt: paymentRes.expiresAt,
      amount: order.finalAmount,
    });
  } catch (error) {
    console.error('Error creating online payment:', error);
    return NextResponse.json({ error: 'Gagal membuat sesi pembayaran online' }, { status: 500 });
  }
}
