import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  productName: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  category: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  currentStock: z.number().int().min(0).optional(),
  minimumStock: z.number().int().min(0).optional(),
  platform: z.enum(["AMAZON", "FLIPKART", "MEESHO", "OTHER"]).optional().nullable(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, userId },
      include: {
        orders: {
          include: { returns: true },
          orderBy: { orderDate: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const totalOrders = product.orders.length;
    const totalReturns = product.orders.filter((o) => o.isReturned).length;
    const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;

    return NextResponse.json({ ...product, totalOrders, totalReturns, returnRate });
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

    const product = await prisma.product.findFirst({ where: { id, userId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (data.barcode && data.barcode !== product.barcode) {
      const existing = await prisma.product.findUnique({
        where: { barcode: data.barcode },
      });
      if (existing) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 400 });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const product = await prisma.product.findFirst({ where: { id, userId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
