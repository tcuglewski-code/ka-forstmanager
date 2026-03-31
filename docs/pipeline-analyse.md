# Pipeline-Analyse: ForstManager ↔ WordPress ↔ App

## Übersicht

Diese Dokumentation beschreibt den Datenfluss zwischen den drei Hauptsystemen:
- **WordPress (WP)**: Kundenportal, Wizards, Anfragen
- **ForstManager (FM)**: Zentrale Verwaltung, Aufträge, Mitarbeiter, Lager
- **Mobile App**: Offline-First Datenerfassung, Protokolle, Fotos

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│  WordPress  │ ←→  │ ForstManager  │ ←→  │  Mobile App │
│  (Kunden)   │     │   (Zentrale)  │     │  (Offline)  │
└─────────────┘     └───────────────┘     └─────────────┘
```

## Datenfluss-Übersicht

### WP → FM (Pull)
- Neue Anfragen aus Wizards
- Kundendaten-Updates
- Wizard-Formulardaten (`ka_wizard_daten`)
- Kontaktanfragen

### FM → WP (Push)
- Auftragsstatus-Updates
- Mitarbeiter/Gruppenführer-Informationen
- Abnahme-Protokolle
- Rechnungsstatus

### FM → App (Pull)
- Aufträge und Zuweisungen
- Mitarbeiterlisten
- Lagerbestände
- Konfigurationsdaten

### App → FM (Push)
- Tagesprotokolle
- GPS-Tracks
- Fotos und Medien
- Zeiterfassung
- Offline-Queue-Synchronisation

## Führende Datenquellen

| Entität | Führendes System | Sync-Richtung |
|---------|-----------------|---------------|
| Anfragen/Wizards | WordPress | WP → FM |
| Aufträge | ForstManager | FM → WP, FM → App |
| Mitarbeiter | ForstManager | FM → App |
| Lager | ForstManager | FM → App |
| Tagesprotokolle | Mobile App | App → FM |
| Kunden (Waldbesitzer) | WordPress | WP → FM |
| Rechnungen | ForstManager | FM → WP (Status) |
| Abnahmen | ForstManager | FM ← App (Erfassung) |

## Sync-Strategie

### 1. WordPress ↔ ForstManager
- **Trigger**: Webhook von WP bei neuen Anfragen
- **Polling**: Alle 15 Min. für Status-Updates
- **Konflikt-Auflösung**: Last-Write-Wins mit `localUpdatedAt` vs `wpSyncedAt`

### 2. ForstManager ↔ Mobile App
- **Offline-Queue**: App speichert Änderungen lokal
- **Sync bei Verbindung**: Push ausstehender Änderungen
- **Deduplication**: Via `offlineId` in Requests
- **Delta-Sync**: Nur geänderte Datensätze seit letztem Sync

## Identifizierte Schwachstellen

### 1. Konflikt-Erkennung
- **Problem**: Keine automatische Konflikt-Erkennung bei gleichzeitiger Bearbeitung
- **Risiko**: Datenverlust bei parallelen Änderungen
- **Lösung**: Implementierung von Optimistic Locking mit Version-Feldern

### 2. Offline-Sync
- **Problem**: Große Datenmengen bei langem Offline-Betrieb
- **Risiko**: Sync-Timeouts, Reihenfolge-Probleme
- **Lösung**: Chunk-basierte Uploads, Prioritäts-Queue

### 3. WP-Anbindung
- **Problem**: REST-API ohne Authentifizierung für sensitive Operationen
- **Risiko**: Sicherheitslücken
- **Lösung**: API-Key-basierte Auth, Rate-Limiting

### 4. Medien-Sync
- **Problem**: Fotos werden direkt hochgeladen ohne Optimierung
- **Risiko**: Bandbreitenprobleme, hohe Kosten
- **Lösung**: Client-seitige Komprimierung, Progressive Upload

## Verbesserungsplan

### Phase 1: Robustheit (Sprint KQ)
- [x] SyncLog für Audit-Trail implementieren
- [x] WPSyncEngine Klasse für zentrale Logik
- [ ] Error-Recovery für fehlgeschlagene Syncs
- [ ] Retry-Mechanismus mit Exponential Backoff

### Phase 2: Konflikt-Handling (Sprint KR)
- [ ] Version-Feld zu kritischen Entitäten
- [ ] Merge-UI für Konflikte
- [ ] Automatische Konflikt-Benachrichtigung

### Phase 3: Performance (Sprint KS)
- [ ] Delta-Sync für große Tabellen
- [ ] Batch-Operations für Bulk-Updates
- [ ] Caching-Layer für häufige Abfragen

### Phase 4: Monitoring (Sprint KT)
- [ ] Sync-Metriken Dashboard
- [ ] Alerting bei Sync-Fehlern
- [ ] Performance-Tracking

## API-Endpunkte

### ForstManager
- `GET /api/sync/status` — Sync-Status und letzte Synchronisation
- `POST /api/sync/wp` — Manueller WP-Sync auslösen
- `GET /api/sync/logs` — SyncLog-Einträge abrufen

### WordPress
- `POST /wp-json/ka/v1/webhook` — Webhook für neue Anfragen
- `GET /wp-json/ka/v1/anfragen` — Anfragen abrufen
- `PATCH /wp-json/ka/v1/auftrag/{id}` — Auftragsstatus updaten

### Mobile App
- `GET /api/app/sync/pull` — Änderungen seit Timestamp
- `POST /api/app/sync/push` — Offline-Queue hochladen
- `POST /api/app/sync/media` — Medien-Upload

## Datenmodell-Mapping

```
WordPress (ka_projekt)         ForstManager (Auftrag)
─────────────────────         ────────────────────────
ID                    ←→      wpProjektId
post_title            ←→      titel  
post_status           ←→      status (mapped)
ka_wizard_daten       ←→      wizardDaten (JSON)
ka_angelegt           ←→      wpErstelltAm
_custom_fields        ←→      diverse Felder
```

## Sicherheitsrichtlinien

1. **API-Keys** rotieren alle 90 Tage
2. **Sensitive Daten** nur verschlüsselt übertragen (HTTPS)
3. **Rate-Limiting**: Max. 100 Requests/Minute pro Client
4. **Audit-Log**: Alle Sync-Operationen werden geloggt
5. **IP-Whitelisting** für WP-Webhooks

## Verantwortlichkeiten

| System | Team | Kontakt |
|--------|------|---------|
| WordPress | Bruno (WP Dev) | — |
| ForstManager | Volt/Archie | — |
| Mobile App | Nomad | — |
| Infrastruktur | Amadeus | — |

---

*Zuletzt aktualisiert: 2026-04-01*
*Version: 1.0.0*
