# Beta-Test Anleitung — ForstManager Koch Aufforstung GmbH

> **Testzeitraum:** April 2026  
> **Version:** 1.0.0  
> **Stand:** 27.03.2026

---

## Übersicht

Willkommen beim Beta-Test des ForstManagers! Diese Anleitung erklärt, was getestet werden soll, wie Fehler gemeldet werden und welche Test-Zugänge zur Verfügung stehen.

Der ForstManager ist die zentrale Verwaltungsanwendung der Koch Aufforstung GmbH für:
- Mitarbeiterverwaltung und Zeiterfassung
- Auftragsverwaltung und Projektübersicht
- Wochenplanung für alle Dienstleistungen
- Dokumentation und Protokollierung

---

## Test-Zugänge

Alle Test-Accounts haben das Passwort: **`Test1234!`**

| E-Mail | Rolle | Berechtigungen |
|--------|-------|----------------|
| `max.mustermann@test.de` | Mitarbeiter | Stundenerfassung, eigene Daten |
| `anna.schmidt@test.de` | Mitarbeiter | Stundenerfassung, eigene Daten |
| `gf.weber@test.de` | Gruppenführer | Gruppenplanung, Wochenpläne erstellen |
| `foerster.braun@test.de` | Förster | Projektübersicht, Protokolle |
| `admin.beta@test.de` | Admin | Vollzugriff auf alle Funktionen |

> ⚠️ Diese Accounts sind ausschließlich für den Beta-Test vorgesehen. Keine echten Daten eingeben!

---

## Was soll getestet werden?

### 1. 🔐 Login & Authentifizierung
- [ ] Login mit korrekten Zugangsdaten funktioniert
- [ ] Login mit falschem Passwort zeigt Fehlermeldung
- [ ] Logout funktioniert korrekt
- [ ] Seiten sind ohne Login nicht zugänglich

### 2. 📊 Dashboard
- [ ] Übersicht lädt korrekt
- [ ] Zahlen/Statistiken stimmen überein
- [ ] Navigation funktioniert auf Desktop und Mobilgerät
- [ ] Ladezeiten akzeptabel (< 3 Sekunden)

### 3. 👷 Mitarbeiterverwaltung
- [ ] Mitarbeiter-Liste anzeigen
- [ ] Neuen Mitarbeiter anlegen (nur Admin)
- [ ] Mitarbeiter bearbeiten
- [ ] Qualifikationen eintragen und anzeigen
- [ ] Schulungen zuweisen

### 4. ⏱️ Stundenerfassung
- [ ] Stunden für einen Auftrag erfassen
- [ ] Stundenübersicht anzeigen
- [ ] Genehmigungsworkflow (Admin genehmigt Stunden)
- [ ] Monatsübersicht / Export

### 5. 📋 Auftragsverwaltung
- [ ] Aufträge-Liste anzeigen und filtern
- [ ] Auftragsdetails öffnen
- [ ] Tagesprotokoll für Auftrag erstellen
- [ ] Status-Änderungen durchführen
- [ ] Aufträge nach Bundesland/Typ filtern

### 6. 📅 Wochenplanung
- [ ] Wochenplan für aktuelle KW anzeigen
- [ ] Neuen Wochenplan erstellen
- [ ] Positionen hinzufügen (Pflanzung, Kulturpflege, Saatguternte etc.)
- [ ] KW-Navigator (Vor/Zurück) funktioniert
- [ ] PDF-Export des Wochenplans
- [ ] Dienstleistungstyp-Filter

### 7. 🏪 Lagerverwaltung
- [ ] Lagerartikel-Liste anzeigen
- [ ] Neuen Artikel anlegen
- [ ] Lagerbewegung (Ein-/Ausgang) buchen
- [ ] QR-Code generieren und drucken

### 8. 👥 Gruppen
- [ ] Gruppenübersicht anzeigen
- [ ] Mitglieder einer Gruppe verwalten
- [ ] Gruppenführer-Zuweisung

### 9. 🚗 Fuhrpark & Geräte
- [ ] Fahrzeugliste anzeigen
- [ ] Geräteverwaltung
- [ ] Wartungseinträge

### 10. 💶 Lohn & Abrechnung
- [ ] Lohnübersicht anzeigen
- [ ] Vorschüsse verwalten
- [ ] Lohnabrechnung erstellen (nur Admin)

### 11. 📁 Dokumente
- [ ] Dokument hochladen
- [ ] Dokumente nach Typ filtern
- [ ] Dokument herunterladen

### 12. 📱 Mobile Nutzung
- [ ] App auf Smartphone bedienbar (Responsive Design)
- [ ] Navigation auf kleinen Bildschirmen
- [ ] Formulare auf Touch-Geräten nutzbar

---

## Fehler melden

### Option 1: GitHub Issues (bevorzugt)
1. GitHub-Account nötig (kostenlos unter github.com)
2. Zum Repository: [github.com/tcuglewski-code/ka-forstmanager](https://github.com/tcuglewski-code/ka-forstmanager/issues)
3. Klick auf **"New Issue"**
4. Titel: `[Beta] Kurze Beschreibung des Problems`
5. Beschreibung:
   - **Was wollte ich tun?**
   - **Was ist passiert?**
   - **Was hätte passieren sollen?**
   - **Browser / Gerät** (z.B. Chrome auf iPhone 14)
   - **Screenshot** (wenn möglich)

### Option 2: E-Mail
**E-Mail:** cuglewski@koch-aufforstung.de  
**Betreff:** `[ForstManager Beta] <Kurze Beschreibung>`

Bitte immer folgende Infos mitschicken:
- Test-Account (welche E-Mail)
- Browser und Betriebssystem
- Genaue Beschreibung + ggf. Screenshot

---

## Testzeitraum

| Phase | Zeitraum | Schwerpunkt |
|-------|----------|-------------|
| Beta-Phase 1 | 01.04. – 15.04.2026 | Grundfunktionen: Login, Dashboard, Aufträge |
| Beta-Phase 2 | 15.04. – 25.04.2026 | Wochenplanung, Stundenerfassung, Lager |
| Feedback-Auswertung | 26.04. – 30.04.2026 | Bugfixes + Optimierungen |

---

## Häufige Fragen

**Kann ich echte Daten eingeben?**  
Nein! Bitte ausschließlich Testdaten verwenden. Die Beta-Datenbank wird nach dem Test zurückgesetzt.

**Was wenn ich ausgesperrt bin?**  
Bei Problemen mit dem Login bitte direkt an cuglewski@koch-aufforstung.de wenden.

**Kann ich neue Features vorschlagen?**  
Ja! In GitHub Issues einfach das Label "enhancement" verwenden oder per E-Mail melden.

---

## Kontakt

**Tomek Cuglewski**  
Koch Aufforstung GmbH  
📧 cuglewski@koch-aufforstung.de

---

*Vielen Dank für deine Teilnahme am Beta-Test! Dein Feedback hilft uns, den ForstManager noch besser zu machen.* 🌲
