/**
 * Tests für DOK-007 Konfidenz-Routing.
 * Ausführen: npx tsx src/lib/dokumente/konfidenz-routing.test.ts
 */
import { routeDocument, DEFAULT_ROUTING_CONFIG } from "./konfidenz-routing"

let failed = 0
function expectAction(name: string, actual: { action: string; grund: string }, expected: string) {
  if (actual.action === expected) {
    console.log(`✅ ${name} (${actual.grund})`)
  } else {
    failed++
    console.error(`❌ ${name}: erwartet ${expected}, erhalten ${actual.action} — ${actual.grund}`)
  }
}

// 1: alles hoch, EUR, kein Sonderfall → AUTO_BUCHEN
expectAction(
  "Alle Konfidenzen hoch → AUTO_BUCHEN",
  routeDocument({ typ: "PDF_RECHNUNG", feldKonfidenzen: [0.95, 0.9, 0.99], waehrung: "EUR", bruttoBetrag: 120 }),
  "AUTO_BUCHEN"
)

// 2: eine Konfidenz unter high → REVIEW
expectAction(
  "Konfidenz 0.7 → REVIEW",
  routeDocument({ typ: "PDF_RECHNUNG", feldKonfidenzen: [0.95, 0.7], waehrung: "EUR", bruttoBetrag: 100 }),
  "REVIEW"
)

// 3: Konfidenz unter low → ABGELEHNT
expectAction(
  "Konfidenz 0.4 → ABGELEHNT",
  routeDocument({ typ: "PDF_RECHNUNG", feldKonfidenzen: [0.95, 0.4], waehrung: "EUR" }),
  "ABGELEHNT"
)

// 4: Gutschrift immer REVIEW, auch bei hoher Konfidenz
expectAction(
  "Gutschrift → REVIEW",
  routeDocument({ typ: "GUTSCHRIFT", feldKonfidenzen: [0.99], waehrung: "EUR", bruttoBetrag: 50 }),
  "REVIEW"
)

// 5: Fremdwährung → REVIEW
expectAction(
  "USD → REVIEW",
  routeDocument({ typ: "PDF_RECHNUNG", feldKonfidenzen: [0.99], waehrung: "USD", bruttoBetrag: 50 }),
  "REVIEW"
)

// 6: Betrag ≥ 500 → REVIEW (Vier-Augen)
expectAction(
  "Betrag 500 → REVIEW",
  routeDocument({ typ: "PDF_RECHNUNG", feldKonfidenzen: [0.99], waehrung: "EUR", bruttoBetrag: 500 }),
  "REVIEW"
)

// 7: Doppelbuchung → REVIEW
expectAction(
  "Doppelbuchung → REVIEW",
  routeDocument({ typ: "PDF_RECHNUNG", feldKonfidenzen: [0.99], waehrung: "EUR", bruttoBetrag: 50, istDoppelbuchung: true }),
  "REVIEW"
)

// 8: keine Konfidenzen → REVIEW
expectAction(
  "Keine Konfidenzen → REVIEW",
  routeDocument({ typ: "PDF_RECHNUNG", waehrung: "EUR" }),
  "REVIEW"
)

// Bonus: eigene Config (höhere Vier-Augen-Grenze)
expectAction(
  "Custom Config: Betrag 600 bei Grenze 1000 → AUTO_BUCHEN",
  routeDocument(
    { typ: "PDF_RECHNUNG", feldKonfidenzen: [0.99], waehrung: "EUR", bruttoBetrag: 600 },
    { ...DEFAULT_ROUTING_CONFIG, vierAugenBetrag: 1000 }
  ),
  "AUTO_BUCHEN"
)

if (failed > 0) {
  console.error(`${failed} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("Alle Routing-Tests bestanden")
