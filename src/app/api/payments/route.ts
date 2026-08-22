import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { addOrderTimeline } from "@/lib/order-service";
import { z } from "zod";

const paymentUpdateSchema = z.object({
  orderDbId: z.string(),
  status: z.enum(["PENDING", "PROCESSING", "PAID", "FAILED", "RETURNED_ADJUSTED"]),
  paymentDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: { include: { product: true } },
      },
      orderBy: { expectedDate: "asc" },
    });

    const summary = {
      totalOrderValue: payments.reduce((s, p) => s + p.amount, 0),
      paidAmount: payments
        .filter((p) => p.status === "PAID")
        .reduce((s, p) => s + p.amount, 0),
      pendingAmount: payments
        .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
        .reduce((s, p) => s + p.amount, 0),
    };

    return NextResponse.json({ payments, summary });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const data = paymentUpdateSchema.parse(body);

    const order = await prisma.order.findFirst({
      where: { id: data.orderDbId, userId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

    await prisma.payment.updateMany({
      where: { orderDbId: data.orderDbId },
      data: { status: data.status, paymentDate: data.status === "PAID" ? paymentDate : null },
    });

    await prisma.order.update({
      where: { id: data.orderDbId },
      data: {
        paymentStatus: data.status,
        actualPaymentDate: data.status === "PAID" ? paymentDate : null,
        orderStatus: data.status === "PAID" ? "PAYMENT_RECEIVED" : order.orderStatus,
      },
    });

    if (data.status === "PAID") {
      await addOrderTimeline(data.orderDbId, "PAYMENT_RECEIVED", "Marked as paid");
    }

    const payment = await prisma.payment.findFirst({
      where: { orderDbId: data.orderDbId },
      include: { order: true },
    });

    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
