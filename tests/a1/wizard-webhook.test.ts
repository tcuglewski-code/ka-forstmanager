/**
 * WIZ-02: Unit-Tests für den Wizard-Webhook-Flow (reine Funktionen, keine DB).
 * Lauf: npx tsx tests/a1/wizard-webhook.test.ts
 * Prüft beide Pfade (ang_agent_aktiv=true/false) + Roh-Anfrage-Bau.
 */
import {
  webhookFlowEntscheidung,
  buildRoheAnfrage,
  type WPWizardDaten,
} from "../../src/lib/anfragen/webhook-flow"

let fehler = 0
function assert(bedingung: boolean, name: string) {
  if (bedingung) console.log(`  ✅ ${name}`)
  else {
    console.error(`  ❌ ${name}`)
    fehler++
  }
}

console.log("== WIZ-02: Webhook-Flow ==")

// Pfad 1: Agent INAKTIV → nur Auftrag, kein Angebots-Agent
const flowAus = webhookFlowEntscheidung(false)
assert(flowAus.auftragErstellen === true, "inaktiv: Auftrag wird erstellt (backward-compat)")
assert(flowAus.angebotsAgentTriggern === false, "inaktiv: Angebots-Agent NICHT getriggert")

// Pfad 2: Agent AKTIV → Auftrag + Angebots-Agent
const flowAn = webhookFlowEntscheidung(true)
assert(flowAn.auftragErstellen === true, "aktiv: Auftrag wird (weiterhin) erstellt")
assert(flowAn.angebotsAgentTriggern === true, "aktiv: Angebots-Agent wird getriggert")

console.log("== WIZ-02: buildRoheAnfrage ==")

const wizardDaten: WPWizardDaten = {
  id: 42,
  titel: "Aufforstung Musterwald",
  waldbesitzer: "Max Mustermann",
  email: "max@example.de",
  telefon: "0123",
  flaeche: "2,5",
  standort: "Musterdorf",
  bundesland: "Bayern",
  wizard_typ: "pflanzung",
  wizard_daten: {
    pflanzverband: "2x1m",
    baumarten: "Eiche: 100 Stk., Buche: 50 Stk.",
    schutztyp: [],
    beschreibung: "Steiler Hang",
    lat: 48.1,
    lng: 11.5,
  },
}

const roh = buildRoheAnfrage(wizardDaten)
let parsed: Record<string, unknown> = {}
try {
  parsed = JSON.parse(roh)
} catch {
  /* assert below fängt es */
}
assert(typeof roh === "string" && roh.length > 0, "roheAnfrage ist nicht-leerer String")
assert(parsed.waldbesitzer === "Max Mustermann", "Waldbesitzer übernommen")
assert(parsed.pflanzverband === "2x1m", "Wizard-Detail (pflanzverband) übernommen")
assert(parsed.baumarten === "Eiche: 100 Stk., Buche: 50 Stk.", "Baumarten übernommen")
assert(!("schutztyp" in parsed), "leeres Array (schutztyp) weggelassen")
assert(parsed.lat === 48.1, "Geo-Koordinate übernommen")

// Leere Eingabe → valides leeres JSON ohne Crash
const leer = buildRoheAnfrage({})
assert(leer === "{}", "leere Wizard-Daten → '{}' (kein Crash)")

if (fehler > 0) {
  console.error(`\n❌ ${fehler} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("\n✅ Alle WIZ-02-Tests bestanden")
