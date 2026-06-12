/**
 * Tests für DOK-012-014 Artikel-Matcher (deterministische Stufen, ohne DB/LLM).
 * Ausführen: npx tsx src/lib/dokumente/matching/artikel-matcher.test.ts
 */
import { matchAusListe, levenshtein, aehnlichkeit, type MatchKandidatArtikel } from "./artikel-matcher"

let failed = 0
function check(name: string, ok: boolean, detail?: string) {
  if (ok) console.log(`✅ ${name}`)
  else {
    failed++
    console.error(`❌ ${name}${detail ? ` — ${detail}` : ""}`)
  }
}

const artikel: MatchKandidatArtikel[] = [
  {
    id: "a1",
    name: "Rotbuche 2j. 50-80 vS",
    artikelnummer: "RB-001",
    lieferantBestellnummer: "BU-2J-5080",
    einheit: "Stück",
    aliasse: ["Buche 2j 50-80"],
  },
  {
    id: "a2",
    name: "Verbissschutz-Spirale 60 cm",
    artikelnummer: "VS-060",
    lieferantBestellnummer: null,
    einheit: "Stück",
    aliasse: [],
  },
  {
    id: "a3",
    name: "Tonkinstab 120 cm",
    artikelnummer: "TK-120",
    lieferantBestellnummer: null,
    einheit: "Stück",
    aliasse: [],
  },
]

// Levenshtein-Basics
check("levenshtein identisch = 0", levenshtein("abc", "abc") === 0)
check("levenshtein 1 Edit", levenshtein("abc", "abd") === 1)
check("aehnlichkeit identisch = 1", aehnlichkeit("Buche", "Buche") === 1)

// Exakt: Lieferanten-Artikelnummer
const m1 = matchAusListe("irgendwas", "BU-2J-5080", artikel)
check("Exakt via lieferantBestellnummer", m1.status === "EXAKT" && m1.artikelId === "a1", JSON.stringify(m1))

// Exakt: Name (case-insensitive)
const m2 = matchAusListe("rotbuche 2j. 50-80 vs", null, artikel)
check("Exakt via Name", m2.status === "EXAKT" && m2.artikelId === "a1", JSON.stringify(m2))

// Exakt: gelernter Alias (US-8)
const m3 = matchAusListe("Buche 2j 50-80", null, artikel)
check("Exakt via Alias", m3.status === "EXAKT" && m3.artikelId === "a1", JSON.stringify(m3))

// Fuzzy: Tippfehler/Variante
const m4 = matchAusListe("Verbisschutz Spirale 60cm", null, artikel)
check("Fuzzy-Match Spirale", m4.status === "FUZZY" && m4.artikelId === "a2", JSON.stringify(m4))

// Fuzzy: Tonkinstäbe (Plural/Umlaut)
const m5 = matchAusListe("Tonkinstäbe 120 cm", null, artikel)
check("Fuzzy-Match Tonkinstab", m5.artikelId === "a3" && m5.konfidenz >= 0.7, JSON.stringify(m5))

// Kein Match
const m6 = matchAusListe("Motorsäge MS 261", null, artikel)
check("Kein Match → UNBEKANNT", m6.status === "UNBEKANNT" && m6.artikelId === null, JSON.stringify(m6))

// Leere Liste
const m7 = matchAusListe("Buche", null, [])
check("Leere Artikelliste → UNBEKANNT", m7.status === "UNBEKANNT")

if (failed > 0) {
  console.error(`\n${failed} Test(s) fehlgeschlagen`)
  process.exit(1)
}
console.log("\nAlle Matcher-Tests bestanden")
