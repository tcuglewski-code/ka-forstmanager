# ForstManager — Architektur

## Technologie-Stack

| Layer | Technologie | Version |
|-------|-------------|---------|
| **Framework** | Next.js (App Router) | 16.2.1 |
| **Runtime** | Node.js | 22.x |
| **Sprache** | TypeScript | 5.x |
| **UI** | React | 19.2 |
| **Styling** | Tailwind CSS | 4.x |
| **ORM** | Prisma | 7.5 |
| **DB** | PostgreSQL (Neon) | Serverless |
| **Auth** | Custom Sessions + TOTP | — |
| **Hosting** | Vercel | Edge + Serverless |

## Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Browser       │   Mobile App    │   WordPress (Webhooks)       │
│   (Next.js)     │   (Expo)        │   (Hostinger)                │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Next.js App Router                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │ │
│  │  │ (dashboard)│ │  /api/*  │  │  /kunde  │  │  /auth     │  │ │
│  │  │  Pages   │  │  Routes  │  │  Portal  │  │  Login/2FA │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Neon DB       │  │   Nextcloud     │  │   External APIs │
│  (PostgreSQL)   │  │  (Dokumente)    │  │                 │
│                 │  │                 │  │  • Anthropic    │
│  • Users        │  │  /Koch-         │  │  • Resend       │
│  • Aufträge     │  │   Aufforstung/  │  │  • Open-Meteo   │
│  • Mitarbeiter  │  │                 │  │  • Telegram     │
│  • Lager        │  │                 │  │                 │
│  • ...          │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Authentifizierung

### Session-basiert (keine JWT für Web)

```typescript
// src/lib/auth.ts
Session {
  id: cuid
  userId: ref → User
  token: unique (Cookie)
  expiresAt: DateTime
}
```

**Flow:**
1. Login mit Email + Passwort (bcryptjs)
2. Optional: 2FA TOTP via OTPAuth
3. Session-Token im HTTP-Only Cookie
4. Middleware prüft `/api/*` und `/(dashboard)/*`

### App-Authentifizierung

```typescript
// src/lib/app-auth.ts + app-jwt.ts
- Login: POST /api/app/auth/login → JWT
- Refresh: POST /api/app/auth/refresh
- JWT: RS256, 7 Tage Gültigkeit
```

### Kundenportal (Magic-Link)

```typescript
// MagicToken Model
- User erhält Link per Email
- Token: 15 Min gültig, einmalig verwendbar
- Rolle: "kunde" mit eingeschränkten Permissions
```

## Rollen & Permissions

| Rolle | Zugriff |
|-------|---------|
| `ka_admin` | Vollzugriff auf alle Module |
| `ka_gruppenführer` | Gruppen, Protokolle, Abnahmen |
| `ka_mitarbeiter` | Eigene Stunden, Einsätze (via App) |
| `baumschule` | Liefer-Portal, Aufträge einsehen |
| `kunde` | Kundenportal, eigene Projekte |

### Permission-Array

```typescript
User.permissions: string[] = [
  'auftraege.view',
  'auftraege.edit',
  'mitarbeiter.manage',
  'lager.manage',
  'rechnungen.create',
  // ...
]
```

## API-Patterns

### Route Handler (App Router)

```typescript
// src/app/api/auftraege/route.ts
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  const auftraege = await prisma.auftrag.findMany();
  return NextResponse.json(auftraege);
}
```

### Middleware

```typescript
// src/middleware.ts
- /api/* → Session-Validierung
- /(dashboard)/* → Redirect zu /login wenn keine Session
- /kunde/* → Magic-Link Session
```

## Cron-Jobs (Vercel)

| Schedule | Route | Funktion |
|----------|-------|----------|
| `0 6 * * *` | `/api/cron/sync-auftraege` | WP ↔ FM Sync |
| `0 3 * * 1` | `/api/cron/wetter-update` | Wetterdaten aktualisieren |

## Key Libraries

| Library | Zweck |
|---------|-------|
| `@anthropic-ai/sdk` | Betriebs-Assistent (KI) |
| `@react-pdf/renderer` | PDF-Generierung |
| `docxtemplater` | DOCX-Templates |
| `react-leaflet` | Karten + GeoJSON |
| `@dnd-kit/*` | Drag-and-Drop (Wochenplanung) |
| `zod` | Schema-Validierung |
| `resend` | Transaktionale E-Mails |
| `xlsx` | Excel Import/Export |
| `jose` | JWT für App-Auth |
| `otpauth` | 2FA TOTP |

## Fehlerbehandlung

- API-Errors: JSON `{ error: string, code?: string }`
- Client-Errors: Sonner Toast Notifications
- Logging: `ActivityLog` Model für Audit-Trail

---

*Erstellt: 04.04.2026 | Amadeus (Auto-Loop B)*
