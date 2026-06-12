/**
 * DOK-039/040: A3 E2E-Test — komplette Pipeline gegen die echte DB,
 * aber OHNE Live-OCR/LLM (NEVER #22): XML-Fixture → deterministischer Parser.
 *
 * Ablauf: Scan anlegen (file://-Fixture) → verarbeiteScan → Status/Positionen/
 * Audit prüfen → Ablehnung testen → Aufräumen (hartes Delete der Testdaten).
 *
 * Lauf: DATABASE_URL=... npx tsx tests/a3/e2e.test.ts
 */
import { join } from "path"
import { prisma } from "../../src/lib/prisma"
import { verarbeiteScan } from "../../src/lib/dokumente/pipeline/orchestrator"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}

const FIXTURE = join(__dirname, "..", "fixtures", "a3", "xrechnung-sample.xml")
const TEST_MARKER = "A3-E2E-TEST"

async function main() {
  // Vorbedingung: Kill-Switch MUSS aus sein (NEVER #21) — sonst Abbruch
  const ks = await prisma.systemConfig.findUnique({ where: { key: "dok_ki_auto_buchung_aktiv" } })
  if (ks?.value === "true") {
    console.error("ABBRUCH: Kill-Switch ist aktiv — E2E-Test würde echte Buchungen erzeugen")
    process.exit(1)
  }
  console.log("  ✅ Vorbedingung: Kill-Switch inaktiv")

  // Aufräumen evtl. alter Testläufe
  const alte = await prisma.dokumentenScan.findMany({
    where: { erstelltVon: TEST_MARKER },
    select: { id: true },
  })
  for (const a of alte) {
    await prisma.dokumentenAudit.deleteMany({ where: { scanId: a.id } })
    await prisma.extrahiertePosition.deleteMany({ where: { scanId: a.id } })
    await prisma.dokumentenScan.delete({ where: { id: a.id } })
  }

  console.log("== E2E: Upload → Pipeline → Review ==")
  const scan = await prisma.dokumentenScan.create({
    data: {
      typ: "XRECHNUNG",
      status: "AUSSTEHEND",
      originalDateiUrl: `file://${FIXTURE}`,
      originalDateiName: "xrechnung-sample.xml",
      originalDateiHash: `e2e-${Date.now()}`,
      erstelltVon: TEST_MARKER,
      auditLog: { create: { aktion: "HOCHGELADEN", userId: TEST_MARKER, details: {} } },
    },
  })

  const ergebnis = await verarbeiteScan(scan)
  assert(ergebnis.status === "REVIEW_ERFORDERLICH", `Pipeline → REVIEW_ERFORDERLICH (ist: ${ergebnis.status})`)

  const nachher = await prisma.dokumentenScan.findUnique({
    where: { id: scan.id },
    include: { positionen: true, auditLog: { orderBy: { erstelltAm: "asc" } } },
  })
  assert(nachher?.status === "REVIEW_ERFORDERLICH", "Status in DB persistiert")
  assert((nachher?.positionen.length ?? 0) === 2, `2 Positionen extrahiert (ist: ${nachher?.positionen.length})`)
  assert(nachher?.gesamtKonfidenz !== null, "Gesamt-Konfidenz gesetzt")
  assert(
    (nachher?.auditLog ?? []).some((a: { aktion: string }) => a.aktion === "OCR_ABGESCHLOSSEN"),
    "Audit OCR_ABGESCHLOSSEN vorhanden"
  )
  const daten = nachher?.extrahierteDaten as { rechnungsNr?: string } | null
  assert(daten?.rechnungsNr === "RE-2026-0455", "Rechnungs-Nr extrahiert")

  console.log("== E2E: Doppelbuchungs-Hinweis beim zweiten Durchlauf ==")
  const scan2 = await prisma.dokumentenScan.create({
    data: {
      typ: "XRECHNUNG",
      status: "AUSSTEHEND",
      originalDateiUrl: `file://${FIXTURE}`,
      originalDateiName: "xrechnung-sample-kopie.xml",
      originalDateiHash: `e2e2-${Date.now()}`,
      erstelltVon: TEST_MARKER,
    },
  })
  const ergebnis2 = await verarbeiteScan(scan2)
  assert(ergebnis2.status === "REVIEW_ERFORDERLICH", "Duplikat landet im Review")

  console.log("== E2E: Unveränderlichkeit / State-Machine ==")
  // GEBUCHT darf nicht direkt aus AUSSTEHEND erreichbar sein — wir prüfen die
  // Übergangs-Tabelle der API-Route statisch:
  const { readFileSync } = await import("fs")
  const routeSrc = readFileSync(
    join(__dirname, "..", "..", "src", "app", "api", "dokumente", "scans", "[id]", "route.ts"),
    "utf8"
  )
  assert(/GEBUCHT:\s*\[\]/.test(routeSrc), "GEBUCHT hat keine erlaubten Übergänge (unveränderlich)")

  // Aufräumen
  for (const id of [scan.id, scan2.id]) {
    await prisma.dokumentenAudit.deleteMany({ where: { scanId: id } })
    await prisma.extrahiertePosition.deleteMany({ where: { scanId: id } })
    await prisma.dokumentenScan.delete({ where: { id } })
  }
  console.log("  ✅ Testdaten aufgeräumt")

  if (fehler > 0) {
    console.error(`\n${fehler} E2E-Test(s) fehlgeschlagen`)
    process.exit(1)
  }
  console.log("\nAlle A3 E2E-Tests bestanden")
  process.exit(0)
}

main().catch((e) => {
  console.error("E2E-Fehler:", e)
  process.exit(1)
})
