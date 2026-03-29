# Demo-Umgebung Setup

> Anleitung zum Aufsetzen einer passwortgeschützten Demo-Instanz für Sales-Termine.

## Quick Start

### 1. Neues Vercel-Projekt erstellen

```bash
# Im Vercel Dashboard:
# - "Add New Project" → Import ka-forstmanager
# - Framework: Next.js
# - Root Directory: ./
```

### 2. Neue Neon-Datenbank

```
# Neon Console: https://console.neon.tech
# - Neues Projekt "appfabrik-demo"
# - Connection String kopieren
```

### 3. Environment Variables setzen

In Vercel Settings → Environment Variables:

| Variable | Wert | Beschreibung |
|----------|------|--------------|
| `DATABASE_URL` | `postgresql://...@neon.tech/demo` | Neon Demo-DB |
| `DEMO_PASSWORD` | `AppFabrik2026` | Basic Auth Passwort |
| `NEXTAUTH_SECRET` | `demo-secret-min-32-chars-xxxxx` | NextAuth Secret |
| `NEXTAUTH_URL` | `https://demo.appfabrik.de` | Demo-URL |

### 4. Demo-Daten laden

```bash
# Lokal mit DATABASE_URL der Demo-DB:
export DATABASE_URL="postgresql://...@neon.tech/demo?sslmode=require"

# Prisma Schema deployen
npx prisma db push

# Demo-Daten einspielen
npm run db:seed-demo
```

### 5. Domain konfigurieren

- Vercel: Settings → Domains → `demo.appfabrik.de`
- DNS: CNAME `demo` → `cname.vercel-dns.com`

---

## Demo-Zugänge

Nach dem Seed sind folgende Accounts verfügbar:

| Rolle | Email | Passwort |
|-------|-------|----------|
| Admin | admin@demo.appfabrik.de | Demo2026! |
| Manager | maria@demo.appfabrik.de | Demo2026! |
| Worker | tom@demo.appfabrik.de | Demo2026! |

**Basic Auth (Seitenaufruf):** Benutzername beliebig, Passwort = `DEMO_PASSWORD`

---

## Demo-Daten enthalten

- **3 Kunden** (Privatwald, Kommune, Familie)
- **5 Mitarbeiter** (verschiedene Rollen)
- **4 Aufträge** (verschiedene Status: angefragt, geplant, in Arbeit, abgeschlossen)
- **6 Lagerbestände** (Pflanzgut, Material, Werkzeug)
- **2 Rechnungen** (offen, bezahlt)

---

## Wartung

### Daten zurücksetzen

```bash
# Alle Daten löschen und neu seeden
npx prisma db push --force-reset
npm run db:seed-demo
```

### Demo-Passwort ändern

In Vercel Environment Variables `DEMO_PASSWORD` anpassen → Redeploy.

---

## Sicherheit

⚠️ **Wichtig:**
- Demo-Umgebung enthält keine echten Kundendaten
- `DEMO_PASSWORD` alle 3 Monate rotieren
- Nach Sales-Demo: falls Interessent eigene Daten eingegeben hat, DB zurücksetzen
- Demo-DB niemals mit Produktions-DB verbinden

---

## Checkliste vor Sales-Demo

- [ ] Demo-URL erreichbar
- [ ] Basic Auth funktioniert
- [ ] Login mit admin@demo... funktioniert
- [ ] Dashboard zeigt Daten
- [ ] Mobile Ansicht getestet
- [ ] Beispiel-Auftrag öffnen
- [ ] Förderberater testen (falls aktiviert)
