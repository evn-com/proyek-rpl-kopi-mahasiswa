import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const searchQuery = searchParams.get('search');

    const whereClause: any = { isAvailable: true };

    if (categorySlug && categorySlug !== 'all') {
      whereClause.category = { slug: categorySlug };
    }

    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery } },
        { description: { contains: searchQuery } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        variants: true,
        reviews: true,
        favorites: userPayload
          ? {
              where: { userId: userPayload.userId },
              select: { id: true },
            }
          : false,
      },
      orderBy: [
        { isBestSeller: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const toppings = await prisma.topping.findMany({
      where: { isAvailable: true },
    });

    const formattedProducts = products.map((p) => {
      const revs = p.reviews || [];
      const avgRating =
        revs.length > 0
          ? Math.round((revs.reduce((acc, r) => acc + r.rating, 0) / revs.length) * 10) / 10
          : 5.0;

      return {
        ...p,
        averageRating: avgRating,
        reviewCount: revs.length,
        isFavorite: Array.isArray(p.favorites) && p.favorites.length > 0,
      };
    });

    return NextResponse.json({ products: formattedProducts, toppings });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Gagal mengambil data produk.' }, { status: 500 });
  }
}
