import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kategori' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Admin' && userPayload.role !== 'Owner')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { name, icon, displayOrder } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon: icon || 'coffee',
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      },
    });

    await createAuditLog({
      userId: userPayload.userId,
      action: 'CREATE_CATEGORY',
      resource: 'CATEGORY',
      details: `Created category ${name}`,
    });

    return NextResponse.json({ message: 'Kategori berhasil dibuat', category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Admin' && userPayload.role !== 'Owner')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { id, name, icon, displayOrder } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'ID dan Nama kategori wajib diisi' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        icon: icon || 'coffee',
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      },
    });

    await createAuditLog({
      userId: userPayload.userId,
      action: 'UPDATE_CATEGORY',
      resource: 'CATEGORY',
      details: `Updated category ${name}`,
    });

    return NextResponse.json({ message: 'Kategori berhasil diperbarui', category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Admin' && userPayload.role !== 'Owner')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kategori wajib diisi' }, { status: 400 });
    }

    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${productCount} produk.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    await createAuditLog({
      userId: userPayload.userId,
      action: 'DELETE_CATEGORY',
      resource: 'CATEGORY',
      details: `Deleted category ID ${id}`,
    });

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
  }
}
