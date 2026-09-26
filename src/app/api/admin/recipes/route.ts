import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    const recipes = await prisma.recipe.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { id: true, name: true } },
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Gagal mengambil resep' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Admin' && userPayload.role !== 'Owner')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { productId, ingredients } = await req.json();

    if (!productId || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({ error: 'ProductId dan daftar ingredients wajib diisi.' }, { status: 400 });
    }

    // Replace existing recipes for this product
    await prisma.recipe.deleteMany({ where: { productId } });

    const newRecipes = [];
    for (const item of ingredients) {
      if (item.ingredientId && item.quantityRequired > 0) {
        const rec = await prisma.recipe.create({
          data: {
            productId,
            ingredientId: item.ingredientId,
            quantityRequired: parseFloat(item.quantityRequired),
          },
        });
        newRecipes.push(rec);
      }
    }

    await createAuditLog({
      userId: userPayload.userId,
      action: 'UPDATE_PRODUCT_RECIPE',
      resource: 'RECIPE',
      details: `Updated recipe BOM for product ${productId} (${newRecipes.length} ingredients)`,
    });

    return NextResponse.json({ message: 'Resep produk berhasil disimpan', recipes: newRecipes });
  } catch (error) {
    console.error('Error saving recipes:', error);
    return NextResponse.json({ error: 'Gagal menyimpan resep' }, { status: 500 });
  }
}
