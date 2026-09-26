import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { defaultPaymentGateway } from '@/lib/payment/MockPaymentGateway';
import { globalEventBus } from '@/lib/events';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        items: { include: { toppings: true } },
        payment: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pesanan' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    const body = await req.json();

    const {
      tableNumber,
      customerName,
      customerPhone,
      items,
      voucherCode,
      paymentMethod, // 'PAY_AT_CASHIER' | 'ONLINE_PAYMENT'
      notes,
    } = body;

    if (!tableNumber) {
      return NextResponse.json({ error: 'Nomor meja wajib dipilih.' }, { status: 400 });
    }

    if (!customerName) {
      return NextResponse.json({ error: 'Nama pemesan wajib diisi.' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja tidak boleh kosong.' }, { status: 400 });
    }

    const ownerBlock = (await import('@/lib/security')).blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    // Fetch default branch
    const branch = await prisma.branch.findFirst({
      where: { isActive: true },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Cabang kedai kopi tidak aktif.' }, { status: 500 });
    }

    // Find table record if exists
    const table = await prisma.table.findFirst({
      where: {
        branchId: branch.id,
        number: { contains: tableNumber },
      },
    });

    // Check product availability for all items in order
    const productIds = items.map((i: any) => i.product?.id || i.productId);
    const productsInDb = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const unavailableProduct = productsInDb.find((p) => !p.isAvailable);
    if (unavailableProduct) {
      return NextResponse.json(
        { error: `Produk "${unavailableProduct.name}" sedang tidak tersedia / habis saat ini dan tidak dapat dipesan.` },
        { status: 400 }
      );
    }

    // Calculate item subtotals
    let totalAmount = 0;
    const formattedItems = [];

    for (const item of items) {
      const dbProduct = productsInDb.find((p) => p.id === (item.product?.id || item.productId));
      if (!dbProduct) {
        return NextResponse.json({ error: `Produk ID ${item.product?.id} tidak ditemukan.` }, { status: 400 });
      }

      const variantPrice = item.selectedVariant ? item.selectedVariant.priceAdjustment : 0;
      const toppingsPrice = (item.selectedToppings || []).reduce((sum: number, t: any) => sum + t.price, 0);
      const unitPrice = dbProduct.basePrice + variantPrice + toppingsPrice;
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      formattedItems.push({
        productId: dbProduct.id,
        variantId: item.selectedVariant?.id || null,
        productName: dbProduct.name,
        variantName: item.selectedVariant?.name || item.temperature || null,
        unitPrice,
        quantity: item.quantity,
        subtotal,
        notes: [
          item.temperature ? `Temp: ${item.temperature}` : null,
          item.sugarLevel ? `Gula: ${item.sugarLevel}` : null,
          item.iceLevel ? `Es: ${item.iceLevel}` : null,
          item.notes ? `Catatan: ${item.notes}` : null,
        ].filter(Boolean).join(' | '),
        toppings: item.selectedToppings || [],
      });
    }

    // Apply Voucher if provided
    let discountAmount = 0;
    let appliedVoucherId = null;

    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode.toUpperCase().trim() },
      });

      if (
        voucher &&
        voucher.isActive &&
        new Date(voucher.expiryDate) >= new Date() &&
        totalAmount >= voucher.minSpend &&
        voucher.usedCount < voucher.quota
      ) {
        if (voucher.discountType === 'PERCENTAGE') {
          discountAmount = (totalAmount * voucher.discountAmount) / 100;
          if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
            discountAmount = voucher.maxDiscount;
          }
        } else {
          discountAmount = voucher.discountAmount;
        }

        discountAmount = Math.min(discountAmount, totalAmount);
        appliedVoucherId = voucher.id;

        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // Generate Order Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `KM-${dateStr}-${randomSuffix}`;

    const normalizedPaymentMethod = paymentMethod === 'ONLINE_PAYMENT' ? 'ONLINE_PAYMENT' : 'PAY_AT_CASHIER';

    // Create Order in DB
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        branchId: branch.id,
        tableId: table?.id || null,
        tableNumber: tableNumber,
        customerId: userPayload?.userId || null,
        customerName: customerName,
        customerPhone: customerPhone || null,
        isGuest: !userPayload,
        totalAmount,
        discountAmount,
        voucherId: appliedVoucherId,
        finalAmount,
        status: 'WAITING', // WAITING status per mandatory core flow
        paymentStatus: 'UNPAID',
        paymentMethod: normalizedPaymentMethod,
        notes: notes || null,
        items: {
          create: formattedItems.map((fi) => ({
            productId: fi.productId,
            variantId: fi.variantId,
            productName: fi.productName,
            variantName: fi.variantName,
            unitPrice: fi.unitPrice,
            quantity: fi.quantity,
            subtotal: fi.subtotal,
            notes: fi.notes,
            toppings: {
              create: fi.toppings.map((t: any) => ({
                toppingId: t.id,
                toppingName: t.name,
                price: t.price,
              })),
            },
          })),
        },
        history: {
          create: {
            status: 'WAITING',
            notes: 'Pesanan baru dibuat oleh pelanggan (Menunggu Konfirmasi Kasir).',
          },
        },
      },
      include: {
        items: { include: { toppings: true } },
      },
    });

    let paymentData: any = null;

    if (normalizedPaymentMethod === 'ONLINE_PAYMENT') {
      const paymentRes = await defaultPaymentGateway.createPayment({
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        amount: finalAmount,
        customerName,
        customerPhone,
        paymentMethod: 'ONLINE_PAYMENT',
      });

      paymentData = await prisma.payment.create({
        data: {
          orderId: newOrder.id,
          method: 'ONLINE_PAYMENT',
          status: 'PENDING',
          amount: finalAmount,
          paymentReference: paymentRes.paymentReference,
          expiresAt: paymentRes.expiresAt,
        },
      });
    } else {
      paymentData = await prisma.payment.create({
        data: {
          orderId: newOrder.id,
          method: 'PAY_AT_CASHIER',
          status: 'PENDING',
          amount: finalAmount,
        },
      });
    }

    if (table) {
      await prisma.table.update({
        where: { id: table.id },
        data: { status: 'OCCUPIED' },
      });
    }

    await createAuditLog({
      userId: userPayload?.userId,
      action: 'ORDER_CREATED',
      resource: 'ORDER',
      details: `Order ${newOrder.orderNumber} created for Table ${tableNumber} (Total: Rp ${finalAmount})`,
    });

    // Broadcast SSE Event for Cashier Dashboard Realtime Update
    globalEventBus.emit('ORDER_CREATED', {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      tableNumber: newOrder.tableNumber,
      customerName: newOrder.customerName,
      finalAmount: newOrder.finalAmount,
      status: 'WAITING',
    });

    // Send notifications to Cashier and Customer
    await globalEventBus.notify({
      targetRole: 'Cashier',
      title: `Pesanan Baru: ${newOrder.orderNumber}`,
      message: `${newOrder.customerName} memesan di ${newOrder.tableNumber} (Rp ${finalAmount.toLocaleString('id-ID')}).`,
      type: 'ORDER',
      link: '/cashier',
    });

    if (newOrder.customerId) {
      await globalEventBus.notify({
        userId: newOrder.customerId,
        targetRole: 'Customer',
        title: `Pesanan Berhasil Dibuat (${newOrder.orderNumber})`,
        message: `Pesanan Anda di ${newOrder.tableNumber} sedang menunggu konfirmasi kasir.`,
        type: 'ORDER',
        link: `/order-status?id=${newOrder.id}`,
      });
    }

    return NextResponse.json({
      message: 'Pesanan berhasil dibuat!',
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        status: newOrder.status,
        finalAmount: newOrder.finalAmount,
        tableNumber: newOrder.tableNumber,
        paymentMethod: newOrder.paymentMethod,
        paymentReference: paymentData?.paymentReference,
        qrCodeUrl: paymentData?.paymentReference ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(newOrder.orderNumber)}` : null,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat pesanan.' }, { status: 500 });
  }
}
