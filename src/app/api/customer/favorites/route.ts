import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ favorites: [] });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: userPayload.userId },
      include: {
        product: {
          include: {
            category: true,
            variants: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = favorites.map((f) => {
      const revs = f.product.reviews || [];
      const avgRating = revs.length > 0
        ? revs.reduce((sum, r) => sum + r.rating, 0) / revs.length
        : 5.0;

      return {
        id: f.id,
        productId: f.productId,
        createdAt: f.createdAt,
        product: {
          ...f.product,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: revs.length,
        },
      };
    });

    return NextResponse.json({ favorites: formatted });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Gagal memuat produk favorit' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu untuk menyimpan favorit.' },
        { status: 401 }
      );
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: userPayload.userId,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({
        favorited: false,
        message: 'Produk dihapus dari daftar favorit',
      });
    } else {
      await prisma.favorite.create({
        data: {
          userId: userPayload.userId,
          productId,
        },
      });
      return NextResponse.json({
        favorited: true,
        message: 'Produk ditambahkan ke daftar favorit',
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Gagal memperbarui favorit' }, { status: 500 });
  }
}
