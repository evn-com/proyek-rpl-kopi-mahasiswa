import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const auth = requireRole(req, ['Owner', 'Admin']);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

    let startDate = new Date();
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === 'month') {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else {
      startDate = new Date(0); // all time
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                recipes: { include: { ingredient: true } },
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const totalTransactions = paidOrders.length;
    const averageOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // Calculate Estimated Profit (Gross margin = Revenue - Estimated Cost of Goods from BOM ingredients)
    let totalEstimatedCOGS = 0;
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        const recipes = item.product?.recipes || [];
        const itemCOGS = recipes.reduce((sum, r) => {
          const unitPrice = r.ingredient?.purchasePrice || 0;
          return sum + unitPrice * (r.quantityRequired / 1000); // normalized
        }, 0);
        totalEstimatedCOGS += itemCOGS * item.quantity;
      });
    });

    // Default COGS assumption (approx 35% food cost if recipes not fully configured)
    if (totalEstimatedCOGS === 0 && totalRevenue > 0) {
      totalEstimatedCOGS = Math.round(totalRevenue * 0.35);
    }
    const estimatedProfit = Math.max(0, totalRevenue - totalEstimatedCOGS);

    // Sales by Category
    const categorySales: Record<string, { name: string; revenue: number; count: number }> = {};
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        const catName = item.product?.category?.name || 'Lainnya';
        if (!categorySales[catName]) {
          categorySales[catName] = { name: catName, revenue: 0, count: 0 };
        }
        categorySales[catName].revenue += item.subtotal;
        categorySales[catName].count += item.quantity;
      });
    });

    // Product performance
    const productStats: Record<string, { id: string; name: string; qty: number; revenue: number; category: string }> = {};
    paidOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productStats[item.productName]) {
          productStats[item.productName] = {
            id: item.productId,
            name: item.productName,
            qty: 0,
            revenue: 0,
            category: item.product?.category?.name || 'Kopi',
          };
        }
        productStats[item.productName].qty += item.quantity;
        productStats[item.productName].revenue += item.subtotal;
      });
    });

    const sortedProducts = Object.values(productStats).sort((a, b) => b.qty - a.qty);
    const bestSelling = sortedProducts.slice(0, 5);
    const lowPerforming = [...sortedProducts].reverse().slice(0, 5);

    // Sales by Day
    const daySalesMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    paidOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!daySalesMap[dateKey]) {
        daySalesMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
      }
      daySalesMap[dateKey].revenue += o.finalAmount;
      daySalesMap[dateKey].orders += 1;
    });

    // Sales by Hour (0..23)
    const hourSalesMap: Record<number, { hour: number; orders: number; revenue: number }> = {};
    for (let h = 7; h <= 23; h++) {
      hourSalesMap[h] = { hour: h, orders: 0, revenue: 0 };
    }
    paidOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      if (hourSalesMap[h]) {
        hourSalesMap[h].orders += 1;
        hourSalesMap[h].revenue += o.finalAmount;
      }
    });

    // Payment Methods Breakdown
    const paymentMethods: Record<string, number> = {
      PAY_AT_CASHIER: 0,
      ONLINE_PAYMENT: 0,
    };
    paidOrders.forEach((o) => {
      const method = o.paymentMethod === 'ONLINE_PAYMENT' ? 'ONLINE_PAYMENT' : 'PAY_AT_CASHIER';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // New vs Returning Customers
    const customerOrdersCount: Record<string, number> = {};
    paidOrders.forEach((o) => {
      const key = o.customerId || o.customerName;
      customerOrdersCount[key] = (customerOrdersCount[key] || 0) + 1;
    });

    let newCustomerCount = 0;
    let returningCustomerCount = 0;
    Object.values(customerOrdersCount).forEach((cnt) => {
      if (cnt > 1) returningCustomerCount++;
      else newCustomerCount++;
    });

    // Inventory & Low Stock Alerts
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    const inventories = branch
      ? await prisma.inventory.findMany({
          where: { branchId: branch.id },
          include: { ingredient: true },
        })
      : [];

    const lowStockAlerts = inventories
      .filter((i) => i.stockQuantity <= i.ingredient.minimumStock)
      .map((i) => ({
        id: i.id,
        name: i.ingredient.name,
        stock: i.stockQuantity,
        min: i.ingredient.minimumStock,
        unit: i.ingredient.unit,
      }));

    // Ingredient Usage
    const ingredientUsage = inventories.map((i) => ({
      name: i.ingredient.name,
      currentStock: `${i.stockQuantity} ${i.ingredient.unit}`,
      status: i.stockQuantity <= i.ingredient.minimumStock ? 'LOW' : 'SAFE',
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalTransactions,
        averageOrderValue,
        estimatedProfit,
        profitMargin: totalRevenue > 0 ? Math.round((estimatedProfit / totalRevenue) * 100) : 0,
      },
      bestSelling,
      lowPerforming,
      salesByDay: Object.values(daySalesMap),
      salesByHour: Object.values(hourSalesMap),
      salesByCategory: Object.values(categorySales),
      paymentMethods,
      customers: {
        newCustomers: newCustomerCount,
        returningCustomers: returningCustomerCount,
      },
      lowStockAlerts,
      ingredientUsage,
      dateRange: range,
    });
  } catch (error) {
    console.error('Owner analytics error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data analitik owner' }, { status: 500 });
  }
}
