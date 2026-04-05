# ForstManager — Datenbank-Dokumentation

> PostgreSQL (Neon Serverless) mit Prisma ORM

## Übersicht

| Eigenschaft | Wert |
|------------|------|
| **Provider** | Neon (Serverless PostgreSQL) |
| **ORM** | Prisma 7.5 |
| **Schema** | `prisma/schema.prisma` |
| **Migrations** | `prisma db push` (Schema-First) |

## Entity-Relationship-Diagramm (vereinfacht)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│   Session   │     │  MagicToken │
│             │     └─────────────┘     └─────────────┘
│  • id       │
│  • email    │──────────────────────┐
│  • role     │                      │
│  • 2FA      │                      │
└──────┬──────┘                      │
       │ 1:1                         │
       ▼                             │
┌─────────────┐                      │
│ Mitarbeiter │<─────────────────────┘
│             │
│  • vorname  │────┬───────────────────────────────────┐
│  • nachname │    │                                   │
│  • stunden  │    │ n:m                               │
└──────┬──────┘    ▼                                   │
       │     ┌────────────┐     ┌───────────┐          │
       │     │GruppeMitgl.│─────│  Gruppe   │          │
       │     └────────────┘     │           │          │
       │                        │  • name   │          │
       │                        │  • saison │          │
       │                        └─────┬─────┘          │
       │                              │                │
       │         ┌────────────────────┘                │
       │         ▼                                     │
       │    ┌─────────────┐                            │
       │    │   Saison    │                            │
       │    │             │                            │
       │    │  • name     │                            │
       │    │  • typ      │                            │
       │    │  • status   │                            │
       │    └──────┬──────┘                            │
       │           │                                   │
       ▼           ▼                                   │
┌─────────────────────────────────────────────────────────┐
│                      AUFTRAG                             │
│                                                          │
│  • id, titel, typ, status                                │
│  • flaeche_ha, standort, bundesland                     │
│  • waldbesitzer, waldbesitzerEmail                      │
│  • lat, lng, flaecheGeojson                             │
│  • wizardDaten (JSON)                                   │
│  • wpProjektId (WP-Sync)                                │
└───────────────────────┬──────────────────────────────────┘
                        │
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
┌───────────┐    ┌────────────┐    ┌───────────┐
│  Abnahme  │    │Tagesprotok.│    │ Rechnung  │
└───────────┘    └────────────┘    └───────────┘
      │                │
      ▼                ▼
┌───────────┐    ┌────────────┐
│Mangelprot.│    │Stundeneint.│
└───────────┘    └────────────┘
```

## Kern-Models

### User & Auth

```prisma
model User {
  id                   String       @id @default(cuid())
  name                 String
  email                String       @unique
  password             String       # bcrypt-Hash
  role                 String       @default("mitarbeiter")
  # Rollen: ka_admin, ka_gruppenführer, ka_mitarbeiter, baumschule, kunde
  
  permissions          String[]     @default([])
  twoFactorEnabled     Boolean      @default(false)
  twoFactorSecret      String?
  
  sessions             Session[]
  mitarbeiter          Mitarbeiter?
}

model Session {
  id        String   @id
  userId    String
  token     String   @unique
  expiresAt DateTime
}

model MagicToken {
  id        String   @id
  email     String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
}
```

### Mitarbeiter

```prisma
model Mitarbeiter {
  id                String   @id
  userId            String?  @unique  # Optional: verknüpfter User
  vorname           String
  nachname          String
  email             String?
  telefon           String?
  
  # Stammdaten
  adresse           String?
  plz               String?
  ort               String?
  geburtsdatum      DateTime?
  eintrittsdatum    DateTime?
  
  # Arbeit
  rolle             String   @default("mitarbeiter")
  qualifikationen   String?
  stundenlohn       Float?
  vollkostenSatz    Float?
  
  # Notfallkontakt
  notfallName       String?
  notfallTelefon    String?
  notfallBeziehung  String?
  
  # Relationen
  gruppen           GruppeMitglied[]
  stundeneintraege  Stundeneintrag[]
  abwesenheiten     Abwesenheit[]
  qualifikationenRel MitarbeiterQualifikation[]
}
```

### Auftrag

```prisma
model Auftrag {
  id                  String   @id
  nummer              String?  @unique  # AU-YYYY-NNNN
  titel               String
  typ                 String   # pflanzung, kulturschutz, saatguternte, etc.
  status              String   @default("anfrage")
  # Status: anfrage → geplant → aktiv → abgeschlossen → abgerechnet
  
  # Fläche
  flaeche_ha          Float?
  standort            String?
  bundesland          String?
  lat                 Float?
  lng                 Float?
  flaecheGeojson      Json?    # GeoJSON Polygon
  
  # Kunde
  waldbesitzer        String?
  waldbesitzerEmail   String?
  waldbesitzerTelefon String?
  
  # Planung
  baumarten           String?
  zeitraum            String?
  startDatum          DateTime?
  endDatum            DateTime?
  
  # WordPress-Sync
  wpProjektId         String?  @unique
  wizardDaten         Json?
  syncStatus          String?  @default("synced")
  
  # Relationen
  saisonId            String?
  gruppeId            String?
  abnahmen            Abnahme[]
  protokolle          Tagesprotokoll[]
  rechnungen          Rechnung[]
  logs                AuftragLog[]
}
```

### Lager

```prisma
model LagerArtikel {
  id             String   @id
  name           String
  kategorie      String   @default("material")
  einheit        String   @default("Stück")
  bestand        Float    @default(0)
  mindestbestand Float    @default(0)
  einkaufspreis  Float?
  verkaufspreis  Float?
  lieferantId    String?
  
  bewegungen     LagerBewegung[]
  reservierungen LagerReservierung[]
}

model LagerReservierung {
  id           String   @id
  artikelId    String
  auftragId    String
  menge        Float
  status       String   @default("RESERVIERT")
  # Status: RESERVIERT → VERBRAUCHT oder ZURUECK
}

model LagerBewegung {
  id            String   @id
  artikelId     String
  typ           String   # eingang, ausgang, inventur
  menge         Float
  referenz      String?  # z.B. Auftrags-ID
  auftragId     String?
  mitarbeiterId String?
}
```

### Dokumente

```prisma
model Dokument {
  id            String   @id
  name          String
  typ           String   # rechnung, protokoll, foto, vertrag, etc.
  pfad          String   # Nextcloud-Pfad oder lokaler Pfad
  groesse       Int?
  mimeType      String?
  
  # Zuordnungen (alle optional)
  auftragId     String?
  mitarbeiterId String?
  saisonId      String?
  abnahmeId     String?
  rechnungId    String?
}
```

### Sync & Audit

```prisma
model SyncLog {
  id         String   @id
  entityType String   # Auftrag, Kunde, etc.
  entityId   String
  direction  String   # WP_TO_FM / FM_TO_WP
  status     String   # OK / ERROR / CONFLICT
  error      String?
  timestamp  DateTime @default(now())
}

model AuftragLog {
  id        String   @id
  auftragId String
  aktion    String   # status_geaendert, mitarbeiter_zugewiesen, etc.
  von       String?
  nach      String?
  userId    String?
  createdAt DateTime @default(now())
}

model ActivityLog {
  id         String   @id
  action     String
  entityType String
  entityId   String
  entityName String
  userId     String?
  metadata   String?
  createdAt  DateTime @default(now())
}
```

## Indizes

```prisma
@@index([entityType, entityId])  # SyncLog
@@index([timestamp])             # SyncLog
@@index([auftragId])             # LagerReservierung
@@index([artikelId])             # LagerReservierung
@@unique([gruppeId, mitarbeiterId])  # GruppeMitglied
@@unique([saisonId, mitarbeiterId])  # SaisonAnmeldung
```

## Datenbank-Operationen

### Schema aktualisieren

```bash
# Schema pushen (ohne Migration-Files)
npx prisma db push

# Studio öffnen
npx prisma studio

# Seed ausführen
npm run db:seed      # Produktiv
npm run db:seed-demo # Demo-Daten
```

### Neon-spezifisch

```typescript
// src/lib/prisma.ts
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;  // WebSocket für Serverless

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});
```

### Point-in-Time Recovery

Neon PITR ist auf 7 Tage konfiguriert. Restore über Neon Dashboard.

---

## Daten-Lifecycle

### Auftrag-Status

```
anfrage → geplant → aktiv → abgeschlossen → abgerechnet
    ↓
 storniert
```

### Lager-Reservierung

```
RESERVIERT → VERBRAUCHT (Material verwendet)
     ↓
   ZURUECK (Stornierung)
```

### Sync-Status (WP ↔ FM)

```
synced ↔ local_changes ↔ conflict
```

---

*Erstellt: 04.04.2026 | Amadeus (Auto-Loop B)*
