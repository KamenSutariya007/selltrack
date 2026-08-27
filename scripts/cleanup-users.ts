import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "../src/lib/auth-config";

const prisma = new PrismaClient();
const allowed = normalizeEmail(process.env.ALLOWED_REGISTRATION_EMAIL || "kamensutariya01@gmail.com");

async function main() {
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true, emailVerified: true } });

  console.log("Allowed email:", allowed);
  console.log("All users:", allUsers);

  const unauthorized = allUsers.filter((u) => normalizeEmail(u.email) !== allowed);

  for (const user of unauthorized) {
    await prisma.user.delete({ where: { id: user.id } });
    console.log("Deleted unauthorized user:", user.email);
  }

  const allowedUser = await prisma.user.findUnique({ where: { email: allowed } });
  if (allowedUser && !allowedUser.emailVerified) {
    console.log("Allowed user exists but not verified:", allowed);
  } else if (allowedUser) {
    console.log("Allowed user OK:", allowed);
  } else {
    console.log("No allowed user yet — register with:", allowed);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
