import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeUsername, isAllowedUsername } from "@/lib/auth-config";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username?.trim()) {
      return NextResponse.json({ error: "Username is required", code: "USERNAME_REQUIRED" }, { status: 400 });
    }

    const normalizedUsername = normalizeUsername(username);

    if (!isAllowedUsername(normalizedUsername)) {
      return NextResponse.json(
        { error: "Invalid username or password", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { username: normalizedUsername } });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Your account is not active. Contact administrator.", code: "INACTIVE" },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password", code: "INVALID_PASSWORD" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Login check failed" }, { status: 500 });
  }
}
