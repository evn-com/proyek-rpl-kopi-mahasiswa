import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { SIMULATION_INGREDIENTS, seedSimulationDataIfEmpty } from '@/lib/simulationData';

export async function GET() {
  try {
    let branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      // Auto seed simulation if database is unseeded
      await seedSimulationDataIfEmpty(prisma);
      branch = await prisma.branch.findFirst({ where: { isActive: true } });
      if (!branch) {
        return NextResponse.json(SIMULATION_INGREDIENTS);
      }
    }

    let ingredients = await prisma.ingredient.findMany({
      include: {
        inventories: {
          where: { branchId: branch.id },
        },
        _count: { select: { recipes: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (ingredients.length === 0) {
      await seedSimulationDataIfEmpty(prisma);
      ingredients = await prisma.ingredient.findMany({
        include: {
          inventories: {
            where: { branchId: branch.id },
          },
          _count: { select: { recipes: true } },
        },
        orderBy: { name: 'asc' },
      });
      if (ingredients.length === 0) {
        return NextResponse.json(SIMULATION_INGREDIENTS);
      }
    }

    const formatted = ingredients.map((ing) => {
      const inv = ing.inventories[0];
      const stockQuantity = inv ? inv.stockQuantity : 0;
      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        minimumStock: ing.minimumStock,
        purchasePrice: ing.purchasePrice || 0,
        supplier: ing.supplier || '-',
        expiryDate: ing.expiryDate ? ing.expiryDate.toISOString().slice(0, 10) : null,
        currentStock: stockQuantity,
        inventoryId: inv?.id,
        isLowStock: stockQuantity <= ing.minimumStock,
        recipesCount: ing._count.recipes,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching ingredients (falling back to simulation):', error);
    return NextResponse.json(SIMULATION_INGREDIENTS);
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Admin' && userPayload.role !== 'Owner')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, unit, minimumStock, purchasePrice, supplier, expiryDate, initialStock } = body;

    if (!name || !unit) {
      return NextResponse.json({ error: 'Nama bahan dan satuan (unit) wajib diisi' }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      return NextResponse.json({ error: 'Cabang aktif tidak ditemukan' }, { status: 500 });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        minimumStock: minimumStock ? parseFloat(minimumStock) : 100,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        supplier: supplier || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    // Create Inventory record for branch
    const inventory = await prisma.inventory.create({
      data: {
        branchId: branch.id,
        ingredientId: ingredient.id,
        stockQuantity: initialStock ? parseFloat(initialStock) : 0,
      },
    });

    if (initialStock && parseFloat(initialStock) > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: 'IN',
          amount: parseFloat(initialStock),
          notes: 'Stok awal bahan baku baru',
          createdById: userPayload.userId,
        },
      });
    }

    await createAuditLog({
      userId: userPayload.userId,
      action: 'CREATE_INGREDIENT',
      resource: 'INGREDIENT',
      details: `Created ingredient ${name} (${unit})`,
    });

    return NextResponse.json({ message: 'Bahan baku berhasil dibuat', ingredient }, { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json({ error: 'Gagal membuat bahan baku' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Admin' && userPayload.role !== 'Owner')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, unit, minimumStock, purchasePrice, supplier, expiryDate } = body;

    if (!id || !name || !unit) {
      return NextResponse.json({ error: 'ID, nama bahan, dan satuan wajib diisi' }, { status: 400 });
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        unit,
        minimumStock: minimumStock ? parseFloat(minimumStock) : 100,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        supplier: supplier || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    await createAuditLog({
      userId: userPayload.userId,
      action: 'UPDATE_INGREDIENT',
      resource: 'INGREDIENT',
      details: `Updated ingredient ${name}`,
    });

    return NextResponse.json({ message: 'Bahan baku berhasil diperbarui', ingredient: updated });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json({ error: 'Gagal mengedit bahan baku' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID bahan baku wajib diisi' }, { status: 400 });
    }

    // Delete associated recipes and inventory records
    await prisma.recipe.deleteMany({ where: { ingredientId: id } });
    const inventories = await prisma.inventory.findMany({ where: { ingredientId: id } });
    for (const inv of inventories) {
      await prisma.inventoryTransaction.deleteMany({ where: { inventoryId: inv.id } });
    }
    await prisma.inventory.deleteMany({ where: { ingredientId: id } });
    await prisma.ingredient.delete({ where: { id } });

    await createAuditLog({
      userId: userPayload.userId,
      action: 'DELETE_INGREDIENT',
      resource: 'INGREDIENT',
      details: `Deleted ingredient ID ${id}`,
    });

    return NextResponse.json({ message: 'Bahan baku berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return NextResponse.json({ error: 'Gagal menghapus bahan baku' }, { status: 500 });
  }
}
