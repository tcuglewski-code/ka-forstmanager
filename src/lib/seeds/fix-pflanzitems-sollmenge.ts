// Re-Parse: AuftragPflanzItem mit sollMenge=0 wo baumart-Feld den vollen Text enthält
// (z.B. "Stechpalme: 100 Stk.") → extrahiert Menge und cleant Baumart.
//
// Verwendung:
//   npx tsx src/lib/seeds/fix-pflanzitems-sollmenge.ts
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter, log: ["error"] })

// Match z.B. "Stechpalme: 100 Stk.", "Eiche 500", "Buche: 300 Stk", "100 kg" am Ende
const PARSE_REGEX = /^(.+?)\s*[:=]?\s*(\d+)\s*(?:stk\.?|stück\.?|stueck\.?|kg)?(?:\s*\(.*\))?$/i

async function main() {
  const badItems = await prisma.auftragPflanzItem.findMany({
    where: { sollMenge: 0 },
  })

  let fixed = 0
  let unchanged = 0

  for (const item of badItems) {
    const m = item.baumart.match(PARSE_REGEX)
    if (m) {
      const newBaumart = m[1].trim()
      const newMenge = parseInt(m[2])
      if (newMenge > 0 && newBaumart) {
        await prisma.auftragPflanzItem.update({
          where: { id: item.id },
          data: { baumart: newBaumart, sollMenge: newMenge },
        })
        fixed++
        console.log(`✓ ${item.baumart} → ${newBaumart} (${newMenge})`)
        continue
      }
    }
    unchanged++
  }

  console.log(`\n✓ Fix fertig: ${fixed} Items korrigiert, ${unchanged} unverändert`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
