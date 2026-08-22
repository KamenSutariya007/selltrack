import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { z } from "zod";

const expenseSchema = z.object({
  date: z.string(),
  category: z.enum([
    "SHIPPING",
    "PACKAGING",
    "PLATFORM_COMMISSION",
    "GST_TAX",
    "RETURN_CHARGE",
    "ADVERTISING",
    "PRODUCT_PURCHASE",
    "OTHER",
  ]),
  amount: z.number().min(0),
  platform: z.enum(["AMAZON", "FLIPKART", "MEESHO", "OTHER"]).optional(),
  orderDbId: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");

    const where: Record<string, unknown> = { userId };
    if (category) where.category = category;
    if (platform) where.platform = platform;

    const expenses = await prisma.expense.findMany({
      where,
      include: { order: true },
      orderBy: { date: "desc" },
    });

    const total = expenses.reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({ expenses, total });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const data = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        userId,
        date: new Date(data.date),
        category: data.category,
        amount: data.amount,
        platform: data.platform,
        orderDbId: data.orderDbId || null,
        description: data.description,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
