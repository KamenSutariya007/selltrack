import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  isAllowedRegistrationEmail,
  normalizeEmail,
  validatePassword,
  getAppUrl,
} from "@/lib/auth-config";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    if (!process.env.ALLOWED_REGISTRATION_EMAIL) {
      return NextResponse.json(
        { error: "Registration is not configured. Contact administrator." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const data = registerSchema.parse(body);
    const email = normalizeEmail(data.email);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isAllowedRegistrationEmail(email)) {
      return NextResponse.json(
        { error: "Registration is not allowed for this email address." },
        { status: 403 }
      );
    }

    const passwordError = validatePassword(data.password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please login." },
        { status: 400 }
      );
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        role: "user",
        status: "active",
      },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    await sendVerificationEmail(email, verificationToken);

    const verifyUrl = `${getAppUrl()}/api/auth/verify-email?token=${verificationToken}`;
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    const response: Record<string, unknown> = {
      user,
      message: "Registration successful. Please verify your email before logging in.",
    };

    if (!smtpConfigured) {
      response.verificationUrl = verifyUrl;
      response.note =
        "Email service not configured. Use the verification link below to verify your account.";
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
