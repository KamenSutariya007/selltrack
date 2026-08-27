export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function getAllowedRegistrationEmail(): string {
  const email = process.env.ALLOWED_REGISTRATION_EMAIL;
  if (!email) {
    throw new Error("ALLOWED_REGISTRATION_EMAIL is not configured");
  }
  return normalizeEmail(email);
}

export function isAllowedRegistrationEmail(email: string): boolean {
  try {
    const allowed = getAllowedRegistrationEmail();
    return normalizeEmail(email) === allowed;
  } catch {
    return false;
  }
}

export function getAppUrl(): string {
  return process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
}

export const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  return null;
}
