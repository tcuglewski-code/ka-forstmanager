# A1 Angebots-Agent — Go-Live-Checkliste

> Go-Live = Kill-Switch AUS. JEDES KI-Angebot ist ein Entwurf, der erst nach
> menschlicher Freigabe versendet wird (Mensch-im-Loop). KI ersetzt nicht die
> kaufmännische Verantwortung — sie beschleunigt nur den Entwurf.
> Stand: 2026-06-14

## 1. Technische Voraussetzungen (vor Go-Live, einmalig)

- [x] Build Exit 0 + Deploy READY auf Vercel (`ka-forstmanager.vercel.app`)
- [x] `bash scripts/check-a1-boundaries.sh` grün (alle Sicherheits-Invarianten)
- [x] A1-Unit-Tests grün: `npx tsx tests/a1/unit.test.ts` (Kalkulation + Zod-Schutz)
- [x] `npx tsc --noEmit` für alle A1-Dateien fehlerfrei (kein `any`)
- [x] Kill-Switch fail-safe: `isAgentAktiv()` liefert `false`, wenn DB-Row fehlt
      (`SELECT value FROM "SystemConfig" WHERE key = 'ang_agent_aktiv';`)
- [x] Default-Modell `claude-opus-4-8` (env-überschreibbar via `ANGEBOTE_KI_MODEL`)
- [x] Follow-up-Cron täglich (`0 8 * * *`) in vercel.json — KEINE Minuten-Crons (Hobby-Plan)
- [ ] `CRON_SECRET` in Vercel-Env gesetzt (Follow-up-Route verlangt es)
- [ ] `ANTHROPIC_API_KEY` in Vercel-Env (sonst greifen deterministische Fallback-Texte)
- [ ] `RESEND_API_KEY` in Vercel-Env (E-Mail-Versand + Follow-ups)
- [ ] `NEXT_PUBLIC_APP_URL` gesetzt (Portal-/Tracking-Links zeigen sonst auf Vercel-Default)

## 2. Stammdaten (Verantwortung: KA-Admin)

- [ ] Preisbuch gepflegt: Kategorien + Einträge mit aktuellen Basispreisen + MwSt
- [ ] Aufschläge geprüft (Steilheit, Entfernung, Menge, Saison, Subunternehmer)
- [ ] Mindestens 1 aktives Template je Leistungstyp (Erstaufforstung Laub/Nadel, Pflege)
- [ ] Firmen-Stammdaten in SystemConfig (`firma_name`, `firma_adresse`, `firma_email`)
- [ ] Historische Aufträge mit realen Rechnungs-Ist-Kosten vorhanden (RAG-Anker, optional)

## 3. Organisation

- [ ] Mensch-im-Loop-Prinzip verstanden: KI-Angebot = Entwurf, Versand nur nach Freigabe
- [ ] Freigabe-Berechtigte definiert (RBAC: Admin/GF)
- [ ] Förderhinweis als unverbindlich kommuniziert (keine Förderzusage durch das Angebot)
- [ ] DSGVO: Tracking-Pixel-Opt-out-Möglichkeit bekannt (`trackingOptOut` je Angebot)

## 4. Aktivierung (Kill-Switch AN)

1. Admin → Einstellungen → `ang_agent_aktiv = true` setzen
2. Erstes KI-Angebot über `/angebote/neu` erzeugen (Freitext oder Wizard-JSON)
3. Im Review (`/angebote/[id]`): Positionen prüfen, ggf. korrigieren, Gut/Besser/Best erzeugen
4. Freigeben → Versenden → Portal-Link + PDF beim Empfänger prüfen
5. Erste Tage: jedes Angebot vor Versand vollständig gegenlesen

Rollback: `ang_agent_aktiv = false` (sofort wirksam, ohne Deploy) → `/api/angebote/generieren` liefert 503.

## 5. Kostenkontrolle (NEVER #22)

- [ ] LLM-Budget gesetzt: `ang_llm_budget_monat_cent` (Default 5000 = 50 €)
- [ ] Wöchentlich KI-Kosten prüfen (`/api/angebote/stats` → `kiKostenEur`)
- [ ] Keine Massen-Generierung ohne Tomeks GO
- [ ] Pseudonymisierung vor LLM aktiv (Parser, Varianten-Text, Follow-up) — keine PII in Prompts

## 6. Nach Go-Live wiederkehrend

- [ ] Conversion beobachten (`/api/angebote/stats` → `conversionProzent`)
- [ ] Offene Follow-ups prüfen (`offeneFollowUps`); Follow-up-Texte stichprobenartig gegenlesen
- [ ] Tracking-Hashes bleiben pseudonym (IP nur als SHA-256) — DSGVO-Konformität halten
- [ ] Bei Modell-/Anbieterwechsel: Boundary-Check + Unit-Tests erneut ausführen
