import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { addOrderTimeline, recalculateOrderProfit } from "@/lib/order-service";
import { z } from "zod";

const updateSchema = z.object({
  orderStatus: z
    .enum([
      "CREATED",
      "SHIPPED",
      "DELIVERED",
      "PAYMENT_EXPECTED",
      "PAYMENT_RECEIVED",
      "RETURN_REQUESTED",
      "RETURNED",
      "RETURN_RECEIVED",
      "REFUND_ADJUSTED",
      "CANCELLED",
    ])
    .optional(),
  paymentStatus: z
    .enum(["PENDING", "PROCESSING", "PAID", "FAILED", "RETURNED_ADJUSTED"])
    .optional(),
  actualPaymentDate: z.string().optional().nullable(),
  shippingCharge: z.number().min(0).optional(),
  platformCommission: z.number().min(0).optional(),
  gstTax: z.number().min(0).optional(),
  otherCharges: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        product: true,
        returns: true,
        timeline: { orderBy: { createdAt: "asc" } },
        payments: true,
        expenses: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const totalExpenses =
      order.productCost * order.quantity +
      order.platformCommission +
      order.shippingCharge +
      order.gstTax +
      order.otherCharges +
      order.returnCharges;

    return NextResponse.json({
      ...order,
      totalExpenses,
      profitOrLoss: order.netProfit >= 0 ? "profit" : "loss",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const order = await prisma.order.findFirst({ where: { id, userId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.actualPaymentDate) {
      updateData.actualPaymentDate = new Date(data.actualPaymentDate);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    if (data.orderStatus) {
      await addOrderTimeline(id, data.orderStatus);
    }

    if (data.paymentStatus === "PAID") {
      await prisma.payment.updateMany({
        where: { orderDbId: id },
        data: {
          status: "PAID",
          paymentDate: data.actualPaymentDate
            ? new Date(data.actualPaymentDate)
            : new Date(),
        },
      });
      await addOrderTimeline(id, "PAYMENT_RECEIVED", "Payment received");
    }

    await recalculateOrderProfit(id);

    const fullOrder = await prisma.order.findUnique({
      where: { id },
      include: { product: true, timeline: true, payments: true },
    });

    return NextResponse.json(fullOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const order = await prisma.order.findFirst({ where: { id, userId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
