import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPw = await bcrypt.hash("Admin2026!", 10)

  await prisma.user.upsert({
    where: { email: "admin@koch-aufforstung.de" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@koch-aufforstung.de",
      password: hashedPw,
      role: "admin",
    },
  })

  await prisma.tenant.upsert({
    where: { slug: "koch-aufforstung" },
    update: {},
    create: {
      name: "Koch Aufforstung GmbH",
      slug: "koch-aufforstung",
      primaryColor: "#2C3A1C",
    },
  })

  console.log("✅ Seed erfolgreich")
}

main().catch(console.error).finally(() => prisma.$disconnect())
