import { prisma } from './prisma';

export async function deductStockForOrder(orderId: string, userId?: string): Promise<{ success: boolean; message: string; details?: any }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              recipes: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return { success: false, message: 'Order tidak ditemukan' };
  }

  // Aggregate required ingredients
  const ingredientRequirements: Record<string, { name: string; required: number; unit: string }> = {};

  for (const item of order.items) {
    if (!item.product || !item.product.recipes) continue;

    for (const recipe of item.product.recipes) {
      const ingredientId = recipe.ingredientId;
      const qtyNeeded = recipe.quantityRequired * item.quantity;

      if (!ingredientRequirements[ingredientId]) {
        ingredientRequirements[ingredientId] = {
          name: recipe.ingredient.name,
          required: qtyNeeded,
          unit: recipe.ingredient.unit,
        };
      } else {
        ingredientRequirements[ingredientId].required += qtyNeeded;
      }
    }
  }

  const ingredientIds = Object.keys(ingredientRequirements);
  if (ingredientIds.length === 0) {
    return { success: true, message: 'Produk tidak memerlukan resep/bahan baku.' };
  }

  // Verify branch inventories
  const inventories = await prisma.inventory.findMany({
    where: {
      branchId: order.branchId,
      ingredientId: { in: ingredientIds },
    },
  });

  const inventoryMap = new Map(inventories.map((inv) => [inv.ingredientId, inv]));

  // Ensure stock is available for all ingredients (prevent negative stock)
  for (const ingredientId of ingredientIds) {
    const req = ingredientRequirements[ingredientId];
    const inv = inventoryMap.get(ingredientId);

    if (!inv || inv.stockQuantity < req.required) {
      const currentStock = inv ? inv.stockQuantity : 0;
      return {
        success: false,
        message: `Stok bahan "${req.name}" tidak mencukupi! Dibutuhkan: ${req.required} ${req.unit}, Tersedia: ${currentStock} ${req.unit}.`,
      };
    }
  }

  // System user fallback if userId not provided
  let adminUser = userId;
  if (!adminUser) {
    const defaultAdmin = await prisma.user.findFirst({
      where: { role: { name: 'Admin' } },
    });
    adminUser = defaultAdmin?.id || order.customerId || 'system';
  }

  // Deduct stock in Prisma transaction
  await prisma.$transaction(async (tx) => {
    for (const ingredientId of ingredientIds) {
      const req = ingredientRequirements[ingredientId];
      const inv = inventoryMap.get(ingredientId)!;

      // Update Inventory
      const updatedInv = await tx.inventory.update({
        where: { id: inv.id },
        data: {
          stockQuantity: { decrement: req.required },
        },
      });

      // Create Inventory Transaction Log
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: updatedInv.id,
          type: 'USAGE',
          amount: req.required,
          notes: `Pengurangan stok otomatis untuk Order ${order.orderNumber}`,
          createdById: adminUser!,
        },
      });
    }
  });

  return { success: true, message: 'Stok bahan baku berhasil dikurangi berdasarkan resep.' };
}
