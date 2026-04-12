/**
 * Seed-Script: Darmstädter Forstbaumschulen + FoVG Referenzdaten
 * Importiert Pflanzangebot aus SecondBrain → ForstManager BaumschulPreisliste
 *
 * Verwendung: npx tsx scripts/seed-darmstaedter.ts
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL!
const SECOND_BRAIN_URL = process.env.SECOND_BRAIN_URL!

if (!DATABASE_URL || !SECOND_BRAIN_URL) {
  console.error("DATABASE_URL und SECOND_BRAIN_URL müssen gesetzt sein!")
  process.exit(1)
}

// ForstManager DB via Prisma
const adapter = new PrismaPg({ connectionString: DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// SecondBrain DB via pg direkt
const sbClient = new pg.Client({ connectionString: SECOND_BRAIN_URL })

async function main() {
  await sbClient.connect()
  console.log("Verbunden mit SecondBrain DB")

  // ── 1. Darmstädter Forstbaumschulen ──────────────────────────────────────

  console.log("\n=== Darmstädter Forstbaumschulen GmbH ===")

  let baumschule = await prisma.baumschule.findUnique({
    where: { name: "Darmstädter Forstbaumschulen GmbH" },
  })

  if (baumschule) {
    console.log(`Existiert bereits: ${baumschule.id}`)
  } else {
    baumschule = await prisma.baumschule.create({
      data: {
        name: "Darmstädter Forstbaumschulen GmbH",
        ort: "Darmstadt/Pfungstadt",
        bundesland: "Hessen",
        ansprechpartner: null,
        email: null,
        telefon: null,
        notizen: "Daten importiert aus SecondBrain. Saison 2025.",
        aktiv: true,
      },
    })
    console.log(`Erstellt: ${baumschule.id}`)
  }

  // Bestehende Preislisten löschen (fresh import)
  const deleted = await prisma.baumschulPreisliste.deleteMany({
    where: { baumschuleId: baumschule.id },
  })
  console.log(`${deleted.count} bestehende Preislisten-Einträge gelöscht`)

  // Pflanzangebot aus SecondBrain laden
  const { rows: pflanzen } = await sbClient.query(
    "SELECT baumart_name_de, preis_per_stueck, einheit, saison, verfuegbar, qualitaet, hoehe_cm, herkunft_code_full, mindestmenge FROM pflanzangebot WHERE baumschule_id = 1"
  )
  console.log(`${pflanzen.length} Einträge aus SecondBrain geladen`)

  // Importieren
  let importCount = 0
  for (const p of pflanzen) {
    const notizenParts: string[] = []
    if (p.qualitaet) notizenParts.push(`Qualität: ${p.qualitaet}`)
    if (p.hoehe_cm) notizenParts.push(`Höhe: ${p.hoehe_cm} cm`)
    if (p.herkunft_code_full) notizenParts.push(`Herkunft: ${p.herkunft_code_full}`)

    await prisma.baumschulPreisliste.create({
      data: {
        baumschuleId: baumschule.id,
        baumart: p.baumart_name_de || "Unbekannt",
        preis: p.preis_per_stueck ? parseFloat(p.preis_per_stueck) : 0,
        einheit: p.einheit || "Stk",
        saison: p.saison || "2025",
        aktiv: p.verfuegbar ?? true,
        notizen: notizenParts.length > 0 ? notizenParts.join(" | ") : null,
        menge: p.mindestmenge ? parseInt(p.mindestmenge) : null,
      },
    })
    importCount++
  }
  console.log(`${importCount} Preislisten-Einträge importiert`)

  // ── 2. Forstliches Vermehrungsgut Deutschland (Referenz) ─────────────────

  console.log("\n=== Forstliches Vermehrungsgut Deutschland (Referenz) ===")

  let fovgBaumschule = await prisma.baumschule.findUnique({
    where: { name: "Forstliches Vermehrungsgut Deutschland (Referenz)" },
  })

  if (fovgBaumschule) {
    console.log(`Existiert bereits: ${fovgBaumschule.id}`)
  } else {
    fovgBaumschule = await prisma.baumschule.create({
      data: {
        name: "Forstliches Vermehrungsgut Deutschland (Referenz)",
        ort: "Deutschland",
        bundesland: null,
        notizen:
          "Wissensbasis zu Baumarten und anerkannten Herkünften nach FoVG. Referenzdaten aus SecondBrain.",
        aktiv: true,
      },
    })
    console.log(`Erstellt: ${fovgBaumschule.id}`)
  }

  // Bestehende Preislisten löschen
  const deletedFovg = await prisma.baumschulPreisliste.deleteMany({
    where: { baumschuleId: fovgBaumschule.id },
  })
  console.log(`${deletedFovg.count} bestehende FoVG-Einträge gelöscht`)

  // FoVG Herkünfte laden (distinct baumart + hkg_bezeichnung, max 200)
  const { rows: herkuenfte } = await sbClient.query(
    "SELECT DISTINCT baumart, hkg_code, hkg_bezeichnung FROM fovg_herkuenfte ORDER BY baumart, hkg_code LIMIT 200"
  )
  console.log(`${herkuenfte.length} FoVG-Herkünfte geladen`)

  let fovgCount = 0
  for (const h of herkuenfte) {
    await prisma.baumschulPreisliste.create({
      data: {
        baumschuleId: fovgBaumschule.id,
        baumart: h.baumart || "Unbekannt",
        preis: 0.0,
        einheit: "Herkunft",
        saison: "2025/2026",
        aktiv: true,
        notizen: `HKG ${h.hkg_code}: ${h.hkg_bezeichnung}`,
      },
    })
    fovgCount++
  }
  console.log(`${fovgCount} FoVG-Referenzeinträge importiert`)

  console.log("\n=== Seed abgeschlossen ===")
}

main()
  .catch((err) => {
    console.error("Fehler:", err)
    process.exit(1)
  })
  .finally(async () => {
    await sbClient.end()
    await prisma.$disconnect()
  })
