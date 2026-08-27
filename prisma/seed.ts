import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ALLOWED_USERNAME?.trim();

  if (!username) {
    console.log("Set ALLOWED_USERNAME in .env to seed demo user");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("demo123456", 12);
    await prisma.user.create({
      data: {
        username,
        name: "Demo User",
        email: `${username.toLowerCase()}@selltrack.local`,
        password: hashedPassword,
        emailVerified: true,
        role: "user",
        status: "active",
      },
    });

    console.log(`Demo user created: ${username} / demo123456`);
  } else {
    console.log("Demo user already exists");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
