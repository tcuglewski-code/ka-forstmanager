# MAT-024: Go-Live-Checkliste — A2 Material-Bedarf-Agent

> Go-Live = Kill-Switch AN, aber Bestellen bleibt Human-in-the-Loop (kein Auto-Versand).
> Mengen sind deterministisch (Reforest-Formeln); LLM nur als Fallback für unbekannte Baumarten.
> Stand: 2026-06-14

## 1. Technische Voraussetzungen (vor Go-Live, einmalig)

- [x] Build Exit 0 + Deploy READY auf Vercel (`ka-forstmanager.vercel.app`)
- [x] `bash scripts/check-a2-boundaries.sh` grün (alle Sicherheits-Invarianten)
- [x] Unit-Tests grün: reforest-rechner, zod/parseLlmJson, baue-positionen (`npx tsx tests/a2/*.test.ts`)
- [x] Live-Smoke: `/api/health` 200, `/api/material-bedarf` 401 (unauth), `berechnen` 401, `/material-bedarf` 307
- [x] Kill-Switch per Prisma verifiziert: `mat_agent_aktiv = false` (Default greift auch ohne DB-Row)
- [ ] SystemConfig-Defaults setzen (idempotent via `seedMatConfig()`):
      `mat_agent_aktiv=false`, `mat_llm_budget_monat_cent=3000`, `mat_verbiss_puffer_prozent=5`, `mat_pfahl_abstand_m=3`
- [ ] `ANTHROPIC_API_KEY` + `KI_ENABLED=true` in Vercel-Env (nur falls LLM-Fallback gewünscht)

## 2. Stammdaten (Verantwortung: KA-Admin)

- [ ] Lagerartikel mit Bezeichnungen gepflegt (für Lager-Abgleich; Fuzzy-Match auf Bezeichnung)
- [ ] Einkaufspreise an Lagerartikeln hinterlegt (`einkaufspreis` bzw. `lieferantPreis`) für Kostenschätzung
- [ ] Aktive Lieferanten mit E-Mail erfasst (Bestell-Benachrichtigung)
- [ ] Mind. eine aktive Baumschule (Default-Empfänger für Pflanzgut/Saatgut)
- [ ] Saatgut-Richtwerte geprüft (Lookup in `reforest-rechner.ts`: eiche/buche/fichte/kiefer/douglasie/erle/birke/ahorn/esche/lärche)

## 3. Organisation

- [ ] Berechnungs-Logik verstanden: Pflanzenzahl = ha × 10000 / (verband_x × verband_y), Verbiss +5 % Puffer
- [ ] Human-in-the-Loop klar: Bestellvorschläge müssen manuell per „Bestellen" ausgelöst werden
- [ ] Bei unbekannten Baumarten: Warnung im Ergebnis → manuell prüfen oder LLM-Schätzung akzeptieren
- [ ] Kostenangaben sind Schätzungen (netto, nur zu bestellende Menge × Einkaufspreis)

## 4. Aktivierung

1. Admin → SystemConfig `mat_agent_aktiv = true` setzen
2. Erstberechnung aus einem realen Angebot („Materialbedarf berechnen" auf Angebots-Detail)
3. Ergebnis prüfen: Positionen, Lager-Ampel, Bestellvorschläge gruppiert nach Lieferant
4. Erste echte Bestellung bewusst manuell auslösen, Lieferant-E-Mail kontrollieren

Rollback: `mat_agent_aktiv = false` (sofort wirksam, ohne Deploy → Berechnen liefert 503).

## 5. Nach Go-Live wiederkehrend

- [ ] LLM-Kosten beobachten (`MaterialBedarf.llmKostenCent`, Budget `mat_llm_budget_monat_cent`)
- [ ] Konfidenz der Positionen prüfen (LLM-Schätzungen vs. Formel)
- [ ] Bei häufigen unbekannten Baumarten: Saatgut-Richtwert in `reforest-rechner.ts` ergänzen
- [ ] Bei Modellwechsel: Boundary-Check + Unit-Tests erneut ausführen
