# DSGVO — KI-Datenschutzmaßnahmen

## Zero Data Retention (Anthropic API)

Alle Anthropic API-Calls verwenden den Header `x-anthropic-no-store: true`.
Dieser Header stellt sicher, dass Anthropic **keine Eingabe- oder Ausgabedaten speichert** und Prompts **nicht für Modell-Training verwendet** werden (Zero Data Retention).

**Betroffene Stellen:**
- `src/lib/ki/dokument-auswertung.ts` — Dokumentenanalyse via Vision API
- `src/lib/ki/content-generator.ts` — Blog-Content-Generierung
- `src/lib/ki/unterkunft-empfehlung.ts` — Unterkunft-Ranking
- `src/app/api/betriebs-assistent/beraten/route.ts` — Förderberater KI-Synthese

**Implementierung:** `defaultHeaders: { 'x-anthropic-no-store': 'true' }` im Anthropic SDK Client-Konstruktor.

**KI-Datenschutz: Zero Data Retention**
Gemäß DSGVO Art. 25 (Privacy by Design) und der TIA (Transfer Impact Assessment) für US-Datenübermittlung:
- Kein Speichern von Prompts oder Antworten durch Anthropic
- Kein Training auf unseren Daten
- Zusätzlich: Pseudonymisierung aller personenbezogenen Daten vor API-Übermittlung (`pseudonymizePrompt()`)
- AI-Audit-Logging lokal (nur Prompt-Hash, kein Klartext)

**Referenz:** [Anthropic API — Zero Data Retention](https://docs.anthropic.com/en/docs/build-with-claude/zero-data-retention)
