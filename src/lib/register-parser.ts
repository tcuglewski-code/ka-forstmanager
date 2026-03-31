/**
 * Register-Parser für fehlerhafte NW-FVA Daten
 * 
 * Problem: Die Daten wurden falsch geparst und mehrere Einträge in einem
 * Datensatz zusammengefügt. Dieses Modul extrahiert einzelne Einträge
 * aus den zusammengefügten Strings.
 * 
 * Muster pro Eintrag:
 * {Baumart}{HerkunftsCode}{Kategorie}{Ausgangsmaterial}{Behörde/Landkreis}{RegisterNr}
 * 
 * Beispiel:
 * "Sandbirke80402AusgewähltErntebestandStadt Dessau-Roßlau15 3 80402 200 2"
 * 
 * RegisterNr Format: XX X XXXXX XXX X (z.B. "15 3 80402 200 2")
 */

export interface ParsedRegisterEntry {
  baumart: string
  herkunftsCode: string
  kategorie: string
  ausgangsmaterial: string
  behoerde: string
  registerNr: string
}

// Bekannte Kategorien
const KATEGORIEN = [
  'Ausgewählt',
  'Geprüft',
  'Quellengesichert',
  'unbekannt',
]

// Bekannte Ausgangsmaterialien
const AUSGANGSMATERIALIEN = [
  'Erntebestand',
  'Samenplantage',
  'Klonmischung',
  'Klon',
  'Familieneltern',
  'Quellengesichert',
]

// Bekannte Baumarten (erweitert)
const BAUMARTEN = [
  'Sandbirke',
  'Moorbirke',
  'Bergahorn',
  'Spitzahorn',
  'Feldahorn',
  'Rotbuche',
  'Stieleiche',
  'Traubeneiche',
  'Roteiche',
  'Esche',
  'Winterlinde',
  'Sommerlinde',
  'Vogelkirsche',
  'Hainbuche',
  'Bergulme',
  'Flatterulme',
  'Feldulme',
  'Schwarzerle',
  'Grauerle',
  'Aspe',
  'Schwarzpappel',
  'Pappel',
  'Fichte',
  'Gemeine Fichte',
  'Europäische Lärche',
  'Japanische Lärche',
  'Hybridlärche',
  'Kiefer',
  'Waldkiefer',
  'Weißtanne',
  'Douglasie',
  'Küstentanne',
  'Schwarzkiefer',
  'Weymouthskiefer',
  'Robinie',
  'Elsbeere',
  'Speierling',
  'Mehlbeere',
  'Eibe',
  'Walnuss',
  'Edelkastanie',
  'Rosskastanie',
  'Platane',
  'Tulpenbaum',
  'Mammutbaum',
  'Zeder',
  'Lärche',
]

/**
 * Parst einen zusammengefügten baumart-String in einzelne Einträge
 */
export function parseMultiEntryBaumart(input: string): ParsedRegisterEntry[] {
  if (!input || input.length < 30) return []
  
  const entries: ParsedRegisterEntry[] = []
  
  // RegisterNr-Muster: XX X XXXXX XXX X (z.B. "15 3 80402 200 2")
  // Auch Varianten: XX X XXxxx XXX X (mit kleinen x für Platzhalter)
  const registerNrPattern = /\d{2}\s\d\s[\d]{5}\s\d{3}\s\d/g
  
  // Finde alle RegisterNummern
  const matches = [...input.matchAll(registerNrPattern)]
  
  if (matches.length === 0) {
    // Versuche alternatives Pattern für Pappeln etc.: XX X XXXXX XXX X
    const altPattern = /\d{2}\s\d\s[\dxX]{5}\s\d{3}\s\d/g
    const altMatches = [...input.matchAll(altPattern)]
    if (altMatches.length === 0) return []
    matches.push(...altMatches)
  }
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const registerNr = match[0]
    const endPos = match.index! + registerNr.length
    
    // Bestimme Startposition (Ende des vorherigen Eintrags oder Anfang)
    const startPos = i === 0 ? 0 : matches[i - 1].index! + matches[i - 1][0].length
    
    // Extrahiere den Substring für diesen Eintrag
    const segment = input.substring(startPos, endPos)
    
    // Parse die einzelnen Felder aus dem Segment
    const parsed = parseSegment(segment, registerNr)
    if (parsed) {
      entries.push(parsed)
    }
  }
  
  return entries
}

/**
 * Parst ein einzelnes Segment in seine Bestandteile
 */
function parseSegment(segment: string, registerNr: string): ParsedRegisterEntry | null {
  try {
    // Entferne die RegisterNr vom Ende
    const withoutRegNr = segment.slice(0, -registerNr.length).trim()
    
    // Finde Baumart am Anfang
    let baumart = ''
    for (const ba of BAUMARTEN) {
      if (withoutRegNr.startsWith(ba)) {
        baumart = ba
        break
      }
    }
    
    if (!baumart) {
      // Versuche Baumart zu extrahieren (bis zur ersten Zahl)
      const baMatch = withoutRegNr.match(/^([A-Za-zäöüÄÖÜß\s-]+?)(\d{5})/)
      if (baMatch) {
        baumart = baMatch[1].trim()
      } else {
        return null
      }
    }
    
    let remaining = withoutRegNr.slice(baumart.length)
    
    // Extrahiere Herkunftscode (5 Ziffern)
    const hkMatch = remaining.match(/^(\d{5})/)
    if (!hkMatch) return null
    const herkunftsCode = hkMatch[1]
    remaining = remaining.slice(5)
    
    // Finde Kategorie
    let kategorie = ''
    for (const kat of KATEGORIEN) {
      if (remaining.startsWith(kat)) {
        kategorie = kat
        break
      }
    }
    if (!kategorie) {
      // Fallback: Suche nach bekannten Kategorien mit Regex
      const katMatch = remaining.match(/^(Ausgewählt|Geprüft|Quellengesichert|unbekannt)/)
      if (katMatch) {
        kategorie = katMatch[1]
      } else {
        kategorie = 'unbekannt'
      }
    }
    remaining = remaining.slice(kategorie.length)
    
    // Finde Ausgangsmaterial
    let ausgangsmaterial = ''
    for (const am of AUSGANGSMATERIALIEN) {
      if (remaining.startsWith(am)) {
        ausgangsmaterial = am
        break
      }
    }
    if (!ausgangsmaterial) {
      // Fallback
      const amMatch = remaining.match(/^(Erntebestand|Samenplantage|Klonmischung|Klon|Familieneltern|Quellengesichert)/)
      if (amMatch) {
        ausgangsmaterial = amMatch[1]
      }
    }
    if (ausgangsmaterial) {
      remaining = remaining.slice(ausgangsmaterial.length)
    }
    
    // Der Rest ist die Behörde/Landkreis
    const behoerde = remaining.trim()
    
    return {
      baumart,
      herkunftsCode,
      kategorie,
      ausgangsmaterial,
      behoerde,
      registerNr,
    }
  } catch {
    return null
  }
}

/**
 * Prüft ob ein Eintrag fehlerhaft geparst ist
 */
export function isCorruptedEntry(baumart: string | null, registerNr: string | null): boolean {
  if (!baumart || !registerNr) return false
  
  // Fehlerhaft wenn:
  // 1. baumart mehr als 100 Zeichen hat (sollte normal <50 sein)
  if (baumart.length > 100) return true
  
  // 2. registerNr enthält keine Zahlen (sollte Format XX X XXXXX XXX X haben)
  if (!/\d/.test(registerNr)) return true
  
  // 3. registerNr ist ein bekannter Behördenname
  const behoerdenNamen = [
    'Stadt', 'Landkreis', 'Kreis', 'Ministerium', 'Landesamt',
    'Forstamt', 'FA ', 'Regierungspräsidium', 'Kontrollstelle'
  ]
  if (behoerdenNamen.some(b => registerNr.includes(b))) return true
  
  return false
}

/**
 * Statistik über Datenqualität
 */
export interface DataQualityStats {
  total: number
  corrupted: number
  missingGps: number
  missingFlaeche: number
  complete: number
}

/**
 * Berechnet Qualitäts-Statistik aus einem Array von Einträgen
 */
export function calculateDataQuality(entries: Array<{
  baumart: string | null
  registerNr: string | null
  latDez: number | null
  lonDez: number | null
  flaecheHa: number | null
}>): DataQualityStats {
  const stats: DataQualityStats = {
    total: entries.length,
    corrupted: 0,
    missingGps: 0,
    missingFlaeche: 0,
    complete: 0,
  }
  
  for (const entry of entries) {
    const isCorrupted = isCorruptedEntry(entry.baumart, entry.registerNr)
    
    if (isCorrupted) {
      stats.corrupted++
    } else {
      const hasGps = entry.latDez != null && entry.lonDez != null
      const hasFlaeche = entry.flaecheHa != null
      
      if (!hasGps) stats.missingGps++
      if (!hasFlaeche) stats.missingFlaeche++
      if (hasGps && hasFlaeche) stats.complete++
    }
  }
  
  return stats
}
