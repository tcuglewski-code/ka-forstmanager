// Migration: Konvertiert bestehende Auftrag.baumarten (Text) + wizardDaten.baumarten
// in normalisierte AuftragPflanzItem Records — nur für aktive Aufträge ohne bestehende Items.
//
// Verwendung:
//   npx tsx src/lib/seeds/migrate-baumarten-to-pflanzitems.ts
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter, log: ["error"] })

const SKIP_STATUS = new Set(["abgeschlossen", "abgerechnet", "abgelehnt", "storniert"])

type Parsed = { baumart: string; menge: number }

// Parser: "Eiche 500, Buche 300; Fichte: 200" -> Items
function parseBaumartenText(text: string): Parsed[] {
  if (!text) return []
  const parts = text
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const items: Parsed[] = []
  for (const part of parts) {
    // Match z.B. "Eiche 500", "Buche: 300", "200 Fichten"
    const m1 = part.match(/^(.+?)\s*[:=]?\s*(\d+)\s*(stk|stück|stueck)?$/i)
    const m2 = part.match(/^(\d+)\s+(.+?)$/)
    if (m1) {
      items.push({ baumart: m1[1].trim(), menge: parseInt(m1[2]) })
    } else if (m2) {
      items.push({ baumart: m2[2].trim(), menge: parseInt(m2[1]) })
    } else if (part.length > 0) {
      // Nur Baumart ohne Menge
      items.push({ baumart: part, menge: 0 })
    }
  }
  return items
}

function extractFromWizardDaten(wd: unknown): Parsed[] {
  if (!wd || typeof wd !== "object") return []
  const obj = wd as Record<string, unknown>
  const ba = obj.baumarten
  if (Array.isArray(ba)) {
    const items: Parsed[] = []
    for (const entry of ba) {
      if (typeof entry === "string") {
        items.push(...parseBaumartenText(entry))
      } else if (entry && typeof entry === "object") {
        const e = entry as Record<string, unknown>
        const baumart =
          typeof e.baumart === "string"
            ? e.baumart
            : typeof e.name === "string"
              ? e.name
              : typeof e.art === "string"
                ? e.art
                : null
        const mengeRaw = e.menge ?? e.anzahl ?? e.stueck ?? 0
        const menge = typeof mengeRaw === "number" ? mengeRaw : parseInt(String(mengeRaw)) || 0
        if (baumart) items.push({ baumart: baumart.trim(), menge })
      }
    }
    return items
  }
  if (typeof ba === "string") return parseBaumartenText(ba)
  return []
}

async function main() {
  const auftraege = await prisma.auftrag.findMany({
    where: { deletedAt: null },
    select: { id: true, titel: true, status: true, baumarten: true, wizardDaten: true },
  })

  let processed = 0
  let createdItems = 0
  let skipped = 0

  for (const a of auftraege) {
    if (SKIP_STATUS.has(a.status)) {
      skipped++
      continue
    }

    const existingCount = await prisma.auftragPflanzItem.count({ where: { auftragId: a.id } })
    if (existingCount > 0) {
      skipped++
      continue
    }

    // Erst aus wizardDaten, dann fallback auf baumarten-Text
    let parsed = extractFromWizardDaten(a.wizardDaten)
    if (parsed.length === 0 && a.baumarten) {
      parsed = parseBaumartenText(a.baumarten)
    }

    if (parsed.length === 0) {
      skipped++
      continue
    }

    for (const p of parsed) {
      await prisma.auftragPflanzItem.create({
        data: {
          auftragId: a.id,
          baumart: p.baumart,
          sollMenge: p.menge,
          istMenge: 0,
          notizen: "auto-migriert aus Auftrag.baumarten / wizardDaten",
        },
      })
      createdItems++
    }
    processed++
  }

  console.log(
    `✓ Migration fertig: ${processed} Aufträge migriert, ${createdItems} PflanzItems angelegt, ${skipped} übersprungen`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
