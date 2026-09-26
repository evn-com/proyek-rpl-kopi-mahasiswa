import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        recipes: {
          include: { ingredient: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const ownerBlock = (await import('@/lib/security')).blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const userPayload = getUserFromRequest(req);
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses ditolak. Membutuhkan hak akses Admin (Owner bersifat Read-Only).' }, { status: 403 });
    }

    const body = await req.json();
    const { name, categoryId, description, basePrice, image, isAvailable, isBestSeller, variants } = body;

    if (!name || !categoryId || basePrice === undefined) {
      return NextResponse.json({ error: 'Nama produk, kategori, dan harga dasar wajib diisi.' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        categoryId,
        description: description || '',
        basePrice: parseFloat(basePrice),
        image: image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
        isAvailable: isAvailable ?? true,
        isBestSeller: isBestSeller ?? false,
        variants: variants && Array.isArray(variants) ? {
          create: variants.map((v: any) => ({
            name: v.name,
            priceAdjustment: parseFloat(v.priceAdjustment || 0),
          })),
        } : undefined,
      },
      include: {
        category: true,
        variants: true,
        recipes: { include: { ingredient: true } },
      },
    });

    await createAuditLog({
      userId: userPayload.userId,
      action: 'CREATE_PRODUCT',
      resource: 'PRODUCT',
      details: `Admin ${userPayload.name} created product ${product.name} (Rp ${product.basePrice})`,
    });

    return NextResponse.json({ message: 'Produk berhasil dibuat', product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 });
  }
}
