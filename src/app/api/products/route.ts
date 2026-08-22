import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { z } from "zod";

const productSchema = z.object({
  productName: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().min(1),
  category: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  currentStock: z.number().int().min(0).default(0),
  minimumStock: z.number().int().min(0).default(5),
  platform: z.enum(["AMAZON", "FLIPKART", "MEESHO", "OTHER"]).optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const barcode = searchParams.get("barcode");

    if (barcode) {
      const product = await prisma.product.findFirst({
        where: { userId, barcode },
      });
      return NextResponse.json(product);
    }

    const products = await prisma.product.findMany({
      where: {
        userId,
        OR: search
          ? [
              { productName: { contains: search } },
              { sku: { contains: search } },
              { barcode: { contains: search } },
            ]
          : undefined,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const data = productSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { barcode: data.barcode },
    });

    if (existing) {
      return NextResponse.json({ error: "Barcode already exists" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: { ...data, userId },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
