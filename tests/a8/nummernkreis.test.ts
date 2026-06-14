/**
 * A8 Rechnungs-Agent — Nummernkreis-Unit-Tests (REC-014).
 * Reine Funktionen, keine DB. Lauf: npx tsx tests/a8/nummernkreis.test.ts
 */
import { RechnungsnummerSchema, lockKey, findeLuecken } from "../../src/lib/rechnungen/nummernkreis"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else { console.error(`  ❌ ${name}`); fehler++ }
}

async function run() {
  console.log("A8 Nummernkreis-Tests")

  // ── Format-Validierung ──────────────────────────────────────────────
  assert(RechnungsnummerSchema.safeParse("RE-2026-0001").success, "RE-2026-0001 ist gültig")
  assert(RechnungsnummerSchema.safeParse("RE-2026-1234").success, "RE-2026-1234 ist gültig")
  assert(RechnungsnummerSchema.safeParse("RE-2026-12345").success, "5-stellige Laufnummer gültig (Überlauf)")
  assert(!RechnungsnummerSchema.safeParse("RE-2026-1").success, "RE-2026-1 ungültig (zu kurz)")
  assert(!RechnungsnummerSchema.safeParse("2026-0001").success, "ohne RE-Prefix ungültig")
  assert(!RechnungsnummerSchema.safeParse("RG-2026-0001").success, "falscher Prefix ungültig")
  assert(!RechnungsnummerSchema.safeParse("").success, "leer ungültig")

  // ── lockKey: jahresscharf (Jahrswechsel = eigener Zähler) ────────────
  assert(lockKey(2026) === "rechnungsnummer_lock_2026", "lockKey 2026 korrekt")
  assert(lockKey(2027) === "rechnungsnummer_lock_2027", "lockKey 2027 korrekt")
  assert(lockKey(2026) !== lockKey(2027), "Jahrswechsel → separater Zähler (lückenlos je Jahr)")

  // ── findeLuecken: Diagnose-Funktion ─────────────────────────────────
  const fakePrisma = (nummern: string[]) => ({
    rechnung: { findMany: async () => nummern.map((n) => ({ nummer: n })) },
  })

  const ohneLuecke = await findeLuecken(fakePrisma(["RE-2026-0001", "RE-2026-0002", "RE-2026-0003"]), 2026)
  assert(ohneLuecke.length === 0, "lückenlose Folge → keine Lücken")

  const mitLuecke = await findeLuecken(fakePrisma(["RE-2026-0001", "RE-2026-0003", "RE-2026-0005"]), 2026)
  assert(JSON.stringify(mitLuecke) === JSON.stringify([2, 4]), "Lücken 2 und 4 erkannt")

  const leer = await findeLuecken(fakePrisma([]), 2026)
  assert(leer.length === 0, "keine Rechnungen → keine Lücken")

  const nurFremdjahr = await findeLuecken(fakePrisma(["RE-2026-0001", "RE-2026-0002"]), 2027)
  assert(nurFremdjahr.length === 0, "anderes Jahr → keine Lücken im Zieljahr")

  console.log(fehler === 0 ? "\n✅ Alle Nummernkreis-Tests bestanden" : `\n❌ ${fehler} Test(s) fehlgeschlagen`)
  process.exit(fehler === 0 ? 0 : 1)
}

run()
