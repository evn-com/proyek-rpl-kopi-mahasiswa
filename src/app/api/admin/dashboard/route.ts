import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, ['Admin', 'Owner']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const totalProducts = await prisma.product.count();
    const totalCategories = await prisma.category.count();
    const totalIngredients = await prisma.ingredient.count();
    const totalOrders = await prisma.order.count();
    const totalPromotions = await prisma.promotion.count();

    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    let lowStockList: any[] = [];

    if (branch) {
      const inventories = await prisma.inventory.findMany({
        where: { branchId: branch.id },
        include: { ingredient: true },
      });
      lowStockList = inventories
        .filter((i) => i.stockQuantity <= i.ingredient.minimumStock)
        .map((i) => ({
          name: i.ingredient.name,
          currentStock: i.stockQuantity,
          minimumStock: i.ingredient.minimumStock,
          unit: i.ingredient.unit,
        }));
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayOrders, weekOrders, monthOrders, recentOrders, recentActivity] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: weekStart }, paymentStatus: 'PAID' },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: monthStart }, paymentStatus: 'PAID' },
      }),
      prisma.order.findMany({
        include: { items: true, payment: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const revenueToday = todayOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    const revenueWeek = weekOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const revenueMonth = monthOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    return NextResponse.json({
      totalProducts,
      totalCategories,
      totalIngredients,
      totalOrders,
      totalPromotions,
      lowStockCount: lowStockList.length,
      lowStockList,
      salesSummary: {
        todayOrdersCount: todayOrders.length,
        todayRevenue: revenueToday,
        weekRevenue: revenueWeek,
        monthRevenue: revenueMonth,
      },
      recentOrders,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Gagal mengambil statistik dashboard' }, { status: 500 });
  }
}
