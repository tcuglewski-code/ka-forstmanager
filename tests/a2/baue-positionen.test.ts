/**
 * MAT-020: A2 Positions-Erzeugung Unit-Tests (deterministisch, kein DB/LLM).
 * Prüft baueDeterministischePositionen end-to-end ohne Persistenz.
 * Lauf: npx tsx tests/a2/baue-positionen.test.ts
 */
import { baueDeterministischePositionen } from "../../src/lib/material/berechnen"
import { MatInputSpezifikationSchema } from "../../src/lib/material/zod-schemas"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}
const OPTS = { verbissPufferProzent: 5, pfahlAbstandM: 3 }
function spez(p: Record<string, unknown>) {
  return MatInputSpezifikationSchema.parse(p)
}

console.log("== Pflanzung mit Verbiss + Zaun ==")
const r1 = baueDeterministischePositionen(
  spez({ leistungsTyp: "pflanzung", flaecheHa: 1, pflanzverband: "2x1m", verbissschutz: true, zaun: true, baumarten: ["Eiche"] }),
  OPTS
)
const pflanzgut = r1.positionen.find((p) => p.bezeichnung.startsWith("Pflanzgut"))
assert(!!pflanzgut && pflanzgut.menge === 5000, "Pflanzgut 5000 Stück (1ha 2x1)")
const verbiss = r1.positionen.find((p) => p.bezeichnung.startsWith("Verbissschutz"))
assert(!!verbiss && verbiss.menge === 5250, "Verbissschutz 5250 (+5% Puffer)")
const zaun = r1.positionen.find((p) => p.bezeichnung.startsWith("Wildschutzzaun"))
assert(!!zaun && zaun.menge === 408, "Zaun 408 lm")
const pfaehle = r1.positionen.find((p) => p.bezeichnung === "Zaunpfähle")
assert(!!pfaehle && pfaehle.menge === 137, "Zaunpfähle 137")
assert(r1.positionen.every((p) => p.quelle === "FORMEL"), "alle Positionen quelle=FORMEL")

console.log("== Saat: bekannt vs. unbekannt ==")
const r2 = baueDeterministischePositionen(
  spez({ leistungsTyp: "saat", flaecheHa: 2, baumarten: ["Eiche", "Mammutbaum"] }),
  OPTS
)
const saatEiche = r2.positionen.find((p) => p.bezeichnung === "Saatgut Eiche")
assert(!!saatEiche && saatEiche.menge === 50, "Saatgut Eiche 50kg (2ha)")
assert(r2.unbekannteBaumarten.includes("Mammutbaum"), "Mammutbaum als unbekannt markiert")
assert(r2.warnungen.some((w) => w.includes("Mammutbaum")), "Warnung für unbekannte Baumart")

console.log("== Fläche 0 → Warnung, keine Mengen ==")
const r3 = baueDeterministischePositionen(spez({ leistungsTyp: "pflanzung", flaecheHa: 0 }), OPTS)
assert(r3.positionen.length === 0, "keine Positionen bei Fläche 0")
assert(r3.warnungen.some((w) => w.includes("Fläche")), "Warnung wegen fehlender Fläche")

console.log("== Kombination: Pflanzung + Saat zugleich ==")
const r4 = baueDeterministischePositionen(
  spez({ leistungsTyp: "kombination", flaecheHa: 1, pflanzverband: "2x1m", baumarten: ["Buche"] }),
  OPTS
)
assert(r4.positionen.some((p) => p.bezeichnung.startsWith("Pflanzgut")), "Kombination enthält Pflanzgut")
assert(r4.positionen.some((p) => p.bezeichnung === "Saatgut Buche"), "Kombination enthält Saatgut")

console.log("")
if (fehler > 0) {
  console.error(`❌ ${fehler} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("✅ Alle Positions-Tests bestanden")
