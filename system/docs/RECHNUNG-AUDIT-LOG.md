# RechnungAuditLog — Vollständige Dokumentation

> Stand: 2026-04-23 | ForstManager (ka-forstmanager)

## Schema

```prisma
model RechnungAuditLog {
  id         String   @id @default(cuid())
  rechnungId String
  rechnung   Rechnung @relation(fields: [rechnungId], references: [id], onDelete: Cascade)
  action     String   // 'CREATE', 'UPDATE', 'LOCK', 'UNLOCK_ATTEMPT', 'STORNO', 'PARTIAL_STORNO',
                      // 'GDPR_RESTRICTION', 'GDPR_RESTRICTION_LIFTED',
                      // 'DELETE_ATTEMPT_BLOCKED', 'UPDATE_ATTEMPT_BLOCKED', 'SOFT_DELETE'
  field      String?  // Welches Feld geändert wurde
  oldValue   String?  // Alter Wert (JSON-serialisiert)
  newValue   String?  // Neuer Wert (JSON-serialisiert)
  userId     String?  // Wer hat die Änderung gemacht
  userName   String?  // Name des Users (für Archiv)
  ip         String?  // IP-Adresse
  userAgent  String?  // Browser/Client
  createdAt  DateTime @default(now())

  @@index([rechnungId])
  @@index([createdAt])
}
```

## Geloggte Aktionen

| Action | Trigger | Endpoint | Felder |
|--------|---------|----------|--------|
| `CREATE` | Rechnung erstellt | `POST /api/rechnungen` | nummer, betrag, auftragId |
| `UPDATE` | Feld geändert | `PATCH/PUT /api/rechnungen/[id]` | Pro Feld: status, notizen, pdfUrl, faelligAm, rabatt, etc. |
| `STORNO` | Vollständige Stornierung | `POST /api/rechnungen/[id]/stornieren` | status (→ storniert), grund, betrag |
| `PARTIAL_STORNO` | Teilstornierung | `POST /api/rechnungen/[id]/stornieren` | status (→ teilstorniert), stornoBetrag |
| `SOFT_DELETE` | Rechnung gelöscht (soft) | `DELETE /api/rechnungen/[id]` | deletedAt |
| `UPDATE_ATTEMPT_BLOCKED` | GoBD-locked Änderungsversuch | `PATCH/PUT /api/rechnungen/[id]` | Versuchtes Feld |
| `DELETE_ATTEMPT_BLOCKED` | GoBD-locked Löschversuch | `DELETE /api/rechnungen/[id]` | — |
| `GDPR_RESTRICTION` | DSGVO Art. 18 Einschränkung | `POST /api/gdpr/restrict` | gdprRestricted (→ true) |
| `GDPR_RESTRICTION_LIFTED` | Einschränkung aufgehoben | `DELETE /api/gdpr/restrict` | gdprRestricted (→ false) |

## Retention-Policy

- **Audit-Log Einträge**: 90 Tage Aufbewahrung (Cron: `/api/cron/cleanup-audit`)
- **RechnungVersion** (separates Modell): **10 Jahre** (GoBD-Pflicht, §147 AO / §257 HGB)
- **Rechnungen selbst**: Soft-Delete, physische Löschung erst nach 10 Jahren

## API-Zugriff

```bash
# Audit-Log einer Rechnung abrufen (Admin-only)
GET /api/rechnungen/{id}/audit

# Antwort:
{
  "rechnungId": "...",
  "rechnungNummer": "RE-2026-0001",
  "entries": [...],
  "totalEntries": 15
}
```

## UI-Komponente

`src/components/rechnung/AuditLogSection.tsx` — Zeigt die letzten 5 Einträge mit farbkodierten Icons.

## DB-Verifizierung

```sql
-- Anzahl Audit-Einträge pro Rechnung
SELECT r.nummer, COUNT(a.id) as audit_count
FROM "Rechnung" r
LEFT JOIN "RechnungAuditLog" a ON a."rechnungId" = r.id
GROUP BY r.nummer
ORDER BY audit_count DESC
LIMIT 10;

-- Letzte 10 Audit-Einträge
SELECT a.action, a.field, a."oldValue", a."newValue", a."userName", a."createdAt"
FROM "RechnungAuditLog" a
ORDER BY a."createdAt" DESC
LIMIT 10;
```
