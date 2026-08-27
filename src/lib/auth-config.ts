export function normalizeUsername(username: string): string {
  return username.trim();
}

export function getAllowedUsername(): string {
  const username = process.env.ALLOWED_USERNAME;
  if (!username) {
    throw new Error("ALLOWED_USERNAME is not configured");
  }
  return normalizeUsername(username);
}

export function isAllowedUsername(username: string): boolean {
  try {
    const allowed = getAllowedUsername();
    return normalizeUsername(username) === allowed;
  } catch {
    return false;
  }
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
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
