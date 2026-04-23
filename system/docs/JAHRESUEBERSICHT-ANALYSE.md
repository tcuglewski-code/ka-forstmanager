# Jahresübersicht Kennzahlen-Analyse

> Stand: 2026-04-23 | ForstManager (ka-forstmanager)

## Dateien

| Datei | Funktion |
|-------|----------|
| `src/app/(dashboard)/jahresuebersicht/page.tsx` | UI-Komponente (Client) |
| `src/app/api/jahresuebersicht/route.ts` | API-Route (Server) |

## 1. Datenquellen

| Quelle | Daten | Aggregation |
|--------|-------|-------------|
| `Saison` | Alle Saisons (sortiert nach createdAt) | Iteration |
| `Auftrag` | Aufträge pro Saison (via saisonId) | Count |
| `Stundeneintrag` | Stunden pro Saison-Aufträge | `_sum.stunden` (Prisma Aggregate) |
| `Rechnung` | Rechnungen pro Saison-Aufträge | Summierung `betrag` |
| `GruppeMitglied` | Mitarbeiter pro Saison | `distinct: ["mitarbeiterId"]` |
| `SystemConfig` | vollkosten_pro_stunde | Single Value (Default: 43,50 €) |

## 2. Berechnung: On-the-Fly

- **Kein Caching** — jeder Seitenaufruf löst neue DB-Queries aus
- **Parallelisierung** innerhalb jeder Saison via `Promise.all()`
- **Aber**: Sequentielle Iteration über alle Saisons → N+1 Problem
- **Query-Count**: 2 + (N × 3) für N Saisons (z.B. 10 Saisons = 32 Queries)

## 3. Filter

**Aktuell: Keine Filter implementiert.** Alle Saisons werden angezeigt.

Mögliche Erweiterungen:
- Jahresfilter
- Saison-Typ-Filter (pflanzung, kulturschutz, etc.)
- Status-Filter (aktiv/abgeschlossen/planung)

## 4. Saison-Bestimmung

- Saison wird über `saison.status` identifiziert
- Status-Werte: `planung`, `aktiv`, `abgeschlossen`
- Sortierung: `createdAt` aufsteigend
- Keine explizite Datums-basierte Saisonbestimmung

## 5. Formeln

### Umsatz
```
Umsatz = SUM(Rechnung.betrag) für alle Aufträge der Saison
```

### Lohnkosten
```
Lohnkosten = Gesamtstunden × vollkosten_pro_stunde
  - Gesamtstunden = SUM(Stundeneintrag.stunden) aller Saison-Aufträge
  - vollkosten_pro_stunde = SystemConfig.value (Default: 43,50 €/h)
```

### Deckungsbeitrag
```
Deckungsbeitrag = Umsatz - Lohnkosten
```

### Marge
```
Marge = (Deckungsbeitrag / Umsatz) × 100   [in %]
  - Wenn Umsatz = 0 → Marge = 0
  - Gerundet auf 1 Nachkommastelle
```

## 6. Performance-Bewertung

| Aspekt | Status | Empfehlung |
|--------|--------|------------|
| N+1 Query Problem | Vorhanden | Batch-Query mit `WHERE saisonId IN (...)` |
| Caching | Keines | HTTP Cache-Header oder Redis für Aggregate |
| Pagination | Keine | Bei vielen Saisons nötig |
| Autorisierung | Admin-only | OK |

**Aktuell akzeptabel** für <20 Saisons. Ab >50 Saisons sollte die Query-Strategie optimiert werden.

## 7. UI-Kennzahlen

Die Seite zeigt:
- **Summary-Cards**: Gesamt-Umsatz, Gesamt-Lohnkosten, Gesamt-DB, Gesamt-Marge
- **Saison-Tabelle**: Name, Status, Aufträge, Stunden, Mitarbeiter, Umsatz, Lohnkosten, DB, Marge
- **Farbkodierung**: Positive Marge (grün), Negative (rot)
