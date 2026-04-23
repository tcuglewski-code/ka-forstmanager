# Protokoll-Retention & GoBD-Konformität

> Stand: 2026-04-24 — FM-19

## Sind Tagesprotokolle GoBD-relevante Belege?

**Nein, nicht direkt.** Tagesprotokolle sind **keine Handelsbelege** im Sinne der GoBD (Grundsätze ordnungsmäßiger Buchführung und Dokumentation). Sie dokumentieren Arbeitsleistung, nicht Geschäftsvorfälle.

**Aber:** Sie sind mittelbar GoBD-relevant, da sie:
1. Grundlage für **Rechnungen** und **Lohnabrechnungen** bilden
2. Als **Leistungsnachweis** bei Förderanträgen dienen
3. Bei Steuerprüfungen als Nachweis der betrieblichen Tätigkeit gefordert werden können

## Aktuelle Retention-Policy

| Datentyp | Aufbewahrung | Mechanismus | Schema-Modell |
|----------|-------------|-------------|---------------|
| Tagesprotokoll (aktiv) | Unbegrenzt | Online-DB | `Tagesprotokoll` |
| Tagesprotokoll (archiviert) | 3 Jahre nach Erstellung → Cold Storage | Cron: `/api/cron/archive-cold-storage` | `ArchivedTagesprotokoll` |
| Rechnungen | 10 Jahre (GoBD Pflicht) | Soft-Delete + Lock | `Rechnung` + `ArchivedRechnung` |
| GPS-Daten | 30 Tage nach Projektende | Cron: `/api/cron/cleanup-gps-data` | Nullifizierung in `Tagesprotokoll` |
| Lohndaten | 3 Jahre → Archive | Cron | `ArchivedLohndaten` |

## Archivierungs-Mechanismus

### Cold Storage (3 Jahre)
- **Cron:** `/api/cron/archive-cold-storage` (vercel.json: jährlich 1. Jan 03:00 UTC)
- **Ablauf:**
  1. Findet Tagesprotokolle mit `createdAt < 3 Jahre`
  2. Erstellt `ArchivedTagesprotokoll` mit JSON-Snapshot des kompletten Protokolls
  3. Löscht Original aus `Tagesprotokoll`
  4. Loggt in `ArchiveLog`

### Schema: ArchivedTagesprotokoll
```prisma
model ArchivedTagesprotokoll {
  id               String   @id @default(cuid())
  auftragId        String?
  datum            DateTime
  originalCreatedAt DateTime
  archivedAt       DateTime @default(now())
  archiveReason    String   @default("COLD_STORAGE_3Y")
  snapshot         Json     // Vollständiger JSON-Snapshot
}
```

### GoBD-Schutz (Rechnungen, nicht Protokolle)
- `lockedAt` / `lockedBy` — Unveränderlichkeits-Lock
- `deletedAt` — nur Soft-Delete, kein Hard-Delete
- 10-Jahre-Retention via `/api/cron/cleanup-invoices-10y`

## Empfehlung

1. **Tagesprotokolle:** 3 Jahre Online + Archive sind ausreichend, da sie keine Handelsbelege sind
2. **Bei Förder-Projekten:** Protokolle sollten mindestens 5 Jahre aufbewahrt werden (Förder-Bindungsfrist). Aktuell durch 3Y Archive + JSON-Snapshot abgedeckt.
3. **Verknüpfte Rechnungen:** Werden getrennt 10 Jahre aufbewahrt (GoBD-konform)
