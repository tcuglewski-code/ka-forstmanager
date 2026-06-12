/**
 * Tests für DOK-008 Doppelbuchungs-Prüfung.
 * Ausführen (mit DATABASE_URL):
 *   npx tsx src/lib/dokumente/doppelbuchung.test.ts
 *
 * Tests 1-5: pure Normalisierung (ohne DB)
 * Tests 6-8: isDoppelbuchung gegen DB (Testdaten werden angelegt + entfernt)
 */
import { normalisiereRechnungsNr, isDoppelbuchung } from "./doppelbuchung"
import { prisma } from "@/lib/prisma"

let failed = 0
function expectEqual(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`✅ ${name}`)
  } else {
    failed++
    console.error(`❌ ${name}: erwartet ${String(expected)}, erhalten ${String(actual)}`)
  }
}

// 1-5: Normalisierung
expectEqual("Lowercase", normalisiereRechnungsNr("RE-2026-001"), "re2026001")
expectEqual("Leerzeichen entfernt", normalisiereRechnungsNr("RE 2026 001"), "re2026001")
expectEqual("Trim", normalisiereRechnungsNr("  re2026001  "), "re2026001")
expectEqual("Gemischt", normalisiereRechnungsNr(" Re-2026 001 "), "re2026001")
expectEqual("Leerstring", normalisiereRechnungsNr("   "), "")

const TEST_HASH = "a3-doppelbuchung-testlauf"

async function main() {
  // Testdaten anlegen
  await prisma.dokumentenScan.deleteMany({ where: { originalDateiHash: TEST_HASH } })
  await prisma.dokumentenScan.create({
    data: {
      typ: "PDF_RECHNUNG",
      status: "GEBUCHT",
      originalDateiUrl: "file://test",
      originalDateiName: "test.pdf",
      originalDateiHash: TEST_HASH,
      extrahierteDaten: { rechnungsNr: "RE-2026-001" },
      lieferantId: "test-lieferant-a3",
      erstelltVon: "a3-test",
    },
  })
  await prisma.dokumentenScan.create({
    data: {
      typ: "PDF_RECHNUNG",
      status: "ABGELEHNT",
      originalDateiUrl: "file://test",
      originalDateiName: "test2.pdf",
      originalDateiHash: TEST_HASH,
      extrahierteDaten: { rechnungsNr: "RE-9999" },
      erstelltVon: "a3-test",
    },
  })

  // 6: gleiche Nr, andere Schreibweise → true
  expectEqual(
    "Doppel: 're 2026 001' = 'RE-2026-001'",
    await isDoppelbuchung("re 2026 001", "test-lieferant-a3"),
    true
  )

  // 7: unbekannte Nr → false
  expectEqual(
    "Keine Doppelbuchung bei neuer Nr",
    await isDoppelbuchung("RE-2026-002", "test-lieferant-a3"),
    false
  )

  // 8: Status ABGELEHNT zählt nicht als Doppelbuchung
  expectEqual(
    "ABGELEHNT zählt nicht",
    await isDoppelbuchung("RE-9999", null),
    false
  )

  // Cleanup
  await prisma.dokumentenScan.deleteMany({ where: { originalDateiHash: TEST_HASH } })

  if (failed > 0) {
    console.error(`${failed} Test(s) fehlgeschlagen`)
    process.exit(1)
  }
  console.log("Alle Doppelbuchungs-Tests bestanden")
  process.exit(0)
}

main().catch((e) => {
  console.error("Testlauf fehlgeschlagen:", e)
  process.exit(1)
})
