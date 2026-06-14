# MAT-025: Sprint-Review — A2 Material-Bedarf-Agent

> Stand: 2026-06-14 · Repo: ka-forstmanager · Branch: main

## Zielbild

Der Material-Bedarf-Agent berechnet aus einer Aufforstungs-Spezifikation (aus A1-Angebot
oder Direkt-Eingabe) deterministisch den Materialbedarf (Pflanzgut, Verbissschutz, Zaun,
Saatgut), gleicht ihn bestandsbewusst mit dem Lager ab und erzeugt gruppierte
Bestellvorschläge je Lieferant/Baumschule. Bestellen bleibt Human-in-the-Loop.

## Lieferumfang je Sprint

### Sprint 1 — Foundation (Backend)
- Prisma-Modelle `MaterialBedarf`, `MaterialPosition`, `BestellVorschlag` + Enums
  (`MatStatus`, `MatQuelle`, `BestellVorschlagStatus`); additiv via `prisma db push`
- `reforest-rechner.ts`: rein deterministische Formeln (Pflanzenzahl, Verbiss, Zaunlänge, Pfähle, Saatgut)
- `lager-abgleich.ts`: Fuzzy-Match gegen `LagerArtikel`, zuBestellen = max(0, Bedarf − Bestand)
- `berechnen.ts`: Orchestrator (Spez → Positionen → Lager → Persistenz → Bestellvorschläge)
- `bestellvorschlag.ts`: idempotente Gruppierung je Lieferant/Baumschule
- `config.ts` (Kill-Switch `mat_agent_aktiv`, Default false), `zod-schemas.ts` (alle JSON-Grenzen)
- API: `POST /berechnen`, `GET /` (Liste), `GET /[id]`, `POST /[id]/bestellen`

### Sprint 2 — A1-Integration, LLM-Fallback, UI
- `aus-angebot.ts`: A1-Angebot → `MatInputSpezifikation` (Zod-validiert)
- `llm-fallback.ts`: Haiku/Opus-Fallback NUR für unbekannte Baumarten; PII-pseudonymisiert,
  auditiert (`logAiCall`), Kosten getrackt
- UI: Übersicht (`/material-bedarf`) mit Lager-Ampel, Detail (`/material-bedarf/[id]`) mit
  Positions-Tabelle + Bestellvorschlag-Sektion + „Bestellen"-Button
- Trigger „Materialbedarf berechnen" auf Angebots-Detailseite

### Sprint 3 — Tests & Security
- Unit-Tests: `reforest-rechner.test.ts`, `zod.test.ts`, `baue-positionen.test.ts` (alle grün)
- `scripts/check-a2-boundaries.sh`: Kill-Switch, Zod-Grenzen, kein roher JSON.parse / `as any`,
  deterministische Mengen, PII-Pseudonymisierung, LLM-Audit, Human-in-the-Loop, Brand-Boundary

### Sprint 4 — QA & Go-Live
- Boundary-Check + alle Unit-Tests grün
- Kill-Switch in DB verifiziert (`mat_agent_aktiv = false`)
- Live-Smoke grün (Health 200, Auth-Gates 401, Seite 307)
- `go-live-checkliste.md` + dieses Review

## NEVER-Konformität

| NEVER | Invariante | Status |
|-------|------------|--------|
| #21 | Kill-Switch Default false, 503 bei deaktiviert | ✅ |
| #22 | LLM-Kosten getrackt + auditiert, Budget-Key | ✅ |
| #23 | Zod an allen LLM/JSON-Grenzen, kein roher JSON.parse | ✅ |
| #24 | Standard-Mengen deterministisch (quelle=FORMEL), LLM nur Fallback | ✅ |
| HITL | Bestellen manuell, Rollenprüfung (Admin/GF) | ✅ |
| Brand | kein Feldhub/AppFabrik in KA-Code | ✅ |

## Offen / v1-Backlog

- Reservierungen im Lager (Mehrfach-Bedarf konkurrierend) — verschoben
- Bundesland-spezifisches Lieferanten-Routing — verschoben
- Multi-Lieferant „günstigster Anbieter"-Vergleich — verschoben
- `BLOB`/Backup für Material-Anhänge — n/a (keine Anhänge in v1)

## Verifikation

- `bash scripts/check-a2-boundaries.sh` → ✅ Alle A2-Boundaries gehalten
- `npx tsx tests/a2/reforest-rechner.test.ts` → ✅ alle bestanden
- `npx tsx tests/a2/zod.test.ts` → ✅ alle bestanden
- `npx tsx tests/a2/baue-positionen.test.ts` → ✅ alle bestanden
- `npx next build` → Compiled successfully, alle `material-bedarf`-Routen vorhanden
