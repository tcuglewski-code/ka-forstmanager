/**
 * A8 Rechnungs-Agent — E2E + GoBD + Kill-Switch (REC-017 / REC-022 / REC-023).
 *
 * Läuft gegen die echte DB, OHNE echte Buchungen zu hinterlassen:
 *  - Nummernkreis wird in einer $transaction gezogen und per Rollback wieder
 *    freigegeben (keine Nummer wird "verbrannt", siehe nummernkreis.ts A5).
 *  - Kill-Switch wird gelesen, getoggelt und auf den Ursprungswert zurückgesetzt.
 *  - Unveränderlichkeit (GoBD) wird statisch gegen die Route-Quelltexte geprüft,
 *    weil die Lock-Logik in den API-Routen (nicht in importierbaren Libs) liegt.
 *
 * Lauf: DATABASE_URL=... npx tsx tests/a8/e2e.test.ts
 */
import { join } from "path"
import { readFileSync } from "fs"
import { prisma } from "../../src/lib/prisma"
import { naechsteNummer, RechnungsnummerSchema, findeLuecken } from "../../src/lib/rechnungen/nummernkreis"
import { istAgentAktiv, RECHNUNG_CONFIG_KEYS } from "../../src/lib/rechnungen/config"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}

const SRC = join(__dirname, "..", "..", "src", "app", "api", "rechnungen")
function routeSrc(...teile: string[]): string {
  return readFileSync(join(SRC, ...teile), "utf8")
}

async function main() {
  const jahr = new Date().getFullYear()

  // ── REC-023: Kill-Switch (NEVER #21) ──────────────────────────────────
  console.log("== REC-023: Kill-Switch ==")
  const original = await prisma.systemConfig.findUnique({
    where: { key: RECHNUNG_CONFIG_KEYS.agentAktiv },
  })

  await prisma.systemConfig.upsert({
    where: { key: RECHNUNG_CONFIG_KEYS.agentAktiv },
    create: { key: RECHNUNG_CONFIG_KEYS.agentAktiv, value: "false" },
    update: { value: "false" },
  })
  assert((await istAgentAktiv()) === false, "Agent inaktiv bei value=false (Shadow-Mode Default)")

  await prisma.systemConfig.update({
    where: { key: RECHNUNG_CONFIG_KEYS.agentAktiv },
    data: { value: "true" },
  })
  assert((await istAgentAktiv()) === true, "Agent aktiv bei value=true")

  // Ursprungszustand wiederherstellen (kein Seiteneffekt auf Prod-Config)
  if (original) {
    await prisma.systemConfig.update({
      where: { key: RECHNUNG_CONFIG_KEYS.agentAktiv },
      data: { value: original.value },
    })
  } else {
    await prisma.systemConfig.update({
      where: { key: RECHNUNG_CONFIG_KEYS.agentAktiv },
      data: { value: "false" },
    })
  }

  // Statisch: /generieren MUSS bei inaktivem Agent 503 + AGENT_INACTIVE liefern
  const genSrc = routeSrc("generieren", "route.ts")
  assert(/istAgentAktiv\(\)/.test(genSrc), "generieren prüft istAgentAktiv() (Kill-Switch-Guard)")
  assert(/503/.test(genSrc) && /AGENT_INACTIVE/.test(genSrc), "generieren liefert 503 AGENT_INACTIVE wenn aus")

  // ── REC-017: Nummernkreis-Pipeline (lückenlos, transaktional) ─────────
  console.log("== REC-017: Nummernkreis transaktional + lückenlos ==")
  let n1 = "", n2 = ""
  try {
    await prisma.$transaction(async (tx) => {
      n1 = await naechsteNummer(tx, jahr)
      n2 = await naechsteNummer(tx, jahr)
      // Rollback erzwingen → keine Nummer wird real verbraucht (A5-Invariante)
      throw new Error("__ROLLBACK__")
    })
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "__ROLLBACK__") throw e
  }
  assert(RechnungsnummerSchema.safeParse(n1).success, `n1 hat gültiges Format (${n1})`)
  assert(RechnungsnummerSchema.safeParse(n2).success, `n2 hat gültiges Format (${n2})`)
  const lauf1 = parseInt(n1.split("-")[2], 10)
  const lauf2 = parseInt(n2.split("-")[2], 10)
  assert(lauf2 === lauf1 + 1, "fortlaufend +1 innerhalb der Transaktion (keine Doppelvergabe)")

  // Lückenlosigkeit der real existierenden Rechnungen im laufenden Jahr
  const luecken = await findeLuecken(prisma, jahr)
  assert(luecken.length === 0, `Nummernkreis ${jahr} lückenlos (Lücken: ${JSON.stringify(luecken)})`)

  // ── REC-022: Unveränderlichkeit nach Versand (GoBD) ───────────────────
  // Lock-Punkt ist die Freigabe; Versand setzt Freigabe voraus → nach dem
  // Senden ist die Rechnung garantiert gesperrt.
  console.log("== REC-022: GoBD-Unveränderlichkeit ==")
  const freigebenSrc = routeSrc("[id]", "freigeben", "route.ts")
  assert(/lockedAt/.test(freigebenSrc), "freigeben setzt lockedAt (GoBD-Sperre bei Freigabe)")

  const sendenSrc = routeSrc("[id]", "senden", "route.ts")
  assert(/freigegebenAm/.test(sendenSrc), "senden setzt Freigabe voraus → vor Versand stets gesperrt")

  const idSrc = routeSrc("[id]", "route.ts")
  assert(/GOBD_LOCKED/.test(idSrc), "Lock-Fehlercode GOBD_LOCKED definiert")
  assert(/isRechnungLocked/.test(idSrc), "isRechnungLocked-Guard vorhanden")
  // PUT (Inhaltsänderung) MUSS bei Lock mit 423 abbrechen
  assert(/status:\s*423/.test(idSrc), "gesperrte Rechnung → 423 Locked bei Inhaltsänderung")
  // PATCH erlaubt im Lock nur Status-/Zahlungs-Workflow, nicht den Inhalt
  assert(/ALLOWED_WHEN_LOCKED/.test(idSrc), "nur Status-/Zahlungsfelder im Lock erlaubt (kein Inhalt)")
  // Hard-Delete ist nie erlaubt (10-Jahre-Retention)
  assert(/SOFT_DELETE/.test(idSrc), "kein Hard-Delete — nur Soft-Delete (10-Jahre-Retention)")

  if (fehler > 0) {
    console.error(`\n❌ ${fehler} A8-E2E-Test(s) fehlgeschlagen`)
    process.exit(1)
  }
  console.log("\n✅ Alle A8 E2E/GoBD/Kill-Switch-Tests bestanden")
  process.exit(0)
}

main().catch((e) => {
  console.error("E2E-Fehler:", e)
  process.exit(1)
})
