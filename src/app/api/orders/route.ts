import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { addDays } from "@/lib/utils";
import {
  addOrderTimeline,
  recalculateOrderProfit,
  updateStockOnOrder,
  checkAndCreateNotifications,
} from "@/lib/order-service";
import { calculateGrossProfit, calculateNetProfit } from "@/lib/calculations";
import { z } from "zod";

const orderSchema = z.object({
  orderId: z.string().min(1),
  platform: z.enum(["AMAZON", "FLIPKART", "MEESHO", "OTHER"]),
  productId: z.string().optional(),
  productName: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  productCost: z.number().min(0),
  sellingPrice: z.number().min(0),
  customerRef: z.string().optional(),
  orderDate: z.string(),
  expectedPaymentDate: z.string().optional(),
  actualPaymentDate: z.string().optional().nullable(),
  paymentStatus: z
    .enum(["PENDING", "PROCESSING", "PAID", "FAILED", "RETURNED_ADJUSTED"])
    .default("PENDING"),
  shippingCharge: z.number().min(0).default(0),
  platformCommission: z.number().min(0).default(0),
  gstTax: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const platform = searchParams.get("platform");
    const paymentStatus = searchParams.get("paymentStatus");
    const returnStatus = searchParams.get("returnStatus");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const orderId = searchParams.get("orderId");

    const where: Record<string, unknown> = { userId };

    if (orderId) {
      where.orderId = orderId;
    }

    if (platform) where.platform = platform;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (returnStatus === "returned") where.isReturned = true;
    if (returnStatus === "not_returned") where.isReturned = false;

    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) (where.orderDate as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.orderDate as Record<string, Date>).lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        { productName: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        product: true,
        returns: true,
        timeline: { orderBy: { createdAt: "asc" } },
        payments: true,
      },
      orderBy: { orderDate: "desc" },
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const data = orderSchema.parse(body);

    const existing = await prisma.order.findUnique({
      where: { userId_orderId: { userId, orderId: data.orderId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Order ID already exists" }, { status: 400 });
    }

    const orderDate = new Date(data.orderDate);
    const expectedPaymentDate = data.expectedPaymentDate
      ? new Date(data.expectedPaymentDate)
      : addDays(orderDate, 15);

    const grossProfit = calculateGrossProfit({
      sellingPrice: data.sellingPrice,
      productCost: data.productCost,
      quantity: data.quantity,
    });

    const netProfit = calculateNetProfit({
      sellingPrice: data.sellingPrice,
      productCost: data.productCost,
      platformCommission: data.platformCommission,
      shippingCharge: data.shippingCharge,
      gstTax: data.gstTax,
      otherCharges: data.otherCharges,
      quantity: data.quantity,
    });

    const order = await prisma.order.create({
      data: {
        userId,
        orderId: data.orderId,
        platform: data.platform,
        productId: data.productId || null,
        productName: data.productName,
        sku: data.sku,
        barcode: data.barcode,
        size: data.size,
        color: data.color,
        quantity: data.quantity,
        productCost: data.productCost,
        sellingPrice: data.sellingPrice,
        customerRef: data.customerRef,
        orderDate,
        expectedPaymentDate,
        actualPaymentDate: data.actualPaymentDate ? new Date(data.actualPaymentDate) : null,
        paymentStatus: data.paymentStatus,
        shippingCharge: data.shippingCharge,
        platformCommission: data.platformCommission,
        gstTax: data.gstTax,
        otherCharges: data.otherCharges,
        grossProfit,
        netProfit,
        notes: data.notes,
      },
    });

    await addOrderTimeline(order.id, "CREATED", "Order created");
    await addOrderTimeline(order.id, "PAYMENT_EXPECTED", `Payment expected by ${expectedPaymentDate.toDateString()}`);

    await prisma.payment.create({
      data: {
        userId,
        orderDbId: order.id,
        expectedDate: expectedPaymentDate,
        amount: data.sellingPrice * data.quantity,
        status: data.paymentStatus,
      },
    });

    if (data.productId) {
      await updateStockOnOrder(data.productId, data.quantity, "decrease");
    }

    await checkAndCreateNotifications(userId);

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { product: true, timeline: true, payments: true },
    });

    return NextResponse.json(fullOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
