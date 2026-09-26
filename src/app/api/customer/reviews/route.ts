import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    const where: any = {};
    if (productId) {
      where.productId = productId;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { name: true } },
        product: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const averageRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
        : 5.0;

    return NextResponse.json({
      reviews,
      totalReviews: reviews.length,
      averageRating,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Gagal memuat ulasan' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    const { orderId, productId, rating, comment } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId wajib diisi.' }, { status: 400 });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating harus bernilai antara 1 sampai 5 bintang.' }, { status: 400 });
    }

    // Check order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // MANDATORY REQUIREMENT: Customer can ONLY review COMPLETED orders!
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Ulasan hanya dapat diberikan untuk pesanan yang sudah selesai (COMPLETED).' },
        { status: 400 }
      );
    }

    // Prevent duplicate review for the same order and product
    const existingReview = await prisma.review.findFirst({
      where: {
        orderId: order.id,
        productId: productId || null,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Anda sudah memberikan ulasan untuk pesanan ini sebelumnya.' },
        { status: 400 }
      );
    }

    const newReview = await prisma.review.create({
      data: {
        orderId: order.id,
        productId: productId || (order.items[0]?.productId || null),
        userId: userPayload?.userId || order.customerId || null,
        rating: numRating,
        comment: sanitizeInput(comment) || null,
      },
    });

    // Give loyalty points bonus to customer if registered
    if (order.customerId) {
      await prisma.customerProfile.updateMany({
        where: { userId: order.customerId },
        data: { points: { increment: 10 } }, // +10 points for leaving review!
      });
    }

    return NextResponse.json({
      message: 'Terima kasih! Ulasan dan rating Anda berhasil disimpan.',
      review: newReview,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Gagal mengirim ulasan.' }, { status: 500 });
  }
}
