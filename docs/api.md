# ForstManager — API Dokumentation

> REST API für Web-Dashboard, Mobile App und externe Integrationen.

## Basis-URL

```
https://ka-forstmanager.vercel.app/api
```

## Authentifizierung

### Web (Session Cookie)
```http
Cookie: session=<token>
```

### Mobile App (JWT Bearer)
```http
Authorization: Bearer <jwt>
```

### Webhooks (Service Token)
```http
X-FM-Token: <service-token>
```

---

## API-Module

### Aufträge `/api/auftraege`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/auftraege` | Liste aller Aufträge |
| GET | `/api/auftraege/[id]` | Einzelner Auftrag |
| POST | `/api/auftraege` | Neuen Auftrag anlegen |
| PATCH | `/api/auftraege/[id]` | Auftrag aktualisieren |
| DELETE | `/api/auftraege/[id]` | Auftrag löschen |
| GET | `/api/auftraege/[id]/flaeche` | GeoJSON-Fläche |
| POST | `/api/auftraege/[id]/flaeche` | Fläche speichern |

### Mitarbeiter `/api/mitarbeiter`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/mitarbeiter` | Liste aller Mitarbeiter |
| GET | `/api/mitarbeiter/[id]` | Einzelner Mitarbeiter |
| POST | `/api/mitarbeiter` | Neuen Mitarbeiter anlegen |
| PATCH | `/api/mitarbeiter/[id]` | Mitarbeiter aktualisieren |
| DELETE | `/api/mitarbeiter/[id]` | Mitarbeiter löschen |
| GET | `/api/mitarbeiter/[id]/stunden` | Stundeneinträge |
| POST | `/api/mitarbeiter/[id]/account` | User-Account erstellen |

### Gruppen `/api/gruppen`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/gruppen` | Liste aller Gruppen |
| POST | `/api/gruppen` | Neue Gruppe anlegen |
| POST | `/api/gruppen/[id]/mitglieder` | Mitglied hinzufügen |
| DELETE | `/api/gruppen/[id]/mitglieder/[mitarbeiterId]` | Mitglied entfernen |

### Saisons `/api/saisons`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/saisons` | Liste aller Saisons |
| POST | `/api/saisons` | Neue Saison anlegen |
| GET | `/api/saisons/[id]/anmeldungen` | Anmeldungen |
| POST | `/api/saisons/[id]/anmelden` | Mitarbeiter anmelden |

### Protokolle `/api/protokolle`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/protokolle` | Liste aller Protokolle |
| POST | `/api/protokolle` | Neues Tagesprotokoll |
| GET | `/api/tagesprotokoll/[id]` | Einzelnes Protokoll |
| PATCH | `/api/tagesprotokoll/[id]` | Protokoll aktualisieren |

### Abnahmen `/api/abnahmen`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/abnahmen` | Liste aller Abnahmen |
| POST | `/api/abnahmen` | Neue Abnahme erstellen |
| GET | `/api/abnahmen/[id]` | Einzelne Abnahme |
| POST | `/api/abnahmen/[id]/protokoll` | Protokoll-PDF generieren |

### Rechnungen `/api/rechnungen`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/rechnungen` | Liste aller Rechnungen |
| POST | `/api/rechnungen` | Neue Rechnung erstellen |
| GET | `/api/rechnungen/[id]/pdf` | PDF herunterladen |
| GET | `/api/rechnungen/[id]/zugferd` | ZUGFeRD-XML |

### Lager `/api/lager`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/lager` | Alle Lagerartikel |
| POST | `/api/lager` | Neuer Artikel |
| POST | `/api/lager/[id]/bewegung` | Lagerbewegung buchen |
| GET | `/api/lager/reservierungen` | Alle Reservierungen |
| POST | `/api/lager/reservieren` | Material reservieren |

### Fuhrpark `/api/fuhrpark`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/fuhrpark` | Alle Fahrzeuge |
| GET | `/api/geraete` | Alle Geräte |
| POST | `/api/maschineneinsaetze` | Maschineneinsatz buchen |

### Dokumente `/api/dokumente`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/dokumente` | Liste aller Dokumente |
| POST | `/api/upload` | Datei hochladen |
| GET | `/api/dokumente/[id]/download` | Datei herunterladen |

### Betriebs-Assistent (KI) `/api/foerderung`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/foerderung/beraten` | KI-Beratung anfragen |
| POST | `/api/ki/chat` | Chat-Interface |
| GET | `/api/secondbrain/search` | SecondBrain Suche |

### Auth `/api/auth`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/auth/login` | Login (Web) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Aktuelle Session |
| POST | `/api/auth/2fa/setup` | 2FA einrichten |
| POST | `/api/auth/2fa/verify` | 2FA verifizieren |
| POST | `/api/auth/magic-link` | Magic-Link senden |

### App-Auth `/api/app`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/app/auth/login` | App-Login → JWT |
| POST | `/api/app/auth/refresh` | JWT erneuern |
| GET | `/api/app/profil` | Mitarbeiter-Profil |

### Sync `/api/sync`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/sync/pull` | Änderungen abrufen (App) |
| POST | `/api/sync/push` | Änderungen senden (App) |
| GET | `/api/sync/status` | Sync-Status |

### Webhooks `/api/anfragen`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/anfragen` | WordPress Wizard-Webhook |

### Cron `/api/cron`

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/cron/sync-auftraege` | WP ↔ FM Sync (täglich 6:00) |
| GET | `/api/cron/wetter-update` | Wetter aktualisieren (Mo 3:00) |

---

## Beispiel-Requests

### Auftrag erstellen

```bash
curl -X POST https://ka-forstmanager.vercel.app/api/auftraege \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<token>" \
  -d '{
    "titel": "Aufforstung Schwarzwald",
    "typ": "pflanzung",
    "flaeche_ha": 5.2,
    "standort": "Freiburg",
    "bundesland": "Baden-Württemberg"
  }'
```

### App-Login

```bash
curl -X POST https://ka-forstmanager.vercel.app/api/app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mitarbeiter@example.com",
    "password": "geheim123"
  }'
# → { "token": "eyJhbGc...", "user": {...} }
```

### KI-Beratung

```bash
curl -X POST https://ka-forstmanager.vercel.app/api/foerderung/beraten \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<token>" \
  -d '{
    "bundesland": "Bayern",
    "flaeche_ha": 10,
    "baumarten": ["Eiche", "Buche"],
    "frage": "Welche Förderung passt?"
  }'
```

---

## Fehler-Responses

| Status | Bedeutung |
|--------|-----------|
| 400 | Validation Error |
| 401 | Nicht authentifiziert |
| 403 | Keine Berechtigung |
| 404 | Ressource nicht gefunden |
| 500 | Server-Fehler |

```json
{
  "error": "Auftrag nicht gefunden",
  "code": "NOT_FOUND"
}
```

---

*Erstellt: 04.04.2026 | Amadeus (Auto-Loop B)*
