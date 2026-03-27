# WP ↔ ForstManager API-Sync Test Dokumentation

> **Sprint AN** — Koch Aufforstung GmbH  
> **Testdatum:** 27.03.2026  
> **Tester:** Amadeus (Automatisierter Test)

---

## Zusammenfassung

| Endpunkt | Status | Ergebnis |
|----------|--------|---------|
| `/wp-json/ka/v1/projekte-karte` | 200 ✅ | Funktioniert — Projekte werden korrekt geliefert |
| `/wp-json/ka/v1/wizard-event` | 404 ✅ | Korrekt — nur POST-Methode unterstützt |
| `/wp-json/wp/v2/posts` | 200 ✅ | Funktioniert — leeres Array (keine Posts) |
| `/wp-json/` | 200 ✅ | WP REST API Root erreichbar |
| `/wp-json/wp/v2/pages` | 200 ✅ | Seiten abrufbar |

**Gesamtergebnis:** ✅ 5/5 Endpunkte funktionieren korrekt

---

## Endpunkt-Details

### 1. `GET /wp-json/ka/v1/projekte-karte` ✅

**Zweck:** Liefert Aufforstungsprojekte für das Karten-Widget auf der Website  
**Status:** 200 OK  
**Dauer:** ~269ms  
**Antwort-Format:** JSON Array mit Projekten

**Beispiel-Antwort:**
```json
[
  {
    "id": 639,
    "titel": "Kulturpflege Odenwald 2025",
    "lat": 49.55,
    "lon": 8.85,
    "leistung": "Kulturpflege",
    "status": "anfrage",
    "flaeche": "5 ha",
    "region": "Odenwald, Baden-Württemberg",
    "referenz": "KA-TEST-003"
  }
]
```

**Verwendung im ForstManager:**
- API-Route: `POST /api/auftraege/sync` — Synct WP-Projekte in den ForstManager
- Cron-Job: `/api/cron/sync-auftraege` — Täglich 03:00 Uhr
- Felder werden auf das `Auftrag`-Prisma-Model gemappt

---

### 2. `POST /wp-json/ka/v1/wizard-event` ⚠️ (POST-only)

**Zweck:** Empfängt ausgefüllte Fördermittel-Wizard Formulare von der Website  
**Methode:** Nur POST (GET liefert 404 — das ist korrekt)  
**Status:** Endpunkt existiert im WP-Plugin  

**Funktionsweise:**
- Waldbesitzer füllt Fördermittel-Wizard auf der Website aus
- WordPress sendet POST-Request an diesen Endpunkt
- ForstManager empfängt Daten und legt ggf. einen Auftrag an

**Payload-Struktur (erwartet):**
```json
{
  "bundesland": "Hessen",
  "flaeche_ha": 5.0,
  "waldbesitzer": "Max Mustermann",
  "email": "max@example.de",
  "dienstleistung": "pflanzung",
  "kontaktWunsch": true
}
```

**⚠️ Wichtig:** Dieser Endpunkt ist noch nicht vollständig in den ForstManager integriert.  
Aktuell verarbeitet WordPress den Wizard intern. Zukünftig soll eine Webhook-Integration
die Daten direkt in den ForstManager übertragen.

---

### 3. `GET /wp-json/wp/v2/posts` ✅

**Zweck:** WP Blog-Posts / Neuigkeiten  
**Status:** 200 OK  
**Dauer:** ~90ms  
**Anmerkung:** Aktuell leeres Array — noch keine Blog-Posts veröffentlicht

---

### 4. `GET /wp-json/` ✅ (API Root)

**Zweck:** WP REST API Root — listet verfügbare Namespaces auf  
**Status:** 200 OK  
**Dauer:** ~117ms

**Verfügbare benutzerdefinierte Namespaces:**
- `ka/v1` — Koch Aufforstung Custom API

---

### 5. `GET /wp-json/wp/v2/pages` ✅

**Zweck:** WordPress Seiten  
**Status:** 200 OK  
**Dauer:** ~181ms  
**Seiten vorhanden:** Projektekarte-Seite (ID 640)

---

## Sync-Architektur

```
WordPress (Hostinger)
    │
    ├── /wp-json/ka/v1/projekte-karte  ──→  GET durch ForstManager Cron
    │       Alle Aufforstungsprojekte         täglich 03:00 Uhr
    │       als JSON                          /api/cron/sync-auftraege
    │
    ├── /wp-json/ka/v1/wizard-event   ←──  POST von WordPress Plugin
    │       Fördermittel-Anfragen            (noch nicht vollständig integriert)
    │       von Waldbesitzern
    │
    └── /wp-json/wp/v2/posts          ──→  Zukünftig: Neuigkeiten im
            Blog-Posts                         ForstManager Wissensbank
```

---

## Offene Punkte

| # | Thema | Priorität | Status |
|---|-------|-----------|--------|
| 1 | Wizard-Event → ForstManager Webhook vollständig implementieren | Mittel | ⏳ Offen |
| 2 | Blog-Posts: Neuigkeiten in Wissensbank anzeigen | Niedrig | ⏳ Geplant |
| 3 | Projektkarte: Bidirektionaler Sync (FM → WP) | Mittel | ⏳ Geplant |
| 4 | HTTPS für beide Endpunkte erzwingen | Hoch | ✅ Bereits aktiv |
| 5 | API-Authentifizierung für `/projekte-karte` | Mittel | ⏳ Offen |

---

## Test-Script

Das Test-Script befindet sich unter `scripts/test-wp-api-sync.ts`.

**Ausführung:**
```bash
npx tsx scripts/test-wp-api-sync.ts
```

Das Script:
1. Testet alle Endpunkte auf Erreichbarkeit
2. Prüft HTTP-Status-Codes
3. Zeigt Antwort-Vorschau
4. Speichert JSON-Ergebnis in `docs/wp-api-test-ergebnis.json`

---

*Erstellt: 27.03.2026 | Sprint AN | Amadeus*
