# Lager Buchungs-Analyse — Soll/Ist-Vergleich

> Stand: 2026-04-23 | ForstManager (ka-forstmanager)

## Implementierte Buchungstypen

### Prisma-Modelle

| Modell | Beschreibung |
|--------|-------------|
| `LagerArtikel` | Stammdaten: Name, Kategorie, Einheit, Bestand, Mindestbestand, Preise |
| `LagerBewegung` | Einzelne Buchungen: Typ, Menge, Artikel, Mitarbeiter, Auftrag |
| `LagerReservierung` | Status-basierte Reservierungen für Aufträge (RESERVIERT/VERBRAUCHT/ZURUECK) |
| `Lieferant` | Lieferanten-Stammdaten mit Kontaktdaten |
| `Bestellung` / `BestellPosition` | Bestellwesen mit Positionen |

### Implementierte Bewegungstypen (LagerBewegung)

| Typ | Implementiert | API-Route |
|-----|-------------|-----------|
| `eingang` (Wareneingang) | Ja | `POST /api/lager/bewegungen` |
| `entnahme` (Materialentnahme) | Ja | `POST /api/lager/bewegungen` |
| `korrektur` (Bestandskorrektur) | Ja | `POST /api/lager/bewegungen` |
| `retoure` (Rückgabe) | Ja | `POST /api/lager/bewegungen` |

### Implementierte Features

- **Reservierungslogik** (KL-1): Artikel für Aufträge reservieren, verbrauchen, zurückbuchen
- **Lieferanten-Verwaltung** (KL-2): Stammdaten, Preise, Bestellnummern
- **Bestellwesen**: Bestellungen mit Positionen und Status-Tracking
- **Mindestbestand**: Feld `mindestbestand` im LagerArtikel vorhanden
- **Preise**: Einkaufs- und Verkaufspreise pro Artikel
- **Auftragsbezug**: Bewegungen können einem Auftrag zugeordnet werden
- **Mitarbeiterbezug**: Bewegungen können einem Mitarbeiter zugeordnet werden

## Fehlende / Teilweise Implementierte Features

| Feature | Status | Bewertung |
|---------|--------|-----------|
| **Mindestbestand-Alert** | Feld vorhanden, kein aktiver Alert | Mittel — einfach nachzurüsten |
| **Inventur-Workflow** | Nicht implementiert | Mittel — korrektur-Buchungen als Workaround |
| **Umbuchung** (Lagerort → Lagerort) | Nicht implementiert | Niedrig — nur 1 Lagerort-Feld, kein Multi-Lager |
| **Chargen-Tracking** | Nicht implementiert | Niedrig — für Forstbetrieb nicht kritisch |
| **Verfallsdatum** | Nicht implementiert | Niedrig — kaum verderbliche Materialien |
| **Automatische Nachbestellung** | Nicht implementiert | Mittel — nächster Schritt nach Mindestbestand-Alert |

## API-Routes

```
GET  /api/lager                    → Alle Artikel
POST /api/lager                    → Neuer Artikel
GET  /api/lager/[id]               → Einzelner Artikel
PATCH /api/lager/[id]              → Artikel aktualisieren
DELETE /api/lager/[id]             → Artikel löschen
POST /api/lager/bewegungen         → Neue Buchung
GET  /api/lager/bewegungen         → Buchungshistorie
POST /api/lager/reservierungen     → Neue Reservierung
```

## Bewertung

**Implementierungsgrad: ~70%** — Die Kernfunktionalität (CRUD, Bewegungen, Reservierungen, Lieferanten, Bestellungen) ist vorhanden. Fehlend sind primär Alerting (Mindestbestand) und ein formaler Inventur-Workflow.

**Kritisch fehlend:**
1. Mindestbestand-Alert (automatische Benachrichtigung bei Unterschreitung)
2. Inventur-Funktion (Soll/Ist-Abgleich mit Protokoll)
