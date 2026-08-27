import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, isAllowedRegistrationEmail } from "@/lib/auth-config";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);

    // Always return generic success to avoid email enumeration
    const genericResponse = {
      message: "If an account exists for this email, a password reset link has been sent.",
    };

    if (!isAllowedRegistrationEmail(normalizedEmail)) {
      return NextResponse.json(genericResponse);
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.emailVerified) {
      return NextResponse.json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    await sendPasswordResetEmail(normalizedEmail, resetToken);

    return NextResponse.json(genericResponse);
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
