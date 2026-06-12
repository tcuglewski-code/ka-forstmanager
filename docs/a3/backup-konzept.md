# DOK-060: Backup- & Wiederherstellungs-Konzept — A3 Dokumenten-KI

## Was muss gesichert werden?

| Daten | Ort | Kritikalität |
|-------|-----|--------------|
| Original-Dokumente (PDF/XML/Bilder) | Vercel Blob (`BLOB_READ_WRITE_TOKEN`) bzw. lokaler Storage-Adapter | **Hoch** — Belege, GoBD-relevant (10 Jahre) |
| Scan-Metadaten, Extraktion, Positionen | Neon Postgres `ForstManagerKADB` (DokumentenScan, ExtrahiertePosition) | **Hoch** |
| Audit-Trail | Neon (DokumentenAudit) | **Hoch** — Nachvollziehbarkeit aller Buchungen |
| Lern-Daten (Aliasse) | Neon (LagerArtikelAlias) | Mittel — rekonstruierbar, aber wertvoll |
| Konfiguration (Kill-Switch, Schwellen) | Neon (SystemConfig `dok_ki_*`) | Mittel — 4 Keys, in Code dokumentiert |

## Bestehende Sicherungen

1. **Neon Point-in-Time-Recovery (PITR)**: Neon hält standardmäßig History
   (Free/Launch: 24h–7 Tage, je nach Plan). Wiederherstellung über
   Neon-Console → Branch auf Zeitpunkt X.
2. **Vercel Blob**: redundant gespeichert (S3-basiert), aber **kein**
   Versionierungs-/Lösch-Schutz → versehentliches Überschreiben/Löschen ist endgültig.
   Der Storage-Adapter überschreibt nie (eindeutige Pfade je Upload), Risiko gering.
3. **Original-Hash** (`originalDateiHash`, SHA-256) in der DB erlaubt
   Integritätsprüfung jeder wiederhergestellten Datei.

## Lücken & Maßnahmen

| Lücke | Maßnahme | Aufwand |
|-------|----------|---------|
| Neon-PITR-Fenster begrenzt | Wöchentlicher logischer Dump (`pg_dump`) der A3-Tabellen nach Nextcloud (Zugang vorhanden) | Cron/manuell, ~30 min Einrichtung |
| Blob ohne Zweitkopie | Monatlicher Sync der Blob-Objekte nach Nextcloud (Liste via `originalDateiUrl`) | Skript, ~1h |
| GoBD 10-Jahre-Frist | `cleanup-soft-delete`-Cron darf GEBUCHTE Scans **nicht** vor Ablauf löschen — Scans mit Status GEBUCHT sind von Lösch-Crons auszunehmen (im Code: deletedAt-Filter, kein Hard-Delete für GEBUCHT) | Review bei Lösch-Crons |

## Wiederherstellungs-Pfade

1. **Einzelnes Dokument beschädigt/gelöscht**: Blob-URL aus DB → falls weg:
   Nextcloud-Zweitkopie → Hash gegen `originalDateiHash` prüfen.
2. **DB-Fehlbuchung** (z. B. fehlerhafte Auto-Buchung): KEIN Restore —
   Lagerbewegungen sind append-only; Korrektur über Gegenbuchung
   (LagerBewegung typ `korrektur`), Audit bleibt vollständig.
3. **Kompletter DB-Verlust**: Neon PITR-Branch → danach `prisma db push` ist
   NICHT nötig (Schema in Backup enthalten). Verarbeitungs-Queue läuft weiter,
   da Status-basiert (kein externer Queue-State).

## Verantwortung

- Einrichtung Dumps/Sync: Tomek bzw. Ops (Zugänge: Neon + Nextcloud, siehe TOOLS.md)
- Prüfintervall: quartalsweise Restore-Test eines Einzeldokuments (Hash-Vergleich)
