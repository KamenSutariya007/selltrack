import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { aggregateOrderMetrics } from "@/lib/calculations";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const platform = searchParams.get("platform");

    const where: Record<string, unknown> = { userId };
    if (platform) where.platform = platform;
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) (where.orderDate as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.orderDate as Record<string, Date>).lte = new Date(dateTo);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { product: true, returns: true },
      orderBy: { orderDate: "desc" },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        ...(dateFrom || dateTo
          ? {
              date: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : {}),
      },
    });

    const metrics = aggregateOrderMetrics(orders);
    const totalExpenses =
      expenses.reduce((s, e) => s + e.amount, 0) +
      metrics.platformCharges +
      metrics.shippingCharges +
      metrics.returnCharges;

    switch (type) {
      case "sales": {
        const byDate = orders.reduce(
          (acc, order) => {
            const date = order.orderDate.toISOString().split("T")[0];
            if (!acc[date]) {
              acc[date] = { date, platform: order.platform, orders: 0, sales: 0, quantity: 0 };
            }
            acc[date].orders += 1;
            acc[date].sales += order.sellingPrice * order.quantity;
            acc[date].quantity += order.quantity;
            return acc;
          },
          {} as Record<string, { date: string; platform: string; orders: number; sales: number; quantity: number }>
        );
        return NextResponse.json({ type: "sales", data: Object.values(byDate), metrics });
      }

      case "profit":
        return NextResponse.json({
          type: "profit",
          data: {
            sales: metrics.sales,
            cost: metrics.productCost,
            charges: metrics.platformCharges + metrics.shippingCharges + metrics.returnCharges,
            expenses: totalExpenses,
            profit: metrics.profit,
            loss: metrics.loss,
          },
          orders,
        });

      case "returns": {
        const returnedOrders = orders.filter((o) => o.isReturned);
        return NextResponse.json({
          type: "returns",
          data: {
            orders: metrics.orders,
            returns: metrics.returns,
            returnRate: metrics.orders > 0 ? (metrics.returns / metrics.orders) * 100 : 0,
            returnCharges: metrics.returnCharges,
            loss: metrics.loss,
          },
          returnedOrders,
        });
      }

      case "payments": {
        const payments = await prisma.payment.findMany({
          where: { userId },
          include: { order: true },
        });
        return NextResponse.json({ type: "payments", data: payments });
      }

      case "products": {
        const products = await prisma.product.findMany({ where: { userId } });
        const productReport = products.map((p) => {
          const pOrders = orders.filter((o) => o.productId === p.id);
          return {
            name: p.productName,
            sku: p.sku,
            sold: pOrders.reduce((s, o) => s + o.quantity, 0),
            stock: p.currentStock,
            returns: pOrders.filter((o) => o.isReturned).length,
            profit: pOrders.reduce((s, o) => s + o.netProfit, 0),
          };
        });
        return NextResponse.json({ type: "products", data: productReport });
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
