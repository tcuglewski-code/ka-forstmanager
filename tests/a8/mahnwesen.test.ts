/**
 * A8 Rechnungs-Agent — Mahnwesen-Stufen-Unit-Tests (REC-016).
 * Reine Funktionen, keine DB. Lauf: npx tsx tests/a8/mahnwesen.test.ts
 */
import { MAHN_STUFEN, MAHNBARE_STATUS, zielStufe } from "../../src/lib/rechnungen/mahnstufen"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else { console.error(`  ❌ ${name}`); fehler++ }
}

console.log("A8 Mahnwesen-Tests")

// ── Stufendefinition: +7 / +14 / +30, Gebühr 0 / 5 / 15 ─────────────────
assert(MAHN_STUFEN.length === 3, "drei Mahnstufen definiert")
assert(MAHN_STUFEN[0].abTagen === 7 && MAHN_STUFEN[0].gebuehr === 0, "Stufe 1: ab 7 Tagen, Gebühr 0 €")
assert(MAHN_STUFEN[1].abTagen === 14 && MAHN_STUFEN[1].gebuehr === 5, "Stufe 2: ab 14 Tagen, Gebühr 5 €")
assert(MAHN_STUFEN[2].abTagen === 30 && MAHN_STUFEN[2].gebuehr === 15, "Stufe 3: ab 30 Tagen, Gebühr 15 €")

// ── zielStufe: Schwellen exakt ──────────────────────────────────────────
assert(zielStufe(0) === null, "0 Tage überfällig → keine Mahnung")
assert(zielStufe(6) === null, "6 Tage → noch keine Mahnung")
assert(zielStufe(7)?.stufe === 1, "7 Tage → Stufe 1 (Schwelle exakt)")
assert(zielStufe(13)?.stufe === 1, "13 Tage → Stufe 1")
assert(zielStufe(14)?.stufe === 2, "14 Tage → Stufe 2")
assert(zielStufe(29)?.stufe === 2, "29 Tage → Stufe 2")
assert(zielStufe(30)?.stufe === 3, "30 Tage → Stufe 3")
assert(zielStufe(365)?.stufe === 3, "365 Tage → max. Stufe 3 (keine Eskalation darüber)")

// ── Gebühr je Zielstufe ─────────────────────────────────────────────────
assert(zielStufe(7)?.gebuehr === 0, "Stufe 1 Gebühr 0 €")
assert(zielStufe(14)?.gebuehr === 5, "Stufe 2 Gebühr 5 €")
assert(zielStufe(30)?.gebuehr === 15, "Stufe 3 Gebühr 15 €")

// ── Mahnbare Status: bezahlt/storniert NICHT mahnbar ────────────────────
assert(MAHNBARE_STATUS.includes("gesendet"), "gesendet ist mahnbar")
assert(MAHNBARE_STATUS.includes("teilbezahlt"), "teilbezahlt ist mahnbar")
assert(!MAHNBARE_STATUS.includes("bezahlt"), "bezahlt ist NICHT mahnbar")
assert(!MAHNBARE_STATUS.includes("storniert"), "storniert ist NICHT mahnbar")

console.log(fehler === 0 ? "\n✅ Alle Mahnwesen-Tests bestanden" : `\n❌ ${fehler} Test(s) fehlgeschlagen`)
process.exit(fehler === 0 ? 0 : 1)
