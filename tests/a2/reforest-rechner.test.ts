/**
 * MAT-018: A2 Reforest-Rechner Unit-Tests — reine Funktionen, kein DB/LLM.
 * Lauf: npx tsx tests/a2/reforest-rechner.test.ts
 */
import {
  parsePflanzverband,
  berechnePflanzenzahl,
  berechneVerbissschutz,
  berechneZaunlaenge,
  berechnePfahlanzahl,
  berechneSaatgut,
} from "../../src/lib/material/reforest-rechner"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}
function eq(a: number, b: number, name: string) {
  assert(a === b, `${name} (erwartet ${b}, erhalten ${a})`)
}

console.log("== parsePflanzverband ==")
assert(parsePflanzverband("2x1m").x === 2 && parsePflanzverband("2x1m").y === 1, "2x1m → {2,1}")
assert(parsePflanzverband("1,5×1,5").x === 1.5 && parsePflanzverband("1,5×1,5").y === 1.5, "1,5×1,5 → {1.5,1.5}")
assert(parsePflanzverband("1 x 1").x === 1 && parsePflanzverband("1 x 1").y === 1, "1 x 1 → {1,1}")
assert(parsePflanzverband("2*1").x === 2 && parsePflanzverband("2*1").y === 1, "2*1 (Stern) → {2,1}")
assert(parsePflanzverband(null).x === 2 && parsePflanzverband(null).y === 1, "null → Fallback 2x1")
assert(parsePflanzverband("quatsch").x === 2 && parsePflanzverband("quatsch").y === 1, "unlesbar → Fallback 2x1")
assert(parsePflanzverband("0x0").x === 2 && parsePflanzverband("0x0").y === 1, "0x0 → Fallback 2x1")

console.log("== berechnePflanzenzahl ==")
eq(berechnePflanzenzahl(1, 2, 1), 5000, "1ha 2x1")
eq(berechnePflanzenzahl(1, 1, 1), 10000, "1ha 1x1")
eq(berechnePflanzenzahl(1.5, 1.5, 1.5), 6667, "1.5ha 1.5x1.5 (aufgerundet)")
eq(berechnePflanzenzahl(2, 2, 1), 10000, "2ha 2x1")
eq(berechnePflanzenzahl(0, 2, 1), 0, "0ha → 0")
eq(berechnePflanzenzahl(1, 0, 1), 0, "x=0 → 0")
eq(berechnePflanzenzahl(-5, 2, 1), 0, "negative Fläche → 0")

console.log("== berechneVerbissschutz ==")
eq(berechneVerbissschutz(5000), 5250, "5000 +5% Puffer")
eq(berechneVerbissschutz(5000, "spirale", 10), 5500, "5000 +10% Puffer")
eq(berechneVerbissschutz(5000, "einzelschutz", 0), 5000, "5000 +0% Puffer")
eq(berechneVerbissschutz(0), 0, "0 Pflanzen → 0")
eq(berechneVerbissschutz(101, "wuchshuelle", 5), 107, "101 +5% aufgerundet (106.05→107)")

console.log("== berechneZaunlaenge ==")
eq(berechneZaunlaenge(1), 408, "1ha v=1.5 → 408 lm")
eq(berechneZaunlaenge(0), 0, "0ha → 0")
assert(berechneZaunlaenge(4) > berechneZaunlaenge(1), "4ha > 1ha Umfang")

console.log("== berechnePfahlanzahl ==")
eq(berechnePfahlanzahl(408, 3), 137, "408lm / 3m +1")
eq(berechnePfahlanzahl(300, 3), 101, "300lm / 3m +1")
eq(berechnePfahlanzahl(0, 3), 0, "0lm → 0")

console.log("== berechneSaatgut ==")
const eiche = berechneSaatgut(2, "Eiche")
assert(eiche.bekannt && eiche.mengeKg === 50, "Eiche 2ha → 50kg bekannt")
const buche = berechneSaatgut(1, "Buche")
assert(buche.bekannt && buche.mengeKg === 80, "Buche 1ha → 80kg")
const laerche = berechneSaatgut(1, "Lärche")
assert(laerche.bekannt && laerche.mengeKg === 4, "Lärche (Umlaut) → 4kg")
const unbekannt = berechneSaatgut(1, "Mammutbaum")
assert(!unbekannt.bekannt && unbekannt.mengeKg === 0, "unbekannte Baumart → bekannt=false")
const nullFlaeche = berechneSaatgut(0, "Eiche")
assert(!nullFlaeche.bekannt, "Fläche 0 → bekannt=false")
const mitZusatz = berechneSaatgut(1, "Eiche (Stiel)")
assert(mitZusatz.bekannt && mitZusatz.mengeKg === 25, "erstes Wort matched (Eiche ...)")

console.log("")
if (fehler > 0) {
  console.error(`❌ ${fehler} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("✅ Alle Reforest-Rechner-Tests bestanden")
