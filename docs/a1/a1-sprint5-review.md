# A1 Angebots-Agent — Sprint-5-Review & Projekt-Abschlussreport

**Datum:** 2026-06-14 · **Autor:** Volt (Senior Developer)
**Status:** ✅ Alle Sprints 0–5 abgeschlossen, deployed, verifiziert. Go-Live bereit (Kill-Switch AUS).

## Sprint-Übersicht

| Sprint | Inhalt | Commit | Status |
|--------|--------|--------|--------|
| 0 | Preisbuch Seed-Daten (Koch Aufforstung Preise 2025) | 62803c5 | ✅ deployed |
| 1 | Preisbuch+Angebots-Schema, Admin-UI, API-Routen | 8ed6766 | ✅ deployed |
| 2 | Anfrage-Parser, Kalkulations-Engine, RAG, API-Routen | b46a7fd | ✅ deployed |
| 3 | Gut/Besser/Best-Varianten, Angebots-UI, Marken-PDF | a4525b5 | ✅ deployed |
| 4 | Versand, DSGVO-Tracking, Portal, Follow-up-Cron, Tests | 7c524a0 | ✅ deployed |
| 5 | QA-Gate, Type-Härtung, Go-Live-Checkliste, Review | (dieser Commit) | ✅ deployed |

## Was der Agent kann

1. **Parsen** — Freitext / WordPress-Wizard-JSON / E-Mail → strukturierte
   `AnfrageSpezifikation` (Leistungstyp, Fläche, Baumarten, Region, Steilheit,
   Entfernung, Schutzbedarf). LLM-Schritt, PII-pseudonymisiert, Zod-validiert.
2. **Kalkulieren** — deterministisch, LLM-frei: `Endpreis = basispreis ×
   (1 + Σ Aufschläge) × Menge`. Jede Position referenziert eine reale
   `preisbuchId` (Anti-Halluzination, `quelle = "preisbuch"`).
3. **RAG** — deterministischer Vergleich mit historischen Aufträgen (reale
   Ist-Kosten als Plausibilitätsanker), kein LLM.
4. **Varianten** — Gut/Besser/Best durch Wiederverwendung der Engine
   (Schutz/Zaun-Flags); Verkaufstexte per LLM mit deterministischem Fallback.
5. **PDF** — markenkonform (Waldgrün/Gold, Koch Aufforstung), pdf-lib.
6. **Versand** — nur nach menschlicher Freigabe; E-Mail mit PDF + Portal-Link.
7. **Tracking** — DSGVO-konform (IP nur SHA-256, Opt-out, fehlertolerantes Pixel).
8. **Portal** — öffentliche Annahme/Ablehnung, stoppt offene Follow-ups.
9. **Follow-ups** — täglicher Cron (3 Stufen), CRON_SECRET-geschützt.

## Sprint-5-Lieferumfang

- **QA-Gate** — kompletter Regressionslauf (siehe unten).
- **Type-Härtung** — alle A1-Dateien `npx tsc --noEmit`-sauber, kein `any`
  (CLAUDE.md): explizite Annotation der Prisma-Map-Callbacks in
  `historische-auftraege.ts`, `email-versand.ts`, `pdf/route.ts`, `portal/route.ts`.
- **`docs/a1/go-live-checkliste.md`** — technische/organisatorische Kriterien,
  Aktivierungs- und Rollback-Pfad, Kostenkontrolle (NEVER #22).
- **`docs/a1/a1-sprint5-review.md`** — dieser Report.

## QA-Ergebnis (Sprint-5-Lauf, 2026-06-14)

| Prüfung | Ergebnis |
|---------|----------|
| `npx tsx tests/a1/unit.test.ts` (Kalkulation 9 + Zod-Schutz 3) | ✅ 12/12 grün |
| `bash scripts/check-a1-boundaries.sh` (NEVER #21/#23, Casts, DSGVO, Mensch-im-Loop, Cron-Auth, Brand, Modell) | ✅ alle Invarianten gehalten |
| `npx tsc --noEmit` (A1-Oberfläche) | ✅ fehlerfrei |
| `npx next build` | ✅ Exit 0 (338/338 Seiten) |
| Vercel Deploy 7c524a0 | ✅ READY |
| `/api/health` (Prod) | ✅ 200 `{status:ok,db:connected}` |
| `/api/angebote/stats` unauth (Prod) | ✅ 401 |
| Kill-Switch fail-safe (`ang_agent_aktiv` Default false) | ✅ verifiziert (Code + 503-Pfad) |

## Sicherheits-Invarianten (gehalten)

- **NEVER #21** — Kill-Switch `ang_agent_aktiv`, Default `false`, fail-safe;
  `/api/angebote/generieren` → 503 wenn inaktiv.
- **NEVER #22** — LLM-Monatsbudget (`ang_llm_budget_monat_cent`, Default 50 €);
  Kosten via `/api/angebote/stats` sichtbar.
- **NEVER #23** — alle LLM/JSON-Grenzen Zod-validiert (`parseLlmJson`/`safeParseJson`);
  kein roher `JSON.parse` auf LLM-Antworten.
- **DSGVO** — PII-Pseudonymisierung vor jedem LLM-Call; IP nur als SHA-256-Hash;
  Tracking-Opt-out respektiert.
- **Mensch-im-Loop** — Versand erfordert `status = "freigegeben"`.
- **Brand** — kein Feldhub/AppFabrik-Branding in KA-Angeboten (CLAUDE.md).
- **Modell** — Default `claude-opus-4-8`.

## Offene Betriebsaufgaben (vor erster echter Aktivierung)

- Vercel-Env: `CRON_SECRET`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`
- Preisbuch + Templates mit echten Koch-Aufforstung-Daten pflegen
- Erst dann `ang_agent_aktiv = true` und erste Angebote vollständig gegenlesen
