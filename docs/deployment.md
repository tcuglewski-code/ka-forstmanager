# ForstManager — Deployment

> Automatisiertes Deployment auf Vercel mit Neon PostgreSQL

## Hosting-Setup

| Service | Anbieter | Funktion |
|---------|----------|----------|
| **App Hosting** | Vercel | Next.js (Serverless + Edge) |
| **Database** | Neon | PostgreSQL Serverless |
| **Dokumente** | Nextcloud | Dateiablage |
| **E-Mails** | Resend | Transaktionale E-Mails |
| **KI** | Anthropic | Claude API für Beratung |

## Vercel Projekt

| Eigenschaft | Wert |
|------------|------|
| **Project** | ka-forstmanager |
| **URL** | https://ka-forstmanager.vercel.app |
| **Framework** | Next.js (Auto-detected) |
| **Node** | 22.x |
| **Region** | fra1 (Frankfurt) |

## Deployment-Flow

```
GitHub Push → Vercel Webhook → Build → Deploy
     │
     ▼
┌─────────────────────────────────────────────┐
│ Build Steps:                                │
│ 1. npm install                              │
│ 2. prisma generate                          │
│ 3. prisma db push --accept-data-loss        │
│ 4. next build                               │
└─────────────────────────────────────────────┘
```

### package.json Build Script

```json
{
  "scripts": {
    "build": "prisma generate && (prisma db push --accept-data-loss || echo \"DB push skipped\") && next build"
  }
}
```

## Environment Variables (Vercel)

### Erforderlich

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Auth
AUTH_SECRET=<random-32-chars>

# Neon (für Serverless Driver)
NEON_DATABASE_URL=<same-as-DATABASE_URL>
```

### Optional / Feature-Flags

```env
# KI-Features
ANTHROPIC_API_KEY=sk-ant-...

# E-Mail
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@koch-aufforstung.de

# Nextcloud
NEXTCLOUD_URL=http://...
NEXTCLOUD_USER=...
NEXTCLOUD_PASSWORD=...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_CHAT_ID=...

# Wetter
OPENMETEO_API_KEY=...  # Optional, Open-Meteo ist free

# WordPress Sync
WP_SYNC_TOKEN=...
WP_API_URL=https://peru-otter-113714.hostingersite.com/wp-json
```

## Vercel Cron-Jobs

Definiert in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-auftraege",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/wetter-update",
      "schedule": "0 3 * * 1"
    }
  ]
}
```

| Cron | Schedule | Beschreibung |
|------|----------|--------------|
| sync-auftraege | Täglich 6:00 UTC | WordPress ↔ ForstManager Sync |
| wetter-update | Montag 3:00 UTC | Wetterdaten für Aufträge |

## Deployment Befehle

### Manuelles Deployment

```bash
# Mit Vercel CLI
vercel --prod

# Mit Token (CI/CD)
VERCEL_TOKEN=... vercel --prod --yes
```

### Lokale Entwicklung

```bash
# .env.local mit DATABASE_URL
npm run dev

# DB Schema pushen
npm run db:push

# Prisma Studio
npm run db:studio
```

## Branches & Previews

| Branch | Deployment |
|--------|------------|
| `main` | Production (ka-forstmanager.vercel.app) |
| `*` | Preview URLs |

## Monitoring

### Vercel Dashboard
- Build Logs
- Function Logs
- Analytics (Core Web Vitals)

### Neon Dashboard
- Query Performance
- Connection Pooling
- Branching (für Tests)

### Anwendungs-Logging
- `ActivityLog` Model für Audit-Trail
- `SyncLog` für WP-Synchronisation
- `AuftragLog` für Auftrags-Historie

## Rollback

```bash
# Zu vorherigem Deployment
vercel rollback

# Zu spezifischem Deployment
vercel rollback <deployment-url>
```

## Security Checklist

- [ ] `AUTH_SECRET` ist zufällig generiert (32+ Zeichen)
- [ ] Alle API-Keys sind in Vercel Environment, nicht im Code
- [ ] `DATABASE_URL` hat `sslmode=require`
- [ ] Rate-Limiting aktiv (`src/lib/rate-limit.ts`)
- [ ] 2FA für Admin-Accounts aktiviert
- [ ] Vercel Protection Bypass Token für Automation

## Troubleshooting

### Build fehlgeschlagen

```bash
# Lokal testen
npm run build

# Prisma-Client regenerieren
npx prisma generate
```

### DB Connection Timeout

Neon Serverless braucht WebSocket:
```typescript
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;
```

### Cron läuft nicht

1. Vercel Pro/Enterprise Account nötig für Crons
2. `vercel.json` korrekt im Root
3. Route muss GET akzeptieren

---

*Erstellt: 04.04.2026 | Amadeus (Auto-Loop B)*
