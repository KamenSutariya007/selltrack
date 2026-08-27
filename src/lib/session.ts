import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { isAllowedUsername, normalizeUsername } from "./auth-config";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "active") {
    throw new Error("Unauthorized");
  }

  if (!isAllowedUsername(user.username)) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function getAuthorizedUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return null;
  if (user.status !== "active") return null;
  if (!isAllowedUsername(user.username)) return null;

  return user;
}

export async function requireAuthorizedUser() {
  const user = await getAuthorizedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export { normalizeUsername };
