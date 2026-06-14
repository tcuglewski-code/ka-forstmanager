/**
 * MAT-019: A2 Zod-Schema + LLM-Parsing Unit-Tests (NEVER #23).
 * Lauf: npx tsx tests/a2/zod.test.ts
 */
import {
  MatInputSpezifikationSchema,
  MatLlmPositionenSchema,
  BestellPositionenSnapshotSchema,
  parseLlmJson,
  safeParseJson,
} from "../../src/lib/material/zod-schemas"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}

console.log("== MatInputSpezifikationSchema Defaults ==")
const leer = MatInputSpezifikationSchema.parse({})
assert(leer.leistungsTyp === "pflanzung", "Default leistungsTyp=pflanzung")
assert(leer.flaecheHa === null, "Default flaecheHa=null")
assert(Array.isArray(leer.baumarten) && leer.baumarten.length === 0, "Default baumarten=[]")
assert(leer.verbissschutz === false && leer.zaun === false, "Default Flags false")
assert(MatInputSpezifikationSchema.safeParse({ flaecheHa: -1 }).success === false, "negative Fläche abgelehnt")

console.log("== parseLlmJson (robust) ==")
const ok1 = parseLlmJson(MatLlmPositionenSchema, '{"positionen":[{"bezeichnung":"Saatgut","menge":5,"einheit":"kg","konfidenz":0.7}]}')
assert(ok1.ok && ok1.data.positionen.length === 1, "valides JSON geparst")
const ok2 = parseLlmJson(MatLlmPositionenSchema, '```json\n{"positionen":[]}\n```')
assert(ok2.ok && ok2.data.positionen.length === 0, "Markdown-Fence entfernt")
const ok3 = parseLlmJson(MatLlmPositionenSchema, 'Hier dein Ergebnis: {"positionen":[{"bezeichnung":"X","menge":1,"einheit":"stueck"}]} fertig.')
assert(ok3.ok && ok3.data.positionen[0].konfidenz === 0.5, "JSON aus Fließtext + konfidenz-Default")
const bad1 = parseLlmJson(MatLlmPositionenSchema, "kein json hier")
assert(!bad1.ok, "Müll-Text → ok:false (kein Crash)")
const bad2 = parseLlmJson(MatLlmPositionenSchema, '{"positionen":[{"bezeichnung":"X","menge":-5,"einheit":"kg"}]}')
assert(!bad2.ok, "negative Menge → Schema-Verstoß (ok:false)")

console.log("== safeParseJson Fallback ==")
assert(safeParseJson(BestellPositionenSnapshotSchema, null, []).length === 0, "null → Fallback []")
assert(safeParseJson(BestellPositionenSnapshotSchema, "kaputt", []).length === 0, "ungültig → Fallback []")
const valid = safeParseJson(BestellPositionenSnapshotSchema, [{ materialPositionId: "p1", bezeichnung: "X", menge: 2, preis: 3 }], [])
assert(valid.length === 1 && valid[0].preis === 3, "valides Array → durchgereicht")

console.log("")
if (fehler > 0) {
  console.error(`❌ ${fehler} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("✅ Alle Zod-Tests bestanden")
