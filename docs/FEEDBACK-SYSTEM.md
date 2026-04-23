# Feedback-System — FM-43

> Stand: 2026-04-24

## Wo landet Feedback?

Feedback fließt in **drei Kanäle**:

1. **Datenbank:** `FeedbackEintrag` Tabelle in ForstManager DB
2. **Telegram:** Sofortige Benachrichtigung an Admin-Chat-IDs
3. **Mission Control:** Automatisch als Task angelegt

## API

```
POST /api/feedback
Body: { typ: "bug"|"wunsch"|"frage", text: string, seite: string, nutzer: string }
```

- **Honeypot:** `website` Feld zur Bot-Prävention
- **Sanitization:** HTML wird via `stripHtml()` entfernt
- **Typen:**
  - `bug` — Fehlermeldung
  - `wunsch` — Feature-Wunsch
  - `frage` — Allgemeine Frage

## Frontend

`FeedbackButton.tsx` — Floating Action Button (rechts unten, fixed)
- Modal mit Typ-Auswahl + Textarea (5-5000 Zeichen)
- Character Counter
- Erfolgs-Animation
- Seite wird automatisch aus `window.location.pathname` ermittelt

## Integration

- In AppShell/Layout eingebunden → auf jeder Seite verfügbar
- Nutzer-Name aus Session übernommen
- Kein Login erforderlich für Feedback (aber Nutzer wird gespeichert wenn eingeloggt)

## Schema

```prisma
model FeedbackEintrag {
  id        String   @id @default(cuid())
  typ       String   // bug, wunsch, frage
  text      String
  seite     String
  nutzer    String
  createdAt DateTime @default(now())
}
```
