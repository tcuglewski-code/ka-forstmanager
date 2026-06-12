# DOK-047: Go-Live-Checkliste — A3 Dokumenten-KI (Shadow-Mode)

> Go-Live = Shadow-Mode: Kill-Switch AUS, ALLES geht in den Review.
> Auto-Buchung erst nach ≥2 Wochen fehlerfreiem Shadow-Betrieb und Tomeks GO.
> Stand: 2026-06-12

## 1. Technische Voraussetzungen (vor Go-Live, einmalig)

- [x] Build Exit 0 + Deploy READY auf Vercel (`ka-forstmanager.vercel.app`)
- [x] `bash scripts/a3-smoke.sh https://ka-forstmanager.vercel.app` grün
- [x] `bash scripts/check-a3-boundaries.sh` grün (alle Sicherheits-Invarianten)
- [x] Testsuite grün: `bash tests/a3/run-all.sh` (unit 35 / security 19 / e2e 11 Asserts + Modul-Tests)
- [x] Kill-Switch per DB-Query verifiziert: `dok_ki_auto_buchung_aktiv = false`
      (`SELECT value FROM "SystemConfig" WHERE key = 'dok_ki_auto_buchung_aktiv';`)
- [x] SystemConfig-Defaults gesetzt: threshold_high 0.85, threshold_low 0.60, vier_augen_betrag 500
- [x] Cron-Sweeper täglich (`30 5 * * *`) in vercel.json — KEINE Minuten-Crons (Hobby-Plan)
- [x] `CRON_SECRET` in Vercel-Env gesetzt (Process-Route verlangt es)
- [ ] `BLOB_READ_WRITE_TOKEN` in Vercel-Env (Blob-Storage; lokaler Adapter ist Fallback)
- [ ] Backup-Maßnahmen aus `backup-konzept.md` eingerichtet (pg_dump → Nextcloud)

## 2. Stammdaten (Verantwortung: KA-Admin)

- [ ] Readiness-Score auf `/dokumente/scans` ≥ 50 (Banner verschwindet bei 100)
- [ ] Aktive Lieferanten mit E-Mail erfasst
- [ ] Lagerartikel mit `artikelnummer` und `lieferantBestellnummer` gepflegt
- [ ] Offene Bestellungen (Status BESTELLT) erfasst für Lieferschein-Abgleich

## 3. Organisation

- [ ] Verantwortungsmodell gelesen + akzeptiert (`verantwortungsmodell.md`) — Tomek + KA-Admin
- [ ] Review-Einweisung Supervisoren/GF (Split-View, Korrekturen, Bestätigen/Ablehnen)
- [ ] Eskalationspfad bekannt (`ocr-debug-eskalation.md`, Stufe 3 = Kill-Switch AUS + Tomek)
- [ ] Steuerberater über CSV-Export-Format informiert (Semikolon, Dezimalkomma, BOM)

## 4. Shadow-Phase (mind. 2 Wochen ab Go-Live)

- [ ] Kill-Switch bleibt AUS — jede Buchung manuell bestätigt
- [ ] Wöchentlich: Kosten prüfen (`/einstellungen/dokumente-ki` → Kosten-Block)
- [ ] Wöchentlich: FEHLER-Quote prüfen (Filter FEHLER auf `/dokumente/scans`); Störungs-Banner beachten
- [ ] Korrektur-Quote im Review beobachten: Wie oft musste der Mensch Felder/Mapping korrigieren?
- [ ] NEVER #22: keine Massen-Läufe >10 Dokumente ohne Tomeks GO

## 5. Aktivierung Auto-Buchung (erst nach Shadow-Phase)

Kriterien (alle erfüllt):
- [ ] ≥ 2 Wochen Shadow-Betrieb, ≥ 20 reale Dokumente verarbeitet
- [ ] Korrektur-Quote bei Konfidenz ≥ 0.85: praktisch 0 (sonst Threshold via Settings erhöhen)
- [ ] Tomeks explizites GO (dokumentiert, z. B. Telegram)

Aktivierung:
1. Admin → `/einstellungen/dokumente-ki` → Kill-Switch AN → Speichern
2. Erste Auto-Buchungen täglich kontrollieren (Filter GEBUCHT, Audit `autoBuchung: true`)
3. Vier-Augen-Grenze (500 €) zunächst NICHT erhöhen

Rollback: Kill-Switch AUS (sofort wirksam, ohne Deploy) — oder Notfall-SQL, siehe `verantwortungsmodell.md`.

## 6. Nach Go-Live wiederkehrend

- [ ] Quartalsweise: Restore-Test Einzeldokument (Hash-Vergleich, `backup-konzept.md`)
- [ ] Quartalsweise: gelernte Aliasse stichprobenartig prüfen (`LagerArtikelAlias`, quelle GELERNT)
- [ ] Bei Anbieter-/Modellwechsel OCR/LLM: Testsuite + Boundary-Check erneut ausführen
