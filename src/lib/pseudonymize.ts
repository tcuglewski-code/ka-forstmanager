/**
 * Pseudonymisierung personenbezogener Daten vor KI-API-Aufrufen (DSGVO Art. 25).
 *
 * Ersetzt erkannte PII-Muster durch Platzhalter und liefert eine Map
 * zur optionalen Re-Identifikation in der Antwort.
 */

export interface PseudonymResult {
  text: string;
  map: Map<string, string>; // placeholder → original
}

// ── Pattern-Definitionen ──────────────────────────────────────────────────────

// IBAN: DE + 2 Prüfziffern + 18 Ziffern (mit optionalen Leerzeichen)
const IBAN_RE = /\bDE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/gi;

// Flurstücknummern: z.B. 123/45 oder 123-45
const FLURSTUECK_RE = /\b\d{1,6}[/-]\d{1,6}\b/g;

// Adressen: Straße + Hausnr, PLZ Ort (deutsche Adressen)
// z.B. "Waldweg 12, 01234 Neustadt" oder "Am Forsthaus 3a, 98765 Waldstadt"
const ADRESSE_RE = /[A-ZÄÖÜ][a-zäöüß]+(?:[-\s][A-Za-zäöüßÄÖÜ]+){0,3}\s+\d{1,4}\s?[a-z]?\s*,\s*\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+(?:[-\s][A-Za-zäöüßÄÖÜ]+)*/g;

// Namen: 2+ Wörter die mit Großbuchstabe beginnen (3-20 Zeichen je Wort),
// typisches Muster für Vor- + Nachname. Nur matchen wenn NICHT Teil einer Adresse.
const NAME_RE = /\b[A-ZÄÖÜ][a-zäöüß]{2,19}\s+[A-ZÄÖÜ][a-zäöüß]{2,19}\b/g;

// ── Hauptfunktion ─────────────────────────────────────────────────────────────

export function pseudonymizePrompt(text: string): PseudonymResult {
  const map = new Map<string, string>();
  let result = text;
  let counter = { iban: 0, flurstueck: 0, adresse: 0, name: 0 };

  // Reihenfolge: spezifischere Muster zuerst, damit sie nicht von generischeren überschrieben werden

  // 1. IBAN
  result = result.replace(IBAN_RE, (match) => {
    const placeholder = `[IBAN_REDACTED]`;
    map.set(placeholder + (counter.iban > 0 ? `_${counter.iban}` : ''), match);
    counter.iban++;
    return placeholder;
  });

  // 2. Adressen (vor Namen, da Adressen auch Großbuchstaben-Wörter enthalten)
  result = result.replace(ADRESSE_RE, (match) => {
    const placeholder = `[ADRESSE_${counter.adresse + 1}]`;
    map.set(placeholder, match);
    counter.adresse++;
    return placeholder;
  });

  // 3. Flurstücknummern
  result = result.replace(FLURSTUECK_RE, (match) => {
    const placeholder = `[FLURSTUECK_${counter.flurstueck + 1}]`;
    map.set(placeholder, match);
    counter.flurstueck++;
    return placeholder;
  });

  // 4. Namen (nach Adressen, damit Straßennamen nicht doppelt ersetzt werden)
  // Ausschluss-Liste: häufige deutsche Wörter die wie Namen aussehen
  const NICHT_NAMEN = new Set([
    'Sehr Geehrte', 'Sehr Geehrter', 'Mit Freundlichen',
    'Bitte Beachten', 'Zum Beispiel', 'Unter Anderem',
    'Keine Angabe', 'Nicht Verfügbar', 'Wird Bearbeitet',
    // Förder-spezifisch
    'Bundesamt Für', 'Ministerium Für', 'Landesamt Für',
    'Baden Württemberg', 'Mecklenburg Vorpommern',
    'Nordrhein Westfalen', 'Rheinland Pfalz', 'Sachsen Anhalt',
    'Schleswig Holstein',
  ]);

  result = result.replace(NAME_RE, (match) => {
    // Bereits pseudonymisiert? (Platzhalter enthalten)
    if (match.includes('[')) return match;
    // Auf Ausschluss-Liste?
    if (NICHT_NAMEN.has(match)) return match;
    const placeholder = `[NAME_${counter.name + 1}]`;
    map.set(placeholder, match);
    counter.name++;
    return placeholder;
  });

  return { text: result, map };
}

/**
 * Optional: Platzhalter in KI-Antwort durch Originale ersetzen.
 */
export function depseudonymize(text: string, map: Map<string, string>): string {
  let result = text;
  for (const [placeholder, original] of map) {
    result = result.replaceAll(placeholder, original);
  }
  return result;
}
