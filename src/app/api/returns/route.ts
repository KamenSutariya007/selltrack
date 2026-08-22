import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  addOrderTimeline,
  recalculateOrderProfit,
  updateStockOnReturn,
  checkAndCreateNotifications,
} from "@/lib/order-service";
import { calculateReturnStats } from "@/lib/calculations";
import { z } from "zod";

const returnSchema = z.object({
  orderDbId: z.string().optional(),
  orderId: z.string().optional(),
  barcode: z.string().optional(),
  returnDate: z.string(),
  quantity: z.number().int().min(1).default(1),
  reason: z.string().min(1),
  returnCharge: z.number().min(0).default(0),
  reverseShippingCharge: z.number().min(0).default(0),
  lossAmount: z.number().min(0).default(0),
  productCondition: z.enum(["GOOD", "DAMAGED", "USED", "MISSING"]).default("GOOD"),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");
    const orderId = searchParams.get("orderId");

    const returns = await prisma.return.findMany({
      where: { userId },
      include: {
        order: { include: { product: true } },
      },
      orderBy: { returnDate: "desc" },
    });

    if (barcode) {
      const product = await prisma.product.findFirst({
        where: { userId, barcode },
        include: {
          orders: { include: { returns: true } },
        },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found", productNotFound: true });
      }

      const stats = calculateReturnStats(
        product.orders.length,
        product.orders.flatMap((o) => o.returns)
      );

      return NextResponse.json({ product, stats, returns: product.orders.flatMap((o) => o.returns) });
    }

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { userId, orderId },
        include: { product: true, returns: true },
      });
      return NextResponse.json(order);
    }

    return NextResponse.json(returns);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const data = returnSchema.parse(body);

    let order = null;

    if (data.orderDbId) {
      order = await prisma.order.findFirst({
        where: { id: data.orderDbId, userId },
        include: { product: true },
      });
    } else if (data.orderId) {
      order = await prisma.order.findFirst({
        where: { orderId: data.orderId, userId },
        include: { product: true },
      });
    } else if (data.barcode) {
      const product = await prisma.product.findFirst({
        where: { userId, barcode: data.barcode },
      });
      if (product) {
        order = await prisma.order.findFirst({
          where: { productId: product.id, userId, isReturned: false },
          orderBy: { orderDate: "desc" },
          include: { product: true },
        });
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const returnRecord = await prisma.return.create({
      data: {
        userId,
        orderDbId: order.id,
        returnDate: new Date(data.returnDate),
        quantity: data.quantity,
        reason: data.reason,
        returnCharge: data.returnCharge,
        reverseShippingCharge: data.reverseShippingCharge,
        lossAmount: data.lossAmount,
        productCondition: data.productCondition,
        notes: data.notes,
      },
    });

    const totalReturnCharges =
      data.returnCharge + data.reverseShippingCharge + data.lossAmount;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        isReturned: true,
        orderStatus: "RETURNED",
        paymentStatus: "RETURNED_ADJUSTED",
        returnCharges: order.returnCharges + totalReturnCharges,
      },
    });

    await addOrderTimeline(order.id, "RETURN_REQUESTED", data.reason);
    await addOrderTimeline(order.id, "RETURNED", `Return charge: ₹${data.returnCharge}`);
    await addOrderTimeline(order.id, "RETURN_RECEIVED", `Condition: ${data.productCondition}`);
    await addOrderTimeline(order.id, "REFUND_ADJUSTED", "Refund/adjustment processed");

    if (order.productId) {
      await updateStockOnReturn(order.productId, data.quantity, data.productCondition);
    }

    await recalculateOrderProfit(order.id);
    await checkAndCreateNotifications(userId);

    const fullReturn = await prisma.return.findUnique({
      where: { id: returnRecord.id },
      include: { order: { include: { product: true, timeline: true } } },
    });

    return NextResponse.json(fullReturn, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to create return" }, { status: 500 });
  }
}
