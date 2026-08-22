import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@selltrack.app";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("demo123", 12);
    const user = await prisma.user.create({
      data: {
        name: "Demo User",
        email,
        password: hashedPassword,
      },
    });

    const products = await Promise.all([
      prisma.product.create({
        data: {
          userId: user.id,
          productName: "Cotton T-Shirt Blue M",
          sku: "TSH-BLU-M",
          barcode: "8901234567890",
          category: "Clothing",
          size: "M",
          color: "Blue",
          costPrice: 250,
          sellingPrice: 599,
          currentStock: 50,
          minimumStock: 10,
          platform: "AMAZON",
        },
      }),
      prisma.product.create({
        data: {
          userId: user.id,
          productName: "Wireless Earbuds",
          sku: "EAR-WHT-01",
          barcode: "8901234567891",
          category: "Electronics",
          size: "One Size",
          color: "White",
          costPrice: 450,
          sellingPrice: 999,
          currentStock: 30,
          minimumStock: 5,
          platform: "FLIPKART",
        },
      }),
    ]);

    console.log("Demo user created:", email, "/ demo123");
    console.log("Products created:", products.length);
  } else {
    console.log("Demo user already exists");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
