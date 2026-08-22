import { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { calculateNetProfit, calculateGrossProfit } from "./calculations";

export async function addOrderTimeline(
  orderDbId: string,
  status: OrderStatus,
  note?: string
) {
  return prisma.orderTimeline.create({
    data: { orderId: orderDbId, status, note },
  });
}

export async function recalculateOrderProfit(orderDbId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderDbId } });
  if (!order) return;

  const grossProfit = calculateGrossProfit({
    sellingPrice: order.sellingPrice,
    productCost: order.productCost,
    quantity: order.quantity,
  });

  const netProfit = calculateNetProfit({
    sellingPrice: order.sellingPrice,
    productCost: order.productCost,
    platformCommission: order.platformCommission,
    shippingCharge: order.shippingCharge,
    gstTax: order.gstTax,
    otherCharges: order.otherCharges,
    returnCharges: order.returnCharges,
    quantity: order.quantity,
  });

  await prisma.order.update({
    where: { id: orderDbId },
    data: { grossProfit, netProfit },
  });
}

export async function updateStockOnOrder(
  productId: string,
  quantity: number,
  operation: "decrease" | "increase"
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const delta = operation === "decrease" ? -quantity : quantity;
  await prisma.product.update({
    where: { id: productId },
    data: { currentStock: Math.max(0, product.currentStock + delta) },
  });
}

export async function updateStockOnReturn(
  productId: string,
  quantity: number,
  condition: "GOOD" | "DAMAGED" | "USED" | "MISSING"
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const updates: Record<string, number> = {};

  switch (condition) {
    case "GOOD":
      updates.currentStock = product.currentStock + quantity;
      break;
    case "DAMAGED":
      updates.damagedStock = product.damagedStock + quantity;
      break;
    case "USED":
      updates.returnedStock = product.returnedStock + quantity;
      break;
    case "MISSING":
      updates.lostStock = product.lostStock + quantity;
      break;
  }

  await prisma.product.update({
    where: { id: productId },
    data: updates,
  });
}

export async function checkAndCreateNotifications(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const duePayments = await prisma.order.findMany({
    where: {
      userId,
      paymentStatus: { in: ["PENDING", "PROCESSING"] },
      expectedPaymentDate: { gte: today, lt: tomorrow },
    },
  });

  if (duePayments.length > 0) {
    const total = duePayments.reduce((s, o) => s + o.sellingPrice * o.quantity, 0);
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "PAYMENT_DUE",
        createdAt: { gte: today },
        isRead: false,
      },
    });
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          type: "PAYMENT_DUE",
          title: "Payment Due Today",
          message: `${duePayments.length} Orders – ₹${total.toLocaleString("en-IN")}`,
        },
      });
    }
  }

  const overduePayments = await prisma.order.findMany({
    where: {
      userId,
      paymentStatus: { in: ["PENDING", "PROCESSING"] },
      expectedPaymentDate: { lt: today },
    },
  });

  if (overduePayments.length > 0) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "PAYMENT_OVERDUE",
        createdAt: { gte: today },
        isRead: false,
      },
    });
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          type: "PAYMENT_OVERDUE",
          title: "Payment Overdue",
          message: `${overduePayments.length} orders have overdue payments`,
        },
      });
    }
  }

  const lowStock = await prisma.product.findMany({
    where: { userId },
  });
  const lowStockFiltered = lowStock.filter((p) => p.currentStock <= p.minimumStock);

  if (lowStockFiltered.length > 0) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "LOW_STOCK",
        createdAt: { gte: today },
        isRead: false,
      },
    });
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          type: "LOW_STOCK",
          title: "Low Stock Alert",
          message: `${lowStockFiltered.length} products are running low`,
        },
      });
    }
  }

  void lowStockFiltered;
}
