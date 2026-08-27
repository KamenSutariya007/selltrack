import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const allowedEmail = process.env.ALLOWED_REGISTRATION_EMAIL?.toLowerCase().trim();

  if (!allowedEmail) {
    console.log("Set ALLOWED_REGISTRATION_EMAIL in .env to seed demo user");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: allowedEmail } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("demo123456", 12);
    await prisma.user.create({
      data: {
        name: "Demo User",
        email: allowedEmail,
        password: hashedPassword,
        emailVerified: true,
        role: "user",
        status: "active",
      },
    });

    console.log(`Demo user created: ${allowedEmail} / demo123456`);
  } else {
    console.log("Demo user already exists");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
