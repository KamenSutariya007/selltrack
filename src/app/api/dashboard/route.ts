import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { aggregateOrderMetrics } from "@/lib/calculations";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "@/lib/utils";
import { checkAndCreateNotifications } from "@/lib/order-service";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    await checkAndCreateNotifications(userId);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const prevMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const allOrders = await prisma.order.findMany({ where: { userId } });
    const todayOrders = allOrders.filter(
      (o) => o.orderDate >= todayStart && o.orderDate <= todayEnd
    );
    const monthOrders = allOrders.filter(
      (o) => o.orderDate >= monthStart && o.orderDate <= monthEnd
    );
    const prevMonthOrders = allOrders.filter(
      (o) => o.orderDate >= prevMonthStart && o.orderDate <= prevMonthEnd
    );

    const todayExpenses = await prisma.expense.findMany({
      where: { userId, date: { gte: todayStart, lte: todayEnd } },
    });
    const monthExpenses = await prisma.expense.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
    });

    const today = aggregateOrderMetrics(todayOrders);
    today.otherExpenses += todayExpenses.reduce((s, e) => s + e.amount, 0);

    const thisMonth = aggregateOrderMetrics(monthOrders);
    thisMonth.otherExpenses +=
      monthExpenses.reduce((s, e) => s + e.amount, 0) + thisMonth.otherExpenses;

    const overall = aggregateOrderMetrics(allOrders);
    const allExpenses = await prisma.expense.findMany({ where: { userId } });
    overall.otherExpenses += allExpenses.reduce((s, e) => s + e.amount, 0);

    const platforms = ["AMAZON", "FLIPKART", "MEESHO", "OTHER"] as const;
    const platformStats = platforms.map((platform) => {
      const platformOrders = allOrders.filter((o) => o.platform === platform);
      return {
        platform,
        ...aggregateOrderMetrics(platformOrders),
      };
    });

    const prevMonthMetrics = aggregateOrderMetrics(prevMonthOrders);
    const salesChange =
      prevMonthMetrics.sales > 0
        ? ((thisMonth.sales - prevMonthMetrics.sales) / prevMonthMetrics.sales) * 100
        : 0;
    const profitChange =
      prevMonthMetrics.profit > 0
        ? ((thisMonth.profit - prevMonthMetrics.profit) / prevMonthMetrics.profit) * 100
        : 0;

    const products = await prisma.product.findMany({ where: { userId } });
    const productStats = products.map((product) => {
      const productOrders = allOrders.filter((o) => o.productId === product.id);
      const sold = productOrders.reduce((s, o) => s + o.quantity, 0);
      const returns = productOrders.filter((o) => o.isReturned).length;
      const profit = productOrders.reduce((s, o) => s + o.netProfit, 0);
      return {
        id: product.id,
        name: product.productName,
        sold,
        returns,
        profit,
        stock: product.currentStock,
        returnRate: productOrders.length > 0 ? (returns / productOrders.length) * 100 : 0,
      };
    });

    const bestSelling = [...productStats].sort((a, b) => b.sold - a.sold)[0];
    const mostProfitable = [...productStats].sort((a, b) => b.profit - a.profit)[0];
    const highestReturn = [...productStats].sort((a, b) => b.returnRate - a.returnRate)[0];

    const lowStockProducts = products.filter((p) => p.currentStock <= p.minimumStock);

    const avgOrderValue = overall.orders > 0 ? overall.sales / overall.orders : 0;
    const avgProfitPerOrder = overall.orders > 0 ? overall.profit / overall.orders : 0;
    const returnPercentage = overall.orders > 0 ? (overall.returns / overall.orders) * 100 : 0;

    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      today,
      thisMonth,
      overall,
      platformStats,
      analytics: {
        salesChange,
        profitChange,
        bestSelling,
        mostProfitable,
        highestReturn,
        avgOrderValue,
        avgProfitPerOrder,
        returnPercentage,
        lowStockProducts,
      },
      notifications,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
