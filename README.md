# ForstManager — Koch Aufforstung GmbH

Digitales Betriebssystem für Forstunternehmen. Erste Instanz: **Koch Aufforstung GmbH**.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Datenbank:** PostgreSQL via Neon + Prisma 7
- **Auth:** NextAuth.js v5 (JWT)
- **Styling:** Tailwind CSS v4, Dark Theme (#0f0f0f)
- **Icons:** Lucide React

## Module

- ✅ Auth (Login / Logout / JWT Session)
- ✅ Dashboard (Stats, Schnellzugriff)
- ✅ Mitarbeiter (CRUD, Suche, Filter)
- ✅ Saisons (CRUD, Cards)
- 🔜 Planung
- 🔜 Aufträge
- 🔜 Lager
- 🔜 Dokumente

## Setup (lokal)

### 1. Dependencies installieren
```bash
npm install
```

### 2. Umgebungsvariablen
Erstelle `.env.local`:
```
DATABASE_URL="postgresql://neondb_owner:REDACTED_DB_PASSWORD@ep-misty-moon-aldvc64t-pooler.c-3.eu-central-1.aws.neon.tech/ForstManagerKADB?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:REDACTED_DB_PASSWORD@ep-misty-moon-aldvc64t-pooler.c-3.eu-central-1.aws.neon.tech/ForstManagerKADB?sslmode=require&channel_binding=require"
NEXTAUTH_SECRET="forstmanager-secret-2026-ka"
NEXTAUTH_URL="http://localhost:3001"
NEXT_PUBLIC_APP_NAME="ForstManager"
NEXT_PUBLIC_CLIENT_NAME="Koch Aufforstung GmbH"
```

### 3. Datenbank initialisieren
```bash
npx prisma db push
```

### 4. Seed-Daten
```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 5. Dev Server
```bash
npm run dev -- -p 3001
```

## Deploy (Vercel)

1. Gehe zu [vercel.com/new](https://vercel.com/new)
2. Importiere `tcuglewski-code/ka-forstmanager` von GitHub
3. Framework: **Next.js** (wird automatisch erkannt)
4. Füge folgende Environment Variables hinzu:

| Variable | Wert |
|----------|------|
| `DATABASE_URL` | Neon Connection String |
| `DIRECT_URL` | Neon Connection String |
| `NEXTAUTH_SECRET` | `forstmanager-ka-secret-2026-prod` |
| `NEXTAUTH_URL` | `https://ka-forstmanager.vercel.app` (nach Deploy anpassen) |
| `NEXT_PUBLIC_APP_NAME` | `ForstManager` |
| `NEXT_PUBLIC_CLIENT_NAME` | `Koch Aufforstung GmbH` |

5. Deploy klicken

## Admin-Zugang

| E-Mail | Passwort |
|--------|---------|
| admin@koch-aufforstung.de | Admin2026! |

## Design

- **Hintergrund:** `#0f0f0f` (Cards: `#161616`)
- **Akzent:** `#2C3A1C` (Waldgrün), `emerald-400` als Highlight
- **Borders:** `#2a2a2a`
- **Font:** System-UI

## Nächste Schritte

1. Vercel manuell verbinden (GitHub Integration)
2. DB Push auf Neon ausführen (lokal: `npx prisma db push`)
3. Seed ausführen (`prisma/seed.ts`)
4. Planung-Modul implementieren
5. Aufträge-Modul implementieren
6. Mitarbeiter → User-Account-Verknüpfung
7. Rollen-basierte Zugriffssteuerung verfeinern
