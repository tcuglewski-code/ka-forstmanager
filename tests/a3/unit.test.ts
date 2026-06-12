/**
 * DOK-035/036: A3 Unit-Tests — reine Funktionen, keine DB, keine Live-Calls.
 * Lauf: npx tsx tests/a3/unit.test.ts
 */
import { readFileSync } from "fs"
import { join } from "path"
import { routeDocument, DEFAULT_ROUTING_CONFIG } from "../../src/lib/dokumente/konfidenz-routing"
import { erkenneDokTyp } from "../../src/lib/dokumente/typ-erkennung"
import { normalisiereRechnungsNr } from "../../src/lib/dokumente/doppelbuchung"
import { validateMwstSatz, landAusUstId } from "../../src/lib/dokumente/compliance/ust-validierung"
import { parseXRechnung } from "../../src/lib/dokumente/parser/xrechnung"
import { matchAusListe, aehnlichkeit } from "../../src/lib/dokumente/matching/artikel-matcher"
import { validiereDatei } from "../../src/lib/dokumente/file-validator"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}

const FIXTURES = join(__dirname, "..", "fixtures", "a3")

console.log("== Konfidenz-Routing ==")
{
  const r1 = routeDocument({ typ: "XRECHNUNG", feldKonfidenzen: [0.95, 0.99], bruttoBetrag: 100 })
  assert(r1.action === "AUTO_BUCHEN", "hohe Konfidenz + kleiner Betrag → AUTO_BUCHEN")
  const r2 = routeDocument({ typ: "XRECHNUNG", feldKonfidenzen: [0.7], bruttoBetrag: 100 })
  assert(r2.action === "REVIEW", "mittlere Konfidenz → REVIEW")
  const r3 = routeDocument({ typ: "XRECHNUNG", feldKonfidenzen: [0.3] })
  assert(r3.action === "ABGELEHNT", "sehr niedrige Konfidenz → ABGELEHNT")
  const r4 = routeDocument({ typ: "XRECHNUNG", feldKonfidenzen: [0.99], bruttoBetrag: 9999 })
  assert(r4.action === "REVIEW", "Vier-Augen: Betrag ≥ 500 → REVIEW")
  const r5 = routeDocument({ typ: "GUTSCHRIFT", feldKonfidenzen: [0.99], bruttoBetrag: 10 })
  assert(r5.action === "REVIEW", "GUTSCHRIFT immer REVIEW")
  const r6 = routeDocument({ typ: "XRECHNUNG", feldKonfidenzen: [0.99], bruttoBetrag: 10, istDoppelbuchung: true })
  assert(r6.action === "REVIEW", "Doppelbuchung → REVIEW")
  const r7 = routeDocument({ typ: "XRECHNUNG", feldKonfidenzen: [0.99], bruttoBetrag: 10, waehrung: "CHF" })
  assert(r7.action === "REVIEW", "Fremdwährung → REVIEW")
  const r8 = routeDocument({ typ: "XRECHNUNG", feldKonfidenzen: [] })
  assert(r8.action === "REVIEW", "keine Konfidenzen → REVIEW (Fail-Closed)")
  assert(DEFAULT_ROUTING_CONFIG.schwelleHigh === 0.85 && DEFAULT_ROUTING_CONFIG.schwelleLow === 0.6, "Default-Schwellen 0.85/0.60")
}

console.log("== Typ-Erkennung ==")
{
  const xml = readFileSync(join(FIXTURES, "xrechnung-sample.xml"))
  assert(erkenneDokTyp(xml, "rechnung.xml") === "XRECHNUNG", "XML → XRECHNUNG")
  assert(erkenneDokTyp(Buffer.from("%PDF-1.7 foo"), "x.pdf") === "PDF_RECHNUNG", "PDF ohne XML → PDF_RECHNUNG")
  assert(erkenneDokTyp(Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0]), "foto.jpg") === "UNBEKANNT", "Bild ohne Text → UNBEKANNT")
}

console.log("== Doppelbuchung-Normalisierung ==")
{
  assert(normalisiereRechnungsNr("RE-2026/0455") === normalisiereRechnungsNr("re 2026 0455"), "Normalisierung ignoriert Trennzeichen/Case")
}

console.log("== DACH-USt ==")
{
  assert(validateMwstSatz(19, "DE") && validateMwstSatz(7, "DE"), "DE 19/7 gültig")
  assert(!validateMwstSatz(20, "DE"), "DE 20 ungültig")
  assert(validateMwstSatz(20, "AT") && validateMwstSatz(8.1, "CH"), "AT 20 / CH 8.1 gültig")
  assert(landAusUstId("ATU12345678") === "AT" && landAusUstId("DE123456789") === "DE" && landAusUstId("CHE-123.456.789") === "CH", "Land aus USt-ID")
}

console.log("== XRechnung-Parser (Fixtures) ==")
{
  const ubl = parseXRechnung(readFileSync(join(FIXTURES, "xrechnung-sample.xml")))
  assert(ubl.rechnungsNr === "RE-2026-0455", "UBL Rechnungs-Nr")
  assert(ubl.positionen.length === 2, "UBL 2 Positionen")
  const cii = parseXRechnung(readFileSync(join(FIXTURES, "zugferd-sample.xml")))
  assert(cii.rechnungsNr === "4711", "CII Rechnungs-Nr")
  assert(cii.lieferantUstId === "ATU12345678", "CII USt-ID")
}

console.log("== Artikel-Matching (deterministisch) ==")
{
  const artikel = [
    { id: "a1", name: "Rotbuche 2j. 50-80", artikelnummer: "RB-5080", lieferantBestellnummer: null, einheit: "Stück", aliasse: ["Rotbuchen Setzling 50-80"] },
    { id: "a2", name: "Verbissschutz-Spirale", artikelnummer: null, lieferantBestellnummer: "VS-100", einheit: "Stück", aliasse: [] },
  ]
  assert(matchAusListe("irgendwas", "rb-5080", artikel).status === "EXAKT", "Artikelnummer exakt (case-insensitive)")
  assert(matchAusListe("Rotbuchen Setzling 50-80", null, artikel).status === "EXAKT", "Alias exakt")
  const fuzzy = matchAusListe("Verbissschutz Spirale gross", null, artikel)
  assert(fuzzy.status === "FUZZY" && fuzzy.artikelId === "a2", "Fuzzy-Match ≥ 0.7")
  assert(matchAusListe("Diesel 200L Fass", null, artikel).status === "UNBEKANNT", "kein Treffer → UNBEKANNT")
  assert(aehnlichkeit("Müller", "Mueller") === 1, "Umlaut-Normalisierung")
}

console.log("== File-Validator (Positivfälle) ==")
{
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj\nendobj\n%%EOF")
  assert(validiereDatei(pdf, "rechnung.pdf").ok, "sauberes PDF ok")
  const xml = readFileSync(join(FIXTURES, "xrechnung-sample.xml"))
  assert(validiereDatei(xml, "rechnung.xml").ok, "XRechnung-XML ok")
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])
  assert(validiereDatei(png, "scan.png").ok, "PNG ok")
}

if (fehler > 0) {
  console.error(`\n${fehler} Unit-Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("\nAlle A3 Unit-Tests bestanden")
