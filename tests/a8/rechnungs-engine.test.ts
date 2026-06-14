/**
 * A8 Rechnungs-Agent — MwSt-/Summen-Engine-Unit-Tests (REC-015).
 * Reine Funktionen, keine DB. Lauf: npx tsx tests/a8/rechnungs-engine.test.ts
 */
import { bestimmeMwstSatz, runde2, gruppiereMwst, berechneSummen } from "../../src/lib/rechnungen/mwst-logik"
import type { ExtraktPosition } from "../../src/lib/rechnungen/zod-schemas"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else { console.error(`  ❌ ${name}`); fehler++ }
}

function pos(gesamt: number, mwstSatz: 0 | 7 | 19): ExtraktPosition {
  return {
    beschreibung: "x", menge: 1, einheit: "Stk", einzelpreis: gesamt, gesamt, mwstSatz,
    typ: mwstSatz === 7 ? "leistung" : "material", herkunft: "manuell",
    auftragPositionId: null, angebotPositionId: null,
  }
}

console.log("A8 Rechnungs-Engine-Tests")

// ── bestimmeMwstSatz: §12/§24 UStG-Kontext ──────────────────────────────
assert(bestimmeMwstSatz("leistung") === 7, "Forstdienstleistung = 7 %")
assert(bestimmeMwstSatz("material") === 19, "Material = 19 %")
assert(bestimmeMwstSatz("fahrt") === 19, "Fahrtkosten = 19 %")
assert(bestimmeMwstSatz("leistung", { kleinunternehmer: true }) === 0, "Kleinunternehmer §19 = 0 %")
assert(bestimmeMwstSatz("material", { reverseCharge: true }) === 0, "Reverse-Charge = 0 %")

// ── runde2: kaufmännische Rundung, FP-robust ────────────────────────────
assert(runde2(1.005) === 1.01, "1.005 → 1.01 (kaufmännisch)")
assert(runde2(2.675) === 2.68, "2.675 → 2.68 (FP-robust, nicht 2.67)")
assert(runde2(19.999) === 20, "19.999 → 20.00")

// ── gruppiereMwst: Steuer je Satz auf Netto-Summe (GoBD C52) ────────────
const gruppen = gruppiereMwst([pos(100, 7), pos(100, 7), pos(50, 19)])
assert(gruppen.length === 2, "zwei MwSt-Sätze → zwei Gruppen")
const g7 = gruppen.find((g) => g.satz === 7)!
const g19 = gruppen.find((g) => g.satz === 19)!
assert(g7.netto === 200, "7 %-Gruppe Netto = 200")
assert(g7.steuer === 14, "7 % von 200 = 14,00 (auf Summe gerundet)")
assert(g19.netto === 50, "19 %-Gruppe Netto = 50")
assert(g19.steuer === 9.5, "19 % von 50 = 9,50")
assert(gruppen[0].satz < gruppen[1].satz, "Gruppen aufsteigend nach Satz sortiert")

// ── berechneSummen: Netto/MwSt/Brutto Single Source of Truth ─────────────
const s = berechneSummen([pos(100, 7), pos(50, 19)])
assert(s.nettoGesamt === 150, "Netto gesamt = 150")
assert(s.mwstGesamt === runde2(7 + 9.5), "MwSt gesamt = 16,50")
assert(s.bruttoGesamt === runde2(150 + 16.5), "Brutto = 166,50")

// ── Kleinunternehmer: alles 0 % → Brutto = Netto ────────────────────────
const ku = berechneSummen([pos(100, 0), pos(200, 0)])
assert(ku.mwstGesamt === 0, "KU: keine MwSt")
assert(ku.bruttoGesamt === ku.nettoGesamt, "KU: Brutto = Netto")

console.log(fehler === 0 ? "\n✅ Alle Engine-Tests bestanden" : `\n❌ ${fehler} Test(s) fehlgeschlagen`)
process.exit(fehler === 0 ? 0 : 1)
