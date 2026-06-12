# DOK-069: OCR-Debug- & Eskalations-Protokoll

> Was tun, wenn die Dokumenten-Pipeline ein Dokument falsch oder gar nicht verarbeitet.

## 1. Symptom einordnen

| Symptom | Status in DB | Erste Anlaufstelle |
|---------|--------------|--------------------|
| Scan hängt | `IN_VERARBEITUNG` > 15 min | Sweeper-Cron reclaimt automatisch (täglich 05:30). Manuell: `POST /api/dokumente/process` mit `x-cron-secret` |
| Scan endgültig fehlgeschlagen | `FEHLER` | `routingGrund` + `DokumentenAudit` (aktion=FEHLER, details.fehler) lesen |
| Falsche Felder extrahiert | `REVIEW_ERFORDERLICH` | `rohExtraktion` (Provider-Rohdaten) mit `extrahierteDaten` (kanonisch) vergleichen |
| Falscher Artikel gematcht | Position `matchStatus=FUZZY` | `ExtrahiertePosition.konfidenz` + Begründung im Audit prüfen |

## 2. Debug-Reihenfolge

1. **Audit-Log lesen** (immer zuerst):
   ```sql
   SELECT aktion, details, "erstelltAm" FROM "DokumentenAudit"
   WHERE "dokumentenScanId" = '<id>' ORDER BY "erstelltAm";
   ```
2. **Rohextraktion prüfen**: `DokumentenScan.rohExtraktion` enthält die unveränderte Provider-Antwort (Azure-Felder bzw. geparstes XML). Stimmt das Roh-Ergebnis nicht → Provider/Parser-Problem. Stimmt es → Mapping/Routing-Problem.
3. **Lokal reproduzieren** mit Mock-Adapter (KEINE Live-OCR-Calls, NEVER #22):
   - Fixture nach `tests/fixtures/a3/mock-ocr-*.json` legen
   - `AZURE_DOCUMENT_INTELLIGENCE_KEY` NICHT setzen → `getOcrAdapter()` wählt Mock
   - `npx tsx` Test-Skript gegen `verarbeiteScan` laufen lassen
4. **Retry**: Status manuell auf `AUSSTEHEND` setzen (setzt `verarbeitungsVersuche` NICHT zurück — bei 3 Versuchen vorher Counter auf 0 setzen).

## 3. Eskalationsstufen

| Stufe | Kriterium | Aktion |
|-------|-----------|--------|
| 1 | Einzelnes Dokument falsch | Review-UI: manuell korrigieren/ablehnen. Alias lernen (LagerArtikelAlias) |
| 2 | Wiederholt gleicher Fehlertyp (≥3 Dokumente) | Fixture aus anonymisiertem Beispiel bauen, Test ergänzen, Fix deployen |
| 3 | Pipeline produziert falsche **Buchungen** | **Kill-Switch sofort**: `dok_ki_auto_buchung_aktiv=false` in SystemConfig. Tomek informieren |
| 4 | Datenleck / Security-Verdacht | Kill-Switch + Upload sperren (Route deaktivieren) + Tomek sofort |

## 4. Kill-Switch (NEVER #21)

```sql
UPDATE "SystemConfig" SET value='false' WHERE key='dok_ki_auto_buchung_aktiv';
```
Wirkung: sofort, kein Deploy nötig. Pipeline läuft weiter, routet aber alles nach REVIEW_ERFORDERLICH.

## 5. Kosten-Anomalien

- Verarbeitungskosten je Scan: `DokumentenScan.verarbeitungsKostenJson`
- LLM-Matching ist 24h-gecacht; explodierende Kosten deuten auf Cache-Miss-Schleife oder Massen-Upload → Rate-Limit prüfen (Sprint 4) und ggf. `ANTHROPIC_API_KEY` temporär entfernen (degradiert sauber zu UNBEKANNT).
