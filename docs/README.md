# ForstManager — Koch Aufforstung GmbH

> Zentrale Web-Anwendung für die Verwaltung von Aufforstungsprojekten, Mitarbeitern, Lagern und Dokumenten.

## Übersicht

| Eigenschaft | Wert |
|------------|------|
| **URL** | https://ka-forstmanager.vercel.app |
| **Repo** | tcuglewski-code/ka-forstmanager |
| **Framework** | Next.js 16.2 (App Router) |
| **Datenbank** | PostgreSQL (Neon Serverless) |
| **ORM** | Prisma 7.5 |
| **Hosting** | Vercel |
| **Auth** | Custom Session + 2FA TOTP |

## Features

### Kernmodule
- **Aufträge** — Anfragen, Projekte, Status-Tracking, GeoJSON-Flächen
- **Mitarbeiter** — Stammdaten, Qualifikationen, Stundenabrechnungen
- **Gruppen** — Teams mit Gruppenführer, Saisonzuordnung
- **Saisons** — Pflanz-/Ernte-Saisons mit Anmeldungen
- **Tagesprotokolle** — Dokumentation der Feldarbeit
- **Abnahmen** — Qualitätskontrolle mit Fotos + Mängelprotokollen
- **Rechnungen** — PDF-Generierung, ZUGFeRD-Export
- **Lager** — Materialverwaltung, Reservierungen, Lieferanten-Bestellungen
- **Fuhrpark** — Fahrzeuge, Geräte, Maschineneinsätze
- **Dokumente** — Uploads mit Nextcloud-Integration
- **Wochenplanung** — Einsätze planen per Drag-and-Drop
- **Betriebs-Assistent** — KI-gestützte Förderberatung (Claude API)

### Integrationen
- **WordPress** — Bidirektionaler Sync (Wizard-Anfragen → Aufträge)
- **Mobile App** — REST API für ka-app (Offline-Sync)
- **Kundenportal** — Magic-Link Login für Waldbesitzer
- **Telegram** — Benachrichtigungen an Kunden
- **Baumschulen** — Externes Lieferantenportal

## Verzeichnisstruktur

```
ka-forstmanager/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (dashboard)/     # Authentifizierte Bereiche
│   │   ├── api/             # 50+ API-Routes
│   │   ├── auth/            # Login/Logout
│   │   ├── kunde/           # Kundenportal
│   │   └── login/           # Login-Seite
│   ├── components/          # React-Komponenten
│   │   ├── ui/              # Basis-UI (shadcn-Style)
│   │   ├── dashboard/       # Dashboard-Widgets
│   │   ├── auftraege/       # Auftrags-Komponenten
│   │   └── ...
│   └── lib/                 # Utilities & Services
│       ├── prisma.ts        # DB-Client
│       ├── auth.ts          # Session-Management
│       ├── email.ts         # Resend-Integration
│       ├── ki/              # Claude API
│       └── sync/            # WP-Sync-Logik
├── prisma/
│   ├── schema.prisma        # Datenbankschema
│   ├── seed.ts              # Produktiv-Seed
│   └── seed-demo.ts         # Demo-Daten
├── public/                  # Statische Assets
└── tests/                   # Playwright E2E-Tests
```

## Schnellstart

```bash
# Dependencies
npm install

# Umgebungsvariablen (.env.local)
DATABASE_URL=postgresql://...
AUTH_SECRET=...

# DB initialisieren
npx prisma db push
npx prisma db seed

# Dev-Server
npm run dev
```

## Weitere Dokumentation

- [Architecture](./architecture.md) — Technische Architektur
- [API](./api.md) — REST API Referenz
- [Database](./database.md) — Datenbankschema & Relationen
- [Deployment](./deployment.md) — Vercel Deployment & Konfiguration

---

*Erstellt: 04.04.2026 | Amadeus (Auto-Loop B)*
