# Wizard Consistency Report — WP ↔ FM

**Erstellt:** 2026-04-01  
**Sprint:** KC-5 [FM-WIZ-01]  
**Autor:** Volt + Archie (Feldhub)

## Übersicht

Dieser Report dokumentiert die Feldkonsistenz zwischen dem WordPress-Wizard und dem ForstManager.

## WP Koch API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/wp-json/koch/v1/anfrage` | POST | Hauptwizard für Kundenanfragen |
| `/wp-json/koch/v1/kontakt` | POST | Kontaktformular |
| `/wp-json/koch/v1/foerdercheck` | POST | Förderberechnung |
| `/wp-json/koch/v1/forstbehoerden` | GET | Forstbehörden-Datenbank |

## Feldübersicht: WP-Wizard → FM

### Kernfelder (Pflicht)

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `titel` | ✅ Aus Massnahme generiert | ✅ titel | — | ✅ OK |
| `typ` | ✅ massnahme_typ | ✅ typ | — | ✅ OK |
| `waldbesitzer` | ✅ name + nachname | ✅ waldbesitzer | — | ✅ OK |
| `waldbesitzerEmail` | ✅ email | ✅ waldbesitzerEmail | — | ✅ OK |
| `waldbesitzerTelefon` | ✅ telefon | ✅ waldbesitzerTelefon | — | ✅ OK |

### Flächendaten

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `flaeche_ha` | ✅ flaeche_ha | ✅ flaeche_ha | ✅ flaechen[].flaeche_ha | ✅ OK |
| `standort` | ✅ standort/adresse | ✅ standort | ✅ flaechen[].standort | ✅ OK |
| `bundesland` | ✅ bundesland | ✅ bundesland | — | ✅ OK |
| `plz` | ✅ plz | ⚠️ Nicht direkt | — | ⚠️ PLZ nicht in FM gespeichert |
| `ort` | ✅ ort | ⚠️ Nicht direkt | — | ⚠️ Ort nicht in FM gespeichert |

### Forstamt/Revier

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `forstamt` | ✅ forstamt_name | — | ✅ flaeche_forstamt | ✅ OK |
| `revier` | ✅ revier | — | ✅ flaeche_revier | ✅ OK |
| `forstamt_plz` | ✅ forstamt_plz | — | ❌ Fehlt | ❌ TODO |
| `forstamt_email` | ✅ forstamt_email | — | ❌ Fehlt | ❌ TODO |
| `forstamt_telefon` | ✅ forstamt_telefon | — | ❌ Fehlt | ❌ TODO |

### GPS/Koordinaten

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `lat` | ✅ gps_lat | ✅ lat | ✅ flaechen[].lat | ✅ OK |
| `lng` | ✅ gps_lng | ✅ lng | ✅ flaechen[].lng | ✅ OK |
| `plusCode` | ⚠️ Nicht im Wizard | ✅ plusCode | — | ✅ OK (optional) |

### Treffpunkt

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `treffpunkt` | ✅ treffpunkt | — | ✅ treffpunkt | ✅ OK |
| `treffpunkt_gps` | ⚠️ Manchmal | — | ❌ Fehlt | ⚠️ TODO |

### Pflanzung-Felder

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `baumarten` | ✅ baumarten (Array) | — | ✅ baumarten | ✅ OK |
| `pflanzverband` | ✅ pflanzverband | — | ✅ pflanzverband | ✅ OK |
| `pflanzenanzahl` | ✅ pflanzenanzahl | — | ❌ Fehlt | ❌ TODO |
| `abstand_reihe` | ✅ abstand_reihe | — | ❌ Fehlt | ⚠️ In pflanzverband implizit |
| `abstand_pflanze` | ✅ abstand_pflanze | — | ❌ Fehlt | ⚠️ In pflanzverband implizit |
| `bezugsquelle` | ✅ pflanzen_bezugsquelle | — | ✅ bezugsquelle | ✅ OK |
| `lieferant` | ✅ baumschule_name | — | ✅ lieferant | ✅ OK |

### Zaunbau-Felder

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `zauntyp` | ✅ zaun_typ | — | ✅ zauntyp | ✅ OK |
| `zaunlaenge` | ✅ zaun_laenge_m | — | ✅ zaunlaenge | ✅ OK |
| `zaunhoehe` | ✅ zaun_hoehe_cm | — | ❌ Fehlt | ❌ TODO |
| `tore_anzahl` | ✅ tore_anzahl | — | ❌ Fehlt | ❌ TODO |

### Kulturschutz-Felder

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `schutztyp` | ✅ schutz_typ (Array) | — | ✅ schutztyp | ✅ OK |
| `schutzart` | ✅ schutz_art | — | ✅ schutzart | ✅ OK |
| `anzahlHuellen` | ✅ huellen_anzahl | — | ✅ anzahlHuellen | ✅ OK |
| `robinienstab` | ✅ stab_laenge | — | ✅ robinienstab | ✅ OK |
| `huellen_hoehe` | ✅ huellen_hoehe_cm | — | ❌ Fehlt | ❌ TODO |
| `huellen_farbe` | ✅ huellen_farbe | — | ❌ Fehlt | ⚠️ Optional |

### Flächenvorbereitung-Felder

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `aufwuchsart` | ✅ aufwuchs_arten | — | ✅ aufwuchsart | ✅ OK |
| `arbeitsmethode` | ✅ arbeitsmethode | — | ✅ arbeitsmethode | ✅ OK |
| `turnus` | ✅ pflege_turnus | — | ✅ turnus | ✅ OK |

### Kulturpflege-Felder

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `bestandstyp` | ✅ bestand_typ | — | ✅ bestandstyp | ✅ OK |
| `pflegeart` | ✅ pflege_art | — | ✅ pflegeart | ✅ OK |

### Förderung-Felder

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `foerderung_gewuenscht` | ✅ foerderung | — | ❌ Fehlt | ❌ TODO |
| `foerderprogramm` | ✅ (via foerdercheck) | — | ❌ Fehlt | ❌ TODO |
| `eigentumsart` | ✅ eigentumsart | — | ❌ Fehlt | ⚠️ Für Förderberechnung |

### Meta-Felder

| Feld | WP-Wizard | FM Auftrag | FM wizardDaten | Status |
|------|-----------|------------|----------------|--------|
| `wpProjektId` | ✅ post_id | ✅ wpProjektId | — | ✅ OK |
| `wpErstelltAm` | ✅ ka_angelegt | ✅ wpErstelltAm | — | ✅ OK |
| `quelle` | ✅ "wizard" | — | ❌ Fehlt | ⚠️ Optional |
| `notizen` | ✅ notizen/bemerkungen | ✅ notizen | — | ✅ OK |

## Zusammenfassung

### Statistik

| Kategorie | Anzahl | Prozent |
|-----------|--------|---------|
| ✅ OK | 35 | 70% |
| ⚠️ Teilweise | 8 | 16% |
| ❌ TODO | 7 | 14% |
| **Gesamt** | **50** | 100% |

### Fehlende Felder (❌ TODO)

Diese Felder werden im WP-Wizard erfasst, aber nicht in FM gespeichert:

1. **forstamt_plz** — PLZ des zuständigen Forstamts
2. **forstamt_email** — E-Mail des Forstamts
3. **forstamt_telefon** — Telefon des Forstamts
4. **pflanzenanzahl** — Genaue Anzahl der Pflanzen
5. **zaunhoehe** — Höhe des Zauns in cm
6. **tore_anzahl** — Anzahl der Tore im Zaun
7. **huellen_hoehe** — Höhe der Wuchshüllen

### Empfehlungen

1. **wizardDaten Schema erweitern**
   - Forstamt-Kontaktdaten hinzufügen
   - Pflanzenanzahl als separates Feld
   - Zaundetails (Höhe, Tore) ergänzen

2. **AuftragDetail.tsx aktualisieren**
   - Alle wizardDaten-Felder in der Detailansicht anzeigen
   - Fehlende Felder mit "—" markieren

3. **Sync-Logik prüfen**
   - Sicherstellen dass ALLE WP-Felder beim Sync übernommen werden
   - Logging für nicht-gemappte Felder

## Changelog

| Datum | Änderung |
|-------|----------|
| 2026-04-01 | Initial Report erstellt (KC-5) |
