/**
 * WP ↔ ForstManager API-Sync Test
 * Sprint AN — Koch Aufforstung GmbH
 *
 * Testet die WordPress REST API Endpunkte auf Erreichbarkeit und
 * korrekte Antworten für die Synchronisation mit dem ForstManager.
 *
 * Verwendung: npx tsx scripts/test-wp-api-sync.ts
 */

// Typen für Testergebnisse
interface TestErgebnis {
  endpoint: string
  status: number | null
  erfolg: boolean
  dauer_ms: number
  fehler?: string
  antwort_vorschau?: string
  content_type?: string
}

// ── WordPress REST API Endpunkte ─────────────────────────────────────────────

const ENDPUNKTE = [
  {
    url: "https://peru-otter-113714.hostingersite.com/wp-json/ka/v1/projekte-karte",
    beschreibung: "KA Custom: Projektkarte (Aufforstungsprojekte für Karten-Widget)",
    erwartet: 200,
  },
  {
    url: "https://peru-otter-113714.hostingersite.com/wp-json/ka/v1/wizard-event",
    beschreibung: "KA Custom: Wizard-Event (Fördermittel-Wizard, POST-only → 404 bei GET erwartet)",
    erwartet: 404, // Dieser Endpunkt akzeptiert nur POST — 404 bei GET ist korrekt
  },
  {
    url: "https://peru-otter-113714.hostingersite.com/wp-json/wp/v2/posts",
    beschreibung: "WP Standard: Posts (Neuigkeiten / Blog)",
    erwartet: 200,
  },
  {
    url: "https://peru-otter-113714.hostingersite.com/wp-json/",
    beschreibung: "WP REST API Root (Verfügbare Namespaces prüfen)",
    erwartet: 200,
  },
  {
    url: "https://peru-otter-113714.hostingersite.com/wp-json/wp/v2/pages",
    beschreibung: "WP Standard: Seiten",
    erwartet: 200,
  },
]

// ── Test-Funktion ────────────────────────────────────────────────────────────

async function testeEndpoint(
  url: string,
  beschreibung: string,
  erwartet: number
): Promise<TestErgebnis> {
  const start = Date.now()

  try {
    const antwort = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "ForstManager-API-Test/1.0 (Koch Aufforstung GmbH)",
      },
      signal: AbortSignal.timeout(10000), // 10 Sekunden Timeout
    })

    const dauer = Date.now() - start
    const contentType = antwort.headers.get("content-type") || ""
    let antwortText = ""

    try {
      const text = await antwort.text()
      // Vorschau: erste 200 Zeichen
      antwortText = text.substring(0, 200).replace(/\s+/g, " ").trim()
      if (text.length > 200) antwortText += "..."
    } catch {
      antwortText = "(Antwort konnte nicht gelesen werden)"
    }

    return {
      endpoint: url,
      status: antwort.status,
      erfolg: antwort.status === erwartet,
      dauer_ms: dauer,
      content_type: contentType,
      antwort_vorschau: antwortText,
    }
  } catch (fehler: unknown) {
    const dauer = Date.now() - start
    const fehlermeldung = fehler instanceof Error ? fehler.message : String(fehler)

    return {
      endpoint: url,
      status: null,
      erfolg: false,
      dauer_ms: dauer,
      fehler: fehlermeldung,
    }
  }
}

// ── Status-Symbol ─────────────────────────────────────────────────────────────

function statusSymbol(ergebnis: TestErgebnis): string {
  if (ergebnis.erfolg) return "✅"
  if (ergebnis.status !== null) return "⚠️"
  return "❌"
}

// ── Haupt-Funktion ────────────────────────────────────────────────────────────

async function main() {
  const startzeit = new Date()
  console.log("═══════════════════════════════════════════════════════")
  console.log("  WP ↔ ForstManager API-Sync Test")
  console.log("  Koch Aufforstung GmbH — Sprint AN")
  console.log(`  Datum: ${startzeit.toLocaleString("de-DE")}`)
  console.log("═══════════════════════════════════════════════════════\n")

  const ergebnisse: TestErgebnis[] = []

  for (const endpunkt of ENDPUNKTE) {
    process.stdout.write(`🔍 Teste: ${endpunkt.beschreibung}...`)

    const ergebnis = await testeEndpoint(
      endpunkt.url,
      endpunkt.beschreibung,
      endpunkt.erwartet
    )
    ergebnisse.push(ergebnis)

    console.log(` ${statusSymbol(ergebnis)} (${ergebnis.dauer_ms}ms)`)
    if (ergebnis.fehler) {
      console.log(`   ❗ Fehler: ${ergebnis.fehler}`)
    }
    if (ergebnis.status && !ergebnis.erfolg) {
      console.log(`   ❗ HTTP ${ergebnis.status} (erwartet: ${endpunkt.erwartet})`)
    }
  }

  // ── Zusammenfassung ──────────────────────────────────────────────────────
  const erfolgreich = ergebnisse.filter((e) => e.erfolg).length
  const fehlgeschlagen = ergebnisse.filter((e) => !e.erfolg).length
  const gesamtDauer = ergebnisse.reduce((sum, e) => sum + e.dauer_ms, 0)

  console.log("\n═══════════════════════════════════════════════════════")
  console.log("  Testergebnis-Zusammenfassung")
  console.log("═══════════════════════════════════════════════════════")
  console.log(`✅ Erfolgreich: ${erfolgreich}/${ergebnisse.length}`)
  console.log(`❌ Fehlgeschlagen: ${fehlgeschlagen}/${ergebnisse.length}`)
  console.log(`⏱️  Gesamtdauer: ${gesamtDauer}ms`)

  console.log("\n📋 Detailbericht:")
  for (let i = 0; i < ergebnisse.length; i++) {
    const e = ergebnisse[i]
    const ep = ENDPUNKTE[i]
    console.log(`\n${statusSymbol(e)} ${ep.beschreibung}`)
    console.log(`   URL: ${e.endpoint}`)
    console.log(`   Status: ${e.status ?? "Keine Antwort"}  |  Dauer: ${e.dauer_ms}ms`)
    if (e.content_type) console.log(`   Content-Type: ${e.content_type}`)
    if (e.fehler) console.log(`   Fehler: ${e.fehler}`)
    if (e.antwort_vorschau) console.log(`   Antwort: ${e.antwort_vorschau}`)
  }

  // ── Ausgabe als JSON für Dokumentation ───────────────────────────────────
  const jsonErgebnis = {
    testDatum: startzeit.toISOString(),
    zusammenfassung: {
      gesamt: ergebnisse.length,
      erfolgreich,
      fehlgeschlagen,
      gesamtDauer_ms: gesamtDauer,
    },
    endpunkte: ergebnisse.map((e, i) => ({
      beschreibung: ENDPUNKTE[i].beschreibung,
      ...e,
    })),
  }

  // JSON-Ergebnis in Datei schreiben
  const fs = await import("fs")
  const ausgabePfad = "docs/wp-api-test-ergebnis.json"
  fs.writeFileSync(ausgabePfad, JSON.stringify(jsonErgebnis, null, 2), "utf-8")
  console.log(`\n💾 JSON-Ergebnis gespeichert: ${ausgabePfad}`)

  console.log("\n═══════════════════════════════════════════════════════")

  if (fehlgeschlagen > 0) {
    console.log("⚠️  Einige Endpunkte sind nicht erreichbar oder fehlerhaft.")
    console.log("   Prüfe die WP-Plugin-Konfiguration und API-Routen.")
    process.exit(1)
  } else {
    console.log("🎉 Alle Endpunkte erfolgreich erreichbar!")
  }
}

main().catch((e) => {
  console.error("❌ Test fehlgeschlagen:", e)
  process.exit(1)
})
