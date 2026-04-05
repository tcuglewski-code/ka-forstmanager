# DSGVO — KI-Datenschutzmaßnahmen

## Zero Data Retention (Anthropic API)

Alle Anthropic API-Calls verwenden den Header `anthropic-beta: no-store-1`.
Dieser Header stellt sicher, dass Anthropic **keine Eingabe- oder Ausgabedaten speichert** (Zero Data Retention).

**Betroffene Stellen:**
- `src/lib/ki/dokument-auswertung.ts` — Dokumentenanalyse via Vision API
- `src/lib/ki/content-generator.ts` — Blog-Content-Generierung
- `src/lib/ki/unterkunft-empfehlung.ts` — Unterkunft-Ranking
- `src/app/api/betriebs-assistent/beraten/route.ts` — Förderberater KI-Synthese

**Implementierung:** `defaultHeaders: { 'anthropic-beta': 'no-store-1' }` im Anthropic SDK Client-Konstruktor.

**Referenz:** [Anthropic API — Zero Data Retention](https://docs.anthropic.com/en/docs/build-with-claude/zero-data-retention)
