import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, isAllowedRegistrationEmail } from "@/lib/auth-config";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required", code: "EMAIL_REQUIRED" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json(
        {
          error: "Account not found. Please register with the authorized email address.",
          code: "ACCOUNT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (!isAllowedRegistrationEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          error: "Account not found. Please register with the authorized email address.",
          code: "UNAUTHORIZED",
        },
        { status: 403 }
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
        { error: "Invalid email or password", code: "INVALID_PASSWORD" },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Please verify your email before logging in.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Login check failed" }, { status: 500 });
  }
}
