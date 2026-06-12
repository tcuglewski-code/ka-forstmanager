# A3 Dokumenten-KI — Sprint-5-Review & Projekt-Abschlussreport

**Datum:** 2026-06-12 · **Autor:** Volt (Senior Developer)
**Status:** ✅ Alle Sprints 0–5 abgeschlossen, deployed, verifiziert. Go-Live = Shadow-Mode bereit.

## Sprint-Übersicht

| Sprint | Inhalt | Commit | Status |
|--------|--------|--------|--------|
| 0 | Schema, Storage-Adapter, Grundgerüst | 67bc47f | ✅ deployed |
| 1 | Foundation: Upload, Parser, Pipeline-Basis (DOK-001-008, 055, 056, 067, 071) | e0608c0 | ✅ deployed |
| 2 | Pipeline komplett: OCR/LLM-Adapter, Matching, Routing, Orchestrator | c0d4c94, aaf9c0d | ✅ deployed |
| 3 | Review-UI, Bestätigen/Ablehnen, Settings, Auto-Buchung, Debug-Doku | 4e93b2a, cb6fe02 | ✅ deployed |
| 4 | Härtung: File-Validator, Rate-Limit, Tests, Kosten/Export/Störung, Boundaries, Backup | cfe74b7 | ✅ deployed |
| 5 | QA, Verantwortungsmodell, Readiness-Check, Go-Live-Checkliste, Review | 0229953 | ✅ deployed |

## Sprint-5-Lieferumfang

- **DOK-063** `docs/a3/verantwortungsmodell.md` — Haftungs-/Verantwortungsmodell:
  Mensch bestätigt Buchungen; Auto-Buchung nur nach bewusstem Admin-Opt-in
  (Kill-Switch), fail-closed, Vier-Augen-Grenze, Audit-Trail, GoBD.
- **DOK-065** `GET /api/dokumente/readiness` + Readiness-Banner auf
  `/dokumente/scans`: Score 0–100 aus Lieferanten (Kontakt), Artikelnummern,
  Lieferanten-Bestellnummern, Aliassen, offenen Bestellungen — mit konkreten
  Pflege-Hinweisen, ausklappbar, verschwindet bei Score 100.
- **DOK-047** `docs/a3/go-live-checkliste.md` — Go-Live als Shadow-Mode
  (Kill-Switch AUS), Stammdaten-, Organisations- und Shadow-Phase-Kriterien,
  Aktivierungs- und Rollback-Pfad für Auto-Buchung.
- **DOK-045 (QA-Gate)** — kompletter Regressionslauf, siehe unten.

## QA-Ergebnis (Sprint-5-Lauf, 2026-06-12)

| Prüfung | Ergebnis |
|---------|----------|
| `tests/a3/run-all.sh` (unit 35 + security 19 + 5 Modul-Tests + e2e 11 + Doppelbuchung) | ✅ komplett grün |
| `scripts/check-a3-boundaries.sh` (NEVER #21/#23, Casts, Upload-Härtung, Worker-Auth, Crons, Repo-Struktur) | ✅ alle Invarianten gehalten |
| `npx next build` | ✅ Exit 0 |
| Vercel Deploy 0229953 | ✅ READY |
| `scripts/a3-smoke.sh` (Prod) | ✅ grün |
| Neue Endpoints unauth (kosten/export/stoerung/readiness) | ✅ 401 |
| Kill-Switch DB-Query | ✅ `dok_ki_auto_buchung_aktiv = false` |

## Sicherheits-Invarianten (final)

- **NEVER #21**: Kill-Switch Default AUS, fail-closed, per Settings-API ohne Deploy schaltbar, nach jedem Deploy per DB-Query verifiziert.
- **NEVER #22**: Keine Live-OCR/LLM-Massenläufe — alle Tests über Fixtures/Mock-Adapter; E2E nutzt deterministischen XRechnung-Parser.
- **NEVER #23**: Zod an allen LLM/OCR/Prisma-JSON-Grenzen, keine `as any`/`as Record<`-Casts in A3-Code (statisch geprüft).
- State-Machine: `GEBUCHT` unveränderlich, Korrektur nur per Gegenbuchung; vollständiger Audit-Trail.
- Upload: Magic-Bytes, Größenlimit 10 MB, PDF-Aktiv-Inhalte-Block, XXE-Schutz, Pfad-/Namens-Härtung, Rate-Limit 20/h.

## Offene Punkte (kein Blocker für Shadow-Mode)

1. **MC Activity API** liefert 500 (mission-control-seitig) — Sprint-Logs dort nicht erfasst; lokales Loop-Log vollständig.
2. **Backup-Maßnahmen** (pg_dump → Nextcloud, Blob-Zweitkopie) aus `backup-konzept.md` noch einzurichten (Ops/Tomek).
3. **Stammdaten-Pflege** durch KA-Admin (Readiness-Banner führt durch).
4. **Auto-Buchung** bleibt AUS bis ≥2 Wochen Shadow-Betrieb + Tomeks GO (Kriterien in Go-Live-Checkliste §5).

## Empfehlung

System ist bereit für den Shadow-Mode-Go-Live: reale Belege hochladen, Reviews
durchführen, Korrektur-Quote beobachten. Entscheidung über Auto-Buchung nach
2 Wochen anhand Checkliste §5.
