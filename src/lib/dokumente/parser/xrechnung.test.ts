/**
 * Tests für DOK-005 XRechnung/ZUGFeRD-Parser + DOK-055 DACH-USt.
 * Ausführen: npx tsx src/lib/dokumente/parser/xrechnung.test.ts
 */
import { readFileSync } from "fs"
import path from "path"
import { parseXRechnung, XRechnungParseError } from "./xrechnung"
import { validateMwstSatz, pruefeMwstSaetze } from "../compliance/ust-validierung"

let failed = 0
function check(name: string, ok: boolean, detail?: string) {
  if (ok) console.log(`✅ ${name}`)
  else {
    failed++
    console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`)
  }
}

const fixtures = path.join(process.cwd(), "tests", "fixtures", "a3")

// --- UBL (XRechnung) ---
const ubl = parseXRechnung(readFileSync(path.join(fixtures, "xrechnung-sample.xml")))
check("UBL: Syntax erkannt", ubl.syntax === "UBL")
check("UBL: Rechnungsnummer", ubl.rechnungsNr === "RE-2026-0455", ubl.rechnungsNr)
check("UBL: Lieferant", ubl.lieferantName === "Baumschule Müller GmbH", ubl.lieferantName)
check("UBL: USt-ID", ubl.lieferantUstId === "DE123456789")
check("UBL: Land DE", ubl.lieferantLand === "DE")
check("UBL: Gesamtbetrag 1240", ubl.gesamtBetrag === 1240, String(ubl.gesamtBetrag))
check("UBL: Netto 1042", ubl.nettoBetrag === 1042, String(ubl.nettoBetrag))
check("UBL: Währung EUR", ubl.waehrung === "EUR")
check("UBL: 2 Positionen", ubl.positionen.length === 2, String(ubl.positionen.length))
check("UBL: Position 1 Menge 500", ubl.positionen[0].menge === 500)
check("UBL: Position 1 ArtikelNr", ubl.positionen[0].lieferantArtikelNr === "BU-2J-5080")
check("UBL: MwSt 19% gültig (DE)", ubl.mwstGueltig === true, ubl.mwstHinweise.join("; "))
check("UBL: Konfidenz 1.0", ubl.konfidenz === 1.0)

// --- CII (ZUGFeRD) ---
const cii = parseXRechnung(readFileSync(path.join(fixtures, "zugferd-sample.xml")))
check("CII: Syntax erkannt", cii.syntax === "CII")
check("CII: Rechnungsnummer 4711", cii.rechnungsNr === "4711", cii.rechnungsNr)
check("CII: Datum ISO", cii.datum === "2026-06-05", String(cii.datum))
check("CII: Lieferant AT", cii.lieferantName === "Forstbedarf Österreich GmbH")
check("CII: Land AT", cii.lieferantLand === "AT")
check("CII: Gesamtbetrag 360", cii.gesamtBetrag === 360, String(cii.gesamtBetrag))
check("CII: AT 20% gültig (kein False-Flag)", cii.mwstGueltig === true, cii.mwstHinweise.join("; "))
check("CII: 1 Position, Menge 200", cii.positionen.length === 1 && cii.positionen[0].menge === 200)

// --- DACH-USt-Validierung (DOK-055) ---
check("DE: 19 gültig", validateMwstSatz(19, "DE"))
check("DE: 7 gültig", validateMwstSatz(7, "DE"))
check("DE: 0 gültig", validateMwstSatz(0, "DE"))
check("DE: 20 ungültig", !validateMwstSatz(20, "DE"))
check("DE: 16 ungültig", !validateMwstSatz(16, "DE"))
check("AT: 20 gültig", validateMwstSatz(20, "AT"))
check("AT: 13 gültig", validateMwstSatz(13, "AT"))
check("AT: 10 gültig", validateMwstSatz(10, "AT"))
check("AT: 19 ungültig", !validateMwstSatz(19, "AT"))
check("AT: 7 ungültig", !validateMwstSatz(7, "AT"))
check("CH: 8.1 gültig", validateMwstSatz(8.1, "CH"))
check("CH: 2.6 gültig", validateMwstSatz(2.6, "CH"))
check("CH: 3.8 gültig", validateMwstSatz(3.8, "CH"))
check("CH: 7.7 ungültig", !validateMwstSatz(7.7, "CH"))
check("CH: 19 ungültig", !validateMwstSatz(19, "CH"))
check("Land unbekannt: kein False-Flag", pruefeMwstSaetze([19], null).gueltig === true)

// --- Sicherheits-/Fehlerfälle ---
function expectThrow(name: string, xml: string) {
  try {
    parseXRechnung(Buffer.from(xml))
    check(name, false, "kein Fehler geworfen")
  } catch (e) {
    check(name, e instanceof XRechnungParseError, String(e))
  }
}

expectThrow(
  "XXE: DOCTYPE wird abgelehnt",
  `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><Invoice><ID>&xxe;</ID></Invoice>`
)
expectThrow("Ungültiges XML wird abgelehnt", "<Invoice><ID>broken")
expectThrow("Unbekanntes Root-Element wird abgelehnt", "<?xml version=\"1.0\"?><Etwas><ID>1</ID></Etwas>")
expectThrow(
  "Fehlende Pflichtfelder werden abgelehnt",
  `<?xml version="1.0"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"></Invoice>`
)

if (failed > 0) {
  console.error(`\n${failed} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("\nAlle Parser-Tests bestanden")
