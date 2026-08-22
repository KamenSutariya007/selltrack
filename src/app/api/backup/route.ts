import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();

    const [products, orders, returns, expenses, payments] = await Promise.all([
      prisma.product.findMany({ where: { userId } }),
      prisma.order.findMany({ where: { userId }, include: { timeline: true } }),
      prisma.return.findMany({ where: { userId } }),
      prisma.expense.findMany({ where: { userId } }),
      prisma.payment.findMany({ where: { userId } }),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      products,
      orders,
      returns,
      expenses,
      payments,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const data = await request.json();

    if (!data.products && !data.orders) {
      return NextResponse.json({ error: "Invalid import data" }, { status: 400 });
    }

    let imported = { products: 0, orders: 0, expenses: 0 };

    if (data.products?.length) {
      for (const product of data.products) {
        const { id: _id, userId: _uid, createdAt, updatedAt, ...productData } = product;
        void _id;
        void _uid;
        void createdAt;
        void updatedAt;
        try {
          await prisma.product.upsert({
            where: { barcode: productData.barcode },
            create: { ...productData, userId },
            update: productData,
          });
          imported.products++;
        } catch {
          // skip duplicates
        }
      }
    }

    return NextResponse.json({ success: true, imported });
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
