import nodemailer from "nodemailer";
import { getAppUrl } from "./auth-config";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

function getFromAddress(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@selltrack.app";
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const transport = createTransport();
  const verifyUrl = `${getAppUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  if (!transport) {
    if (process.env.NODE_ENV === "development") {
      console.info("[dev] Email verification link:", verifyUrl);
      return true;
    }
    console.error("SMTP not configured — cannot send verification email");
    return false;
  }

  await transport.sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Verify your SellTrack email",
    html: `
      <p>Please verify your email to access SellTrack.</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `,
  });

  return true;
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const transport = createTransport();
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  if (!transport) {
    if (process.env.NODE_ENV === "development") {
      console.info("[dev] Password reset link:", resetUrl);
      return true;
    }
    console.error("SMTP not configured — cannot send password reset email");
    return false;
  }

  await transport.sendMail({
    from: getFromAddress(),
    to: email,
    subject: "Reset your SellTrack password",
    html: `
      <p>Click the link below to reset your password.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
    `,
  });

  return true;
}

export async function sendGenericEmail(
  to: string,
  subject: string,
  message: string
): Promise<boolean> {
  const transport = createTransport();
  if (!transport) return false;

  await transport.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html: `<p>${message}</p>`,
  });

  return true;
}
