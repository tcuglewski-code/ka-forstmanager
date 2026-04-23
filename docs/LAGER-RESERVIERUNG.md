# Lager-Reservierung — FM-36

> Stand: 2026-04-24

## Was macht die Reservierung?

Die Lager-Reservierung bindet Artikelbestand an einen bestimmten Auftrag, sodass der Bestand nicht anderweitig vergeben wird.

## Use-Case

1. **Auftrag geplant:** Für einen Pflanzauftrag werden z.B. 500 Wuchshüllen benötigt
2. **Reservierung erstellen:** POST `/api/lager/reservierung` mit `artikelId`, `auftragId`, `menge`
3. **Bestand reduziert:** Die reservierte Menge wird sofort vom verfügbaren Bestand abgezogen (Transaktion)
4. **Status RESERVIERT:** Artikel ist gebunden, aber noch nicht verbraucht
5. **Verbrauch melden:** PATCH `/api/lager/reservierung/[id]/verbrauchen` → Status wird `VERBRAUCHT`
6. **Audit-Trail:** `LagerBewegung` Eintrag dokumentiert jede Reservierung und jeden Verbrauch

## API Endpoints

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| GET | `/api/lager/reservierung` | Liste (optional `?auftragId=...`) |
| POST | `/api/lager/reservierung` | Neue Reservierung (prüft Bestand) |
| GET | `/api/lager/reservierung/[id]` | Detail |
| PATCH | `/api/lager/reservierung/[id]/verbrauchen` | Als verbraucht markieren |

## Datenmodell

```
LagerReservierung:
  id, artikelId, auftragId, menge, status (RESERVIERT/VERBRAUCHT), verbrauchtAm, createdAt

LagerBewegung (Audit):
  artikelId, auftragId, typ (reserve/verbrauch), menge, notiz
```

## Bestandsanzeige

In der Lager-UI zeigt "gebundener Bestand" die Summe aller aktiven Reservierungen. Der tatsächlich verfügbare Bestand = Gesamtbestand − reservierter Bestand.

## Frontend

Reservierungen werden im Lager-Hauptseite unter dem Tab "Reservierungen" angezeigt (`/lager`, Tab `reservierungen`).
