import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await requireUserId();

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const { id, markAllRead } = await request.json();

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
