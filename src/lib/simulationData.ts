import type { PrismaClient } from '@prisma/client';
import {
  SIMULATION_USERS,
  SIMULATION_USER_LIST,
  SIMULATION_INGREDIENTS,
  SIMULATION_INVENTORY_LOGS,
  SIMULATION_LOW_STOCK,
  SIMULATION_STATS,
  type SimulatedIngredient,
  type SimulatedInventoryLog,
  type SimulatedUserItem,
} from './simulationConstants';

export {
  SIMULATION_USERS,
  SIMULATION_USER_LIST,
  SIMULATION_INGREDIENTS,
  SIMULATION_INVENTORY_LOGS,
  SIMULATION_LOW_STOCK,
  SIMULATION_STATS,
  type SimulatedIngredient,
  type SimulatedInventoryLog,
  type SimulatedUserItem,
};

/**
 * Menyuntikkan seluruh data simulasi ke Prisma database jika tabel masih kosong.
 */
export async function seedSimulationDataIfEmpty(prisma: PrismaClient) {
  try {
    const existingCount = await prisma.ingredient.count();
    if (existingCount > 0) return false;

    // 1. Ambil cabang aktif
    let branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          code: 'KM-01',
          name: 'Kopi Mahasiswa Kampus Utama',
          address: 'Jl. Ganesha No. 10, Bandung (Dekat Gerbang Utama)',
          phone: '0812-3456-7890',
          isActive: true,
        },
      });
    }

    // 2. Ambil user berdasarkan role
    const users = await prisma.user.findMany({ include: { role: true } });
    const userByRole: Record<string, string> = {};
    for (const u of users) {
      const r = u.role?.name?.toLowerCase();
      if (r && !userByRole[r]) {
        userByRole[r] = u.id;
      }
    }

    const adminUserId = userByRole['admin'] || users[0]?.id;
    const baristaUserId = userByRole['barista'] || adminUserId;
    const cashierUserId = userByRole['cashier'] || adminUserId;
    const ownerUserId = userByRole['owner'] || adminUserId;
    const customerUserId = userByRole['customer'] || adminUserId;

    if (!adminUserId) return false;

    // 3. Masukkan Ingredients & Inventory
    const createdIngredients: Record<string, { ingredientId: string; inventoryId: string }> = {};

    for (const sim of SIMULATION_INGREDIENTS) {
      const ing = await prisma.ingredient.create({
        data: {
          name: sim.name,
          unit: sim.unit,
          minimumStock: sim.minimumStock,
          purchasePrice: sim.purchasePrice,
          supplier: sim.supplier,
          expiryDate: sim.expiryDate ? new Date(sim.expiryDate) : null,
        },
      });

      const inv = await prisma.inventory.create({
        data: {
          branchId: branch.id,
          ingredientId: ing.id,
          stockQuantity: sim.currentStock,
        },
      });

      createdIngredients[sim.name] = { ingredientId: ing.id, inventoryId: inv.id };
    }

    // 4. Masukkan InventoryTransactions
    const roleIdMap: Record<string, string> = {
      Admin: adminUserId,
      Barista: baristaUserId,
      Cashier: cashierUserId,
      Owner: ownerUserId,
      Customer: customerUserId,
    };

    for (const log of SIMULATION_INVENTORY_LOGS) {
      const targetIng = createdIngredients[log.inventory.ingredient.name];
      const targetUserId = roleIdMap[log.createdBy.role || 'Admin'] || adminUserId;

      if (targetIng && targetUserId) {
        await prisma.inventoryTransaction.create({
          data: {
            inventoryId: targetIng.inventoryId,
            type: log.type,
            amount: log.amount,
            notes: log.notes,
            createdById: targetUserId,
            createdAt: new Date(log.createdAt),
          },
        });
      }
    }

    return true;
  } catch (err) {
    console.warn('[seedSimulationDataIfEmpty] Warning/Skipped:', err);
    return false;
  }
}
