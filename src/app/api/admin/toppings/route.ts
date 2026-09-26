import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, blockIfOwnerWrite } from '@/lib/security';
import { createAuditLog } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const toppings = await prisma.topping.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ toppings });
  } catch (error) {
    console.error('Error fetching toppings:', error);
    return NextResponse.json({ error: 'Gagal mengambil data topping' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const { name, price, isAvailable } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nama dan harga topping wajib diisi' }, { status: 400 });
    }

    const topping = await prisma.topping.create({
      data: {
        name: name.trim(),
        price: parseFloat(price) || 0,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'CREATE_TOPPING',
      resource: 'TOPPING',
      details: `Created topping: ${topping.name} (Rp ${topping.price})`,
    });

    return NextResponse.json({ message: 'Topping berhasil ditambahkan', topping }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating topping:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Topping dengan nama tersebut sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menambahkan topping' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const body = await req.json();
    const { id, name, price, isAvailable } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID topping wajib disertakan' }, { status: 400 });
    }

    const updated = await prisma.topping.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
      },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'UPDATE_TOPPING',
      resource: 'TOPPING',
      details: `Updated topping: ${updated.name}`,
    });

    return NextResponse.json({ message: 'Topping berhasil diperbarui', topping: updated });
  } catch (error) {
    console.error('Error updating topping:', error);
    return NextResponse.json({ error: 'Gagal memperbarui topping' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const ownerBlock = blockIfOwnerWrite(req);
    if (ownerBlock) return ownerBlock;

    const auth = requireRole(req, ['Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID topping wajib disertakan' }, { status: 400 });
    }

    const deleted = await prisma.topping.delete({
      where: { id },
    });

    await createAuditLog({
      userId: auth.user.userId,
      action: 'DELETE_TOPPING',
      resource: 'TOPPING',
      details: `Deleted topping: ${deleted.name}`,
    });

    return NextResponse.json({ message: 'Topping berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting topping:', error);
    return NextResponse.json({ error: 'Gagal menghapus topping' }, { status: 500 });
  }
}
