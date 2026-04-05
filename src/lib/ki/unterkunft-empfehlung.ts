// KR-1 + KR-2: KI-gestützte Unterkunftsempfehlung
// Nutzt Claude claude-haiku-4-5 für schnelle, günstige Analyse

import Anthropic from "@anthropic-ai/sdk"
import { pseudonymizePrompt } from "@/lib/pseudonymize"
import { logAiCall } from "@/lib/ai-audit"

// Feature-Flag prüfen
const KI_ENABLED = process.env.KI_ENABLED === "true" || process.env.NODE_ENV === "development"

export interface UnterkunftEmpfehlung {
  name: string
  distanzKm: number
  empfehlungsScore: number // 0-100
  begruendung: string
  geeignetFuerPersonen: number
  geschaetzteKosten: string // "~€45/Nacht/Person"
  buchungsHinweis: string
  lat: number
  lng: number
  typ: string
}

export interface AnalyseParams {
  auftrag: {
    standort: string
    lat: number
    lng: number
    teamGroesse?: number
    startDatum?: string
    endDatum?: string
  }
  unterkuenfte: Array<{
    name: string
    lat: number
    lng: number
    typ: string
    adresse?: string
    telefon?: string
    website?: string
    sterne?: number
  }>
}

const ANALYSE_SYSTEM_PROMPT = `Du bist ein Experte für Unterkunftsplanung für Forstarbeiter-Teams.

Aufgabe: Analysiere die gegebenen Unterkünfte und erstelle ein Ranking für das Forstarbeiter-Team.

Bewertungskriterien:
1. Distanz zur Arbeitsstelle (je näher, desto besser)
2. Eignung für Gruppen/Teams (Pensionen/Gasthäuser bevorzugt gegenüber Hotels)
3. Praxistauglichkeit für Forstarbeiter (frühe Abreise, Lunchpakete, Arbeitskleidung)
4. Kapazität für die Teamgröße

Antworte im folgenden JSON-Format (Array von Objekten):
[
  {
    "name": "Unterkunft-Name",
    "empfehlungsScore": 85,
    "begruendung": "Kurze Begründung warum gut/schlecht geeignet",
    "geeignetFuerPersonen": 8,
    "geschaetzteKosten": "~€45/Nacht/Person",
    "buchungsHinweis": "Frühzeitig buchen, Gruppenrabatt anfragen"
  }
]

Gib NUR valides JSON zurück, keine Erklärungen.`

/**
 * Berechnet die Distanz zwischen zwei GPS-Koordinaten (Haversine)
 */
function berechneDistanz(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Erdradius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // Auf 1 Dezimalstelle runden
}

/**
 * Analysiert Unterkünfte mit KI und erstellt ein Ranking
 */
export async function analysiereUnterkuenfte(params: AnalyseParams): Promise<UnterkunftEmpfehlung[]> {
  // Feature-Flag prüfen
  if (!KI_ENABLED) {
    throw new Error("KI-Features sind deaktiviert. Setze KI_ENABLED=true in den Umgebungsvariablen.")
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht konfiguriert. KI-Analyse nicht verfügbar.")
  }

  const { auftrag, unterkuenfte } = params

  // Keine Unterkünfte → leeres Array
  if (unterkuenfte.length === 0) {
    return []
  }

  // Distanzen berechnen
  const unterkunfteMitDistanz = unterkuenfte.map(u => ({
    ...u,
    distanzKm: berechneDistanz(auftrag.lat, auftrag.lng, u.lat, u.lng)
  }))

  // Prompt mit allen Daten aufbauen
  const teamInfo = auftrag.teamGroesse 
    ? `Teamgröße: ${auftrag.teamGroesse} Personen` 
    : "Teamgröße: nicht bekannt (ca. 4-8 Personen typisch)"
  
  const zeitraumInfo = auftrag.startDatum && auftrag.endDatum
    ? `Zeitraum: ${auftrag.startDatum} bis ${auftrag.endDatum}`
    : "Zeitraum: nicht angegeben"

  const unterkunftListe = unterkunfteMitDistanz.map((u, i) => 
    `${i + 1}. ${u.name} (${u.typ})
   Distanz: ${u.distanzKm} km
   ${u.sterne ? `Sterne: ${u.sterne}` : ""}
   ${u.adresse || ""}`
  ).join("\n")

  const userPrompt = `Arbeitsstelle: ${auftrag.standort} (${auftrag.lat}, ${auftrag.lng})
${teamInfo}
${zeitraumInfo}

Verfügbare Unterkünfte:
${unterkunftListe}

Analysiere und ranke die Unterkünfte nach Eignung für das Forstarbeiter-Team.`

  const client = new Anthropic({
    apiKey,
    defaultHeaders: { 'x-anthropic-no-store': 'true' },
  })

  // DSGVO Art. 25: Pseudonymisierung vor Übermittlung an externe KI-API
  const { text: pseudonymizedPrompt } = pseudonymizePrompt(userPrompt)

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022", // claude-haiku-4-5 - schnell + günstig
      max_tokens: 2048,
      system: ANALYSE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: pseudonymizedPrompt }]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unerwartetes Antwortformat von der KI")
    }

    // AI-Audit: Prompt-Hash loggen (kein Klartext)
    const totalTokens = response.usage ? response.usage.input_tokens + response.usage.output_tokens : undefined
    await logAiCall({ prompt: userPrompt, model: "claude-3-5-haiku-20241022", tokenCount: totalTokens, route: "/api/ki/unterkunft-analyse" })

    // JSON parsen
    const kiErgebnis = JSON.parse(content.text.trim())

    // Mit Original-Daten zusammenführen
    const ergebnisse: UnterkunftEmpfehlung[] = unterkunfteMitDistanz.map(u => {
      const kiDaten = kiErgebnis.find((k: { name: string }) => 
        k.name.toLowerCase().includes(u.name.toLowerCase().substring(0, 10)) ||
        u.name.toLowerCase().includes(k.name.toLowerCase().substring(0, 10))
      ) || {
        empfehlungsScore: 50,
        begruendung: "Keine KI-Analyse verfügbar",
        geeignetFuerPersonen: auftrag.teamGroesse || 6,
        geschaetzteKosten: "~€50/Nacht/Person",
        buchungsHinweis: "Direkt kontaktieren"
      }

      return {
        name: u.name,
        distanzKm: u.distanzKm,
        empfehlungsScore: kiDaten.empfehlungsScore,
        begruendung: kiDaten.begruendung,
        geeignetFuerPersonen: kiDaten.geeignetFuerPersonen,
        geschaetzteKosten: kiDaten.geschaetzteKosten,
        buchungsHinweis: kiDaten.buchungsHinweis,
        lat: u.lat,
        lng: u.lng,
        typ: u.typ
      }
    })

    // Nach Score sortieren
    return ergebnisse.sort((a, b) => b.empfehlungsScore - a.empfehlungsScore)

  } catch (error) {
    console.error("[KI Unterkunft-Empfehlung] Fehler:", error)
    
    // Fallback: einfaches Distanz-Ranking ohne KI
    return unterkunfteMitDistanz
      .sort((a, b) => a.distanzKm - b.distanzKm)
      .map(u => ({
        name: u.name,
        distanzKm: u.distanzKm,
        empfehlungsScore: Math.max(20, 100 - u.distanzKm * 2),
        begruendung: `${u.distanzKm} km entfernt`,
        geeignetFuerPersonen: auftrag.teamGroesse || 6,
        geschaetzteKosten: "Preis erfragen",
        buchungsHinweis: "Direkt kontaktieren",
        lat: u.lat,
        lng: u.lng,
        typ: u.typ
      }))
  }
}

/**
 * KR-2: Generiert eine Buchungsanfrage-E-Mail
 */
export async function generiereAnfrageEmail(params: {
  unterkunft: { name: string; adresse?: string }
  auftrag: { standort: string; teamGroesse: number; startDatum: string; endDatum: string }
}): Promise<string> {
  const { unterkunft, auftrag } = params

  // Anzahl Nächte berechnen
  const start = new Date(auftrag.startDatum)
  const ende = new Date(auftrag.endDatum)
  const naechte = Math.ceil((ende.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  // Zimmer-Empfehlung (2 Personen pro Zimmer)
  const zimmerAnzahl = Math.ceil(auftrag.teamGroesse / 2)

  // Datum formatieren
  const formatDatum = (d: Date) => d.toLocaleDateString("de-DE", { 
    weekday: "long", 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  })

  const emailText = `Sehr geehrte Damen und Herren,

wir sind ein Forstarbeiter-Team der Koch Aufforstung GmbH und suchen eine Unterkunft für einen Arbeitseinsatz in der Region ${auftrag.standort}.

**Anfrage-Details:**
- Anreise: ${formatDatum(start)}
- Abreise: ${formatDatum(ende)}
- Dauer: ${naechte} Nächte
- Personenanzahl: ${auftrag.teamGroesse} Personen
- Benötigte Zimmer: ca. ${zimmerAnzahl} Doppelzimmer (oder vergleichbar)

**Besondere Wünsche:**
- Frühstück ab 6:00 Uhr möglich (wir starten früh in den Wald)
- Falls möglich: Lunchpakete zum Mitnehmen
- Parkplätze für ${Math.ceil(auftrag.teamGroesse / 4)} Fahrzeuge (ggf. mit Anhänger)
- Möglichkeit zum Trocknen von Arbeitskleidung wäre hilfreich

Bitte teilen Sie uns mit, ob Sie Kapazitäten haben und was die Übernachtung pro Person/Nacht kosten würde. Für Gruppen gewähren Sie eventuell einen Sonderpreis?

Mit freundlichen Grüßen

Koch Aufforstung GmbH
Baumpflanzungen • Kulturpflege • Zaunbau
Tel: +49 XXX XXXXXXX
www.koch-aufforstung.de`

  return emailText
}

/**
 * Prüft ob KI-Features verfügbar sind
 */
export function isKIVerfuegbar(): { verfuegbar: boolean; grund?: string } {
  if (!KI_ENABLED) {
    return { verfuegbar: false, grund: "KI-Features deaktiviert (KI_ENABLED=false)" }
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { verfuegbar: false, grund: "ANTHROPIC_API_KEY nicht konfiguriert" }
  }
  return { verfuegbar: true }
}
