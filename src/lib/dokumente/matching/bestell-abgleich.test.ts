/**
 * Tests für DOK-015/016/057 Bestellabgleich (pure Logik, ohne DB).
 * Ausführen: npx tsx src/lib/dokumente/matching/bestell-abgleich.test.ts
 */
import { bewerteBestellungen } from "./bestell-abgleich"

let failed = 0
function check(name: string, ok: boolean, detail?: string) {
  if (ok) console.log(`✅ ${name}`)
  else {
    failed++
    console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`)
  }
}

const bestellungen = [
  { id: "b1", positionen: [{ artikelId: "a1" }, { artikelId: "a2" }] },
  { id: "b2", positionen: [{ artikelId: "a3" }] },
]

// Volltreffer
const r1 = bewerteBestellungen([{ artikelId: "a1", menge: 500 }, { artikelId: "a2", menge: 100 }], bestellungen)
check("Volltreffer → b1, Konfidenz 1", r1.bestellungId === "b1" && r1.konfidenz === 1, JSON.stringify(r1))

// Teilüberlappung
const r2 = bewerteBestellungen([{ artikelId: "a1", menge: 1 }, { artikelId: "a9", menge: 1 }], bestellungen)
check("Teilüberlappung 50% → b1", r2.bestellungId === "b1" && r2.konfidenz === 0.5, JSON.stringify(r2))

// DOK-057: keine Bestellung vorhanden
const r3 = bewerteBestellungen([{ artikelId: "a1", menge: 1 }], [])
check("DOK-057: ohne Bestellung", r3.ohneBestellung === true && r3.grund === "keine Bestellung gefunden", JSON.stringify(r3))

// Keine Überlappung
const r4 = bewerteBestellungen([{ artikelId: "a9", menge: 1 }], bestellungen)
check("Keine Überlappung → ohneBestellung", r4.ohneBestellung === true && r4.bestellungId === null, JSON.stringify(r4))

// Keine gematchten Artikel
const r5 = bewerteBestellungen([{ artikelId: null, menge: 1 }], bestellungen)
check("Keine gematchten Positionen → ohneBestellung", r5.ohneBestellung === true, JSON.stringify(r5))

if (failed > 0) {
  console.error(`\n${failed} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("\nAlle Bestellabgleich-Tests bestanden")
