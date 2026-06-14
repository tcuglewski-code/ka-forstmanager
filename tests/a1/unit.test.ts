/**
 * ANG-035: A1 Unit-Tests — reine Funktionen, keine DB, keine Live-Calls.
 * Lauf: npx tsx tests/a1/unit.test.ts
 */
import { kalkuliereAngebot } from "../../src/lib/angebote/kalkulation/rechner"
import type { PreisbuchKontext } from "../../src/lib/angebote/kalkulation/preisbuch-query"
import {
  AnfrageSpezifikationSchema,
  parseLlmJson,
  safeParseJson,
  AnfrageSpezifikation,
} from "../../src/lib/angebote/zod-schemas"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}

// ── Test-Fixtures (kein DB-Zugriff) ─────────────────────────────────────────
function fixtureKontext(): PreisbuchKontext {
  const kat = (name: string) => ({ id: `k_${name}`, name, label: name, beschreibung: null, reihenfolge: 1, aktiv: true })
  const eintrag = (id: string, katName: string, bezeichnung: string, einheit: string, basispreis: number, mwstSatz = 19) => ({
    id,
    kategorieId: `k_${katName}`,
    bezeichnung,
    einheit: einheit as never,
    basispreis,
    mwstSatz,
    lieferantTyp: "EIGEN",
    beschreibung: null,
    gueltigVon: null,
    gueltigBis: null,
    aktiv: true,
    reihenfolge: 1,
    metadatenJson: null,
    kategorie: kat(katName),
  })
  return {
    kategorien: [kat("aufforstung"), kat("pflanzgut"), kat("verbissschutz"), kat("zaunbau"), kat("anfahrt")] as never,
    eintraege: [
      eintrag("e_pflanzung", "aufforstung", "Pflanzung Laubholz Standard", "stueck", 0.85),
      eintrag("e_eiche", "pflanzgut", "Stiel-Eiche 1+0 (50-80cm)", "stueck", 0.95, 7),
      eintrag("e_huelle", "verbissschutz", "Wuchshülle Einzelschutz (120cm)", "stueck", 1.8),
      eintrag("e_montage", "verbissschutz", "Montage Einzelschutz", "stueck", 0.9),
      eintrag("e_zaun", "zaunbau", "Rehwildschutzzaun (Knotengeflecht 1,60m)", "lm", 8.5),
      eintrag("e_anfahrt", "anfahrt", "Anfahrtspauschale (<50km)", "pauschale", 150),
    ] as never,
    aufschlaege: [
      { id: "a_steil", eintragId: null, name: "Steilhang 25-35%", typ: "steilheit", bedingung: { min: 25, max: 35 }, faktor: 0.3, beschreibung: null, aktiv: true, reihenfolge: 1 },
      { id: "a_menge", eintragId: null, name: "Mengenrabatt >10ha", typ: "menge", bedingung: { min: 10, max: 99999 }, faktor: -0.05, beschreibung: null, aktiv: true, reihenfolge: 2 },
      { id: "a_sub", eintragId: null, name: "Subunternehmer", typ: "subunternehmer", bedingung: { wert: "fremdleistung" }, faktor: 0.25, beschreibung: null, aktiv: true, reihenfolge: 3 },
    ] as never,
    templates: [
      {
        id: "t_laub",
        name: "Erstaufforstung Laubholz",
        beschreibung: null,
        leistungsTyp: "erstaufforstung_laub",
        positionenJson: [
          { kategorieName: "pflanzgut", eintragName: "Stiel-Eiche 1+0 (50-80cm)", mengenFormel: "baumanzahl", optional: false },
          { kategorieName: "aufforstung", eintragName: "Pflanzung Laubholz Standard", mengenFormel: "baumanzahl", optional: false },
          { kategorieName: "verbissschutz", eintragName: "Wuchshülle Einzelschutz (120cm)", mengenFormel: "baumanzahl", optional: true },
          { kategorieName: "zaunbau", eintragName: "Rehwildschutzzaun (Knotengeflecht 1,60m)", mengenFormel: "zaunlaenge", optional: true },
          { kategorieName: "anfahrt", eintragName: "Anfahrtspauschale (<50km)", mengenFormel: "1", optional: false },
        ],
        berechnungsLogikJson: {},
        reihenfolge: 1,
        aktiv: true,
      },
    ] as never,
  }
}

function spez(over: Partial<AnfrageSpezifikation> = {}): AnfrageSpezifikation {
  return AnfrageSpezifikationSchema.parse({
    leistungsTyp: "erstaufforstung_laub",
    flaeche: 1,
    baumarten: ["Eiche"],
    region: "Kassel",
    steilheit: null,
    entfernungKm: null,
    verbissschutz: false,
    zaun: false,
    budgetEur: null,
    konfidenz: 0.9,
    ...over,
  })
}

console.log("== Kalkulations-Engine ==")
{
  const k = fixtureKontext()
  const r = kalkuliereAngebot(spez(), k)
  // 1 ha × 2500 Stk/ha → Eiche + Pflanzung je 2500; Wuchshülle nur bei verbissschutz; Anfahrt 1
  assert(r.details.positionen.length === 3, "Basis ohne Schutz: Eiche+Pflanzung+Anfahrt = 3 Positionen")
  assert(r.details.gesamtNetto > 0, "Nettobetrag > 0")
  const eiche = r.details.positionen.find((p) => p.bezeichnung.includes("Eiche"))
  assert(eiche?.menge === 2500, "Baumanzahl = flaeche × 2500")
  assert(eiche?.preisbuchId === "e_eiche", "Position referenziert echte preisbuchId (Anti-Halluzination)")
  assert(r.details.positionen.every((p) => p.quelle === "preisbuch"), "alle Positionen quelle=preisbuch")
}
{
  const k = fixtureKontext()
  const r = kalkuliereAngebot(spez({ verbissschutz: true, zaun: true }), k)
  assert(r.details.positionen.some((p) => p.bezeichnung.includes("Wuchshülle")), "Verbissschutz aktiviert Wuchshülle")
  assert(r.details.positionen.some((p) => p.bezeichnung.toLowerCase().includes("zaun")), "Zaun aktiviert Zaunposition")
}
{
  // Steilhang-Aufschlag multiplikativ
  const k = fixtureKontext()
  const ohne = kalkuliereAngebot(spez(), k).details.gesamtNetto
  const mit = kalkuliereAngebot(spez({ steilheit: 30 }), k).details.gesamtNetto
  assert(mit > ohne, "Steilhang 30% erhöht Netto (Aufschlag wirkt)")
}
{
  // Kein Template → leeres Ergebnis mit Warnung, kein Crash
  const k = fixtureKontext()
  const r = kalkuliereAngebot(spez({ leistungsTyp: "saatgut" }), k)
  assert(r.details.positionen.length === 0 && r.details.warnungen.length > 0, "Kein Template → Warnung statt Crash")
}

console.log("== Zod-Schutz (NEVER #23) ==")
{
  const bad = parseLlmJson(AnfrageSpezifikationSchema, "kein json hier")
  assert(bad.ok === false, "ungültiger LLM-Text → { ok:false } statt Crash")
  const fenced = parseLlmJson(AnfrageSpezifikationSchema, '```json\n{"leistungsTyp":"kulturpflege","flaeche":2,"region":null,"steilheit":null,"entfernungKm":null,"budgetEur":null}\n```')
  assert(fenced.ok === true, "Markdown-Fences werden entfernt + geparst")
  const fb = safeParseJson(AnfrageSpezifikationSchema, { kaputt: true }, null)
  assert(fb === null, "safeParseJson liefert Fallback bei ungültigem Wert")
}

console.log("")
if (fehler > 0) {
  console.error(`❌ ${fehler} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("✅ Alle A1 Unit-Tests bestanden")
