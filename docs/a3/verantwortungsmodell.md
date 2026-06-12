# DOK-063: Verantwortungsmodell — A3 Dokumenten-KI

> Wer haftet wofür, wenn die Dokumenten-KI Belege verarbeitet und (auto-)bucht?
> Stand: 2026-06-12 · Gilt für ka-forstmanager (Koch Aufforstung)

## Grundprinzip

Die Dokumenten-KI ist ein **Assistenzsystem**, kein autonomer Entscheider.
Jede Buchung ist entweder:

1. **Manuell bestätigt** — ein Mensch (Admin/GF) hat den Beleg im Review geprüft
   und per Button bestätigt. → Verantwortung: der bestätigende Nutzer.
2. **Auto-gebucht** — nur möglich, wenn der Kill-Switch
   (`dok_ki_auto_buchung_aktiv`) **bewusst von einem Admin aktiviert** wurde
   UND Konfidenz ≥ Schwelle UND alle Positionen gemappt UND Betrag unter der
   Vier-Augen-Grenze. → Verantwortung: der Admin, der den Kill-Switch
   aktiviert hat (Aktivierung wird auditiert, Default ist AUS).

Es gibt **keinen Pfad**, auf dem das System ohne vorherige menschliche
Freigabe (Bestätigung oder Kill-Switch-Aktivierung) Bestände verändert.

## Rollen & Pflichten

| Rolle | Verantwortung |
|-------|---------------|
| **Admin (Koch Aufforstung)** | Kill-Switch & Schwellen (`/einstellungen/dokumente-ki`); Steuerberater-Export; Reaktion auf Störungs-Banner; quartalsweiser Restore-Test (siehe `backup-konzept.md`) |
| **Admin/GF (Review)** | Prüfung jedes Belegs in `REVIEW_ERFORDERLICH`: extrahierte Felder gegen Original (Split-View), Artikel-Mapping, Mengen. Bestätigung = fachliche Abnahme |
| **Tomek / Ops** | Betrieb (Vercel, Neon, Blob), Backups, Eskalationsstufe 3 (`ocr-debug-eskalation.md`), Kosten-Monitoring |
| **System (Pipeline)** | Extraktion, Matching, Routing-Vorschlag, Audit-Trail. Trifft KEINE endgültige fachliche Entscheidung |

## Technische Absicherungen (durchgesetzt im Code)

| Absicherung | Mechanismus |
|-------------|-------------|
| Kill-Switch fail-closed | Default `false`; bei DB-/Config-Fehler → Review statt Auto-Buchung (NEVER #21) |
| Vier-Augen-Grenze | Beträge ≥ `dok_ki_vier_augen_betrag` (Default 500 €) gehen IMMER in den Review |
| Unveränderlichkeit | `GEBUCHT` hat keine erlaubten Status-Übergänge; Korrektur nur per Gegenbuchung (LagerBewegung `korrektur`) |
| Audit-Trail | Jede Status-Änderung, Bestätigung, Ablehnung und Auto-Buchung wird in `DokumentenAudit` protokolliert (inkl. `systemAktion`-Flag) |
| LLM/OCR-Misstrauen | Alle KI-Ausgaben werden via Zod validiert; Halluzinations-Guard im Matcher; keine ungeprüften Casts (NEVER #23) |
| GoBD | Originale + SHA-256-Hash 10 Jahre; GEBUCHT-Scans sind von Lösch-Crons ausgenommen |

## Haftungsgrenzen / Restrisiko

- **Falsch extrahierte, aber bestätigte Daten**: Verantwortung liegt beim
  Bestätigenden — Split-View zeigt das Original genau dafür an.
- **Auto-Buchung mit Fehler**: durch Kill-Switch-Opt-in + Konfidenz-Schwelle +
  Vier-Augen-Grenze minimiert. Korrektur per Gegenbuchung, Audit bleibt
  vollständig. Bei Häufung: Kill-Switch AUS (wirkt sofort, ohne Deploy).
- **Steuerliche Bewertung**: Der CSV-Export ist eine Datenlieferung an den
  Steuerberater — die steuerliche Würdigung bleibt beim Steuerberater.
- **Externe Dienste** (OCR/LLM-Anbieter): Ausfall führt zu Status `FEHLER` +
  Störungs-Banner, nie zu stillen Falschbuchungen.

## Eskalation

Siehe `docs/a3/ocr-debug-eskalation.md` — Stufe 3 = Kill-Switch AUS + Tomek
informieren. Kill-Switch-Änderung per SQL im Notfall:

```sql
UPDATE "SystemConfig" SET value = 'false' WHERE key = 'dok_ki_auto_buchung_aktiv';
```
