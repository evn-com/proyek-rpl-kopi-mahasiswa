import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const ownerBlock = (await import('@/lib/security')).blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const userPayload = getUserFromRequest(req);
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses ditolak. Membutuhkan hak akses Admin (Owner bersifat Read-Only).' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, categoryId, description, basePrice, image, isAvailable, isBestSeller, variants } = body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Delete existing variants and re-create if variants provided
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        description: description !== undefined ? description : existing.description,
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : existing.basePrice,
        image: image !== undefined ? image : existing.image,
        isAvailable: isAvailable !== undefined ? isAvailable : existing.isAvailable,
        isBestSeller: isBestSeller !== undefined ? isBestSeller : existing.isBestSeller,
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
      action: 'UPDATE_PRODUCT',
      resource: 'PRODUCT',
      details: `Admin ${userPayload.name} updated product ${updated.name}`,
    });

    return NextResponse.json({ message: 'Produk berhasil diperbarui', product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Gagal mengedit produk' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const ownerBlock = (await import('@/lib/security')).blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const userPayload = getUserFromRequest(req);
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Akses ditolak. Membutuhkan hak akses Admin (Owner bersifat Read-Only).' }, { status: 403 });
    }

    const { id } = params;
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Delete associated recipes and variants
    await prisma.recipe.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    await createAuditLog({
      userId: userPayload.userId,
      action: 'DELETE_PRODUCT',
      resource: 'PRODUCT',
      details: `Admin ${userPayload.name} deleted product ${existing.name}`,
    });

    return NextResponse.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
