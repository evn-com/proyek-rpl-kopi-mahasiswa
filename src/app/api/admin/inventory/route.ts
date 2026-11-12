import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createAuditLog } from '@/lib/auth';
import { globalEventBus } from '@/lib/events';
import { SIMULATION_INVENTORY_LOGS, SIMULATION_INGREDIENTS, seedSimulationDataIfEmpty } from '@/lib/simulationData';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');

    let branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      await seedSimulationDataIfEmpty(prisma);
      branch = await prisma.branch.findFirst({ where: { isActive: true } });
      if (!branch) {
        if (view === 'history') {
          return NextResponse.json(SIMULATION_INVENTORY_LOGS);
        }
        return NextResponse.json({
          inventories: [],
          lowStockAlertsCount: 1,
          lowStockAlerts: [{
            ingredientName: 'Adonan Frozen Butter Croissant',
            currentStock: 32,
            minimumStock: 50,
            unit: 'pcs',
          }],
        });
      }
    }

    if (view === 'history') {
      let transactions = await prisma.inventoryTransaction.findMany({
        include: {
          inventory: {
            include: { ingredient: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      if (transactions.length === 0) {
        await seedSimulationDataIfEmpty(prisma);
        transactions = await prisma.inventoryTransaction.findMany({
          include: {
            inventory: {
              include: { ingredient: true },
            },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });

        if (transactions.length === 0) {
          return NextResponse.json(SIMULATION_INVENTORY_LOGS);
        }
      }

      return NextResponse.json(transactions);
    }

    const inventories = await prisma.inventory.findMany({
      where: { branchId: branch.id },
      include: {
        ingredient: true,
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true } } },
        },
      },
      orderBy: { ingredient: { name: 'asc' } },
    });

    const lowStockAlerts = inventories.filter((inv) => inv.stockQuantity <= inv.ingredient.minimumStock);

    return NextResponse.json({
      inventories,
      lowStockAlertsCount: lowStockAlerts.length,
      lowStockAlerts: lowStockAlerts.map((i) => ({
        ingredientName: i.ingredient.name,
        currentStock: i.stockQuantity,
        minimumStock: i.ingredient.minimumStock,
        unit: i.ingredient.unit,
      })),
    });
  } catch (error) {
    console.error('Error fetching inventory (falling back to simulation):', error);
    const { searchParams } = new URL(req.url);
    if (searchParams.get('view') === 'history') {
      return NextResponse.json(SIMULATION_INVENTORY_LOGS);
    }
    return NextResponse.json({
      inventories: [],
      lowStockAlertsCount: 1,
      lowStockAlerts: [{
        ingredientName: 'Adonan Frozen Butter Croissant',
        currentStock: 32,
        minimumStock: 50,
        unit: 'pcs',
      }],
    });
  }
}

export async function POST(req: Request) {
  try {
    const userPayload = getUserFromRequest(req);
    if (!userPayload || (userPayload.role !== 'Admin' && userPayload.role !== 'Owner')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { ingredientId, inventoryId, type, amount, notes } = body;

    if (!type || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Jenis mutasi (type) dan jumlah (amount > 0) wajib diisi.' }, { status: 400 });
    }

    if (!['IN', 'ADJUSTMENT', 'OUT', 'USAGE'].includes(type)) {
      return NextResponse.json({ error: 'Jenis mutasi stok tidak valid. Gunakan IN, ADJUSTMENT, OUT, atau USAGE.' }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      return NextResponse.json({ error: 'Cabang aktif tidak ditemukan' }, { status: 500 });
    }

    let targetInventory = null;

    if (inventoryId) {
      targetInventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
        include: { ingredient: true },
      });
    } else if (ingredientId) {
      targetInventory = await prisma.inventory.findFirst({
        where: { branchId: branch.id, ingredientId },
        include: { ingredient: true },
      });

      if (!targetInventory) {
        targetInventory = await prisma.inventory.create({
          data: {
            branchId: branch.id,
            ingredientId,
            stockQuantity: 0,
          },
          include: { ingredient: true },
        });
      }
    }

    if (!targetInventory) {
      return NextResponse.json({ error: 'Data inventaris bahan baku tidak ditemukan' }, { status: 404 });
    }

    const qty = parseFloat(amount);
    let newStockQuantity = targetInventory.stockQuantity;

    if (type === 'IN') {
      newStockQuantity += qty;
    } else if (type === 'OUT' || type === 'USAGE') {
      if (targetInventory.stockQuantity < qty) {
        return NextResponse.json(
          {
            error: `Stok tidak mencukupi untuk pengurangan ${qty} ${targetInventory.ingredient.unit}. Stok saat ini: ${targetInventory.stockQuantity} ${targetInventory.ingredient.unit}.`,
          },
          { status: 400 }
        );
      }
      newStockQuantity -= qty;
    } else if (type === 'ADJUSTMENT') {
      // ADJUSTMENT sets absolute stock value or adjusts to absolute physical count
      if (qty < 0) {
        return NextResponse.json({ error: 'Stok penyesuaian tidak boleh negatif.' }, { status: 400 });
      }
      newStockQuantity = qty;
    }

    const updatedInv = await prisma.inventory.update({
      where: { id: targetInventory.id },
      data: { stockQuantity: newStockQuantity },
      include: { ingredient: true },
    });

    const txLog = await prisma.inventoryTransaction.create({
      data: {
        inventoryId: updatedInv.id,
        type,
        amount: qty,
        notes: notes || `Mutasi ${type} oleh ${userPayload.name}`,
        createdById: userPayload.userId,
      },
    });

    await createAuditLog({
      userId: userPayload.userId,
      action: `STOCK_${type}`,
      resource: 'INVENTORY',
      details: `${type} ${qty} ${updatedInv.ingredient.unit} for ${updatedInv.ingredient.name}. New Stock: ${newStockQuantity}`,
    });

    globalEventBus.emit('INVENTORY_UPDATED', {
      ingredientName: updatedInv.ingredient.name,
      newStock: newStockQuantity,
      unit: updatedInv.ingredient.unit,
    });

    return NextResponse.json({
      message: 'Mutasi stok berhasil dicatat',
      inventory: updatedInv,
      transaction: txLog,
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Gagal memproses mutasi stok' }, { status: 500 });
  }
}
