import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: userPayload.userId },
          { customerPhone: userPayload.email }, // fallback
        ],
      },
      include: {
        items: {
          include: {
            toppings: true,
            product: {
              select: { id: true, name: true, image: true, basePrice: true, isAvailable: true },
            },
          },
        },
        payment: true,
        reviews: true,
        history: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching customer order history:', error);
    return NextResponse.json({ error: 'Gagal memuat riwayat pesanan' }, { status: 500 });
  }
}
