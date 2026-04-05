// KK-2: KI Content-Generator für Blog-Posts
// Generiert strukturierte Blog-Posts aus Auftragsdaten
// DATENSCHUTZ: Keine Namen/Adressen — nur Ort, Baumart, Flächengröße

import Anthropic from "@anthropic-ai/sdk"
import { KI_ENABLED } from "./dokument-auswertung"
import { pseudonymizePrompt } from "@/lib/pseudonymize"

export interface ContentGeneratorInput {
  auftragId: string
  typ: string
  standort?: string | null
  bundesland?: string | null
  flaeche_ha?: number | null
  baumarten?: string | null
  beschreibung?: string | null
  wizardDaten?: {
    pflanzverband?: string
    schutztyp?: string[]
    schutzart?: string
    zauntyp?: string
    aufwuchsart?: string[]
    arbeitsmethode?: string
  } | null
  // Protokoll-Daten für Statistiken
  protokolle?: {
    gepflanzt?: number | null
    witterung?: string | null
    datum?: Date | string
  }[]
}

const CONTENT_SYSTEM_PROMPT = `Du bist ein Experte für Forstwirtschaft und Content-Marketing bei Koch Aufforstung GmbH.

Deine Aufgabe: Generiere einen kurzen, informativen Blog-Post über ein abgeschlossenes Aufforstungsprojekt.

WICHTIG — DATENSCHUTZ:
- KEINE Personennamen (Waldbesitzer, Mitarbeiter)
- KEINE genauen Adressen
- NUR verwenden: Region/Bundesland, Baumart, Flächengröße, durchgeführte Maßnahmen

Schreibstil:
- Professionell aber zugänglich
- Faktenorientiert mit leichtem Storytelling
- 200-400 Wörter
- Deutsch

Struktur (Markdown):
1. Einleitender Absatz (Was wurde gemacht, wo)
2. Details zur Maßnahme (Baumarten, Methoden)
3. Herausforderungen/Besonderheiten (falls vorhanden)
4. Abschluss mit Ausblick/Bedeutung für den Wald

Gib NUR den Markdown-Text zurück, keine zusätzlichen Erklärungen.`

/**
 * Generiert einen Blog-Post aus Auftragsdaten via Claude
 */
export async function generiereAuftragsContent(
  input: ContentGeneratorInput
): Promise<string> {
  // Feature-Flag prüfen
  if (!KI_ENABLED) {
    throw new Error("KI-Features sind deaktiviert. Setze KI_ENABLED=true.")
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht konfiguriert")
  }

  // Auftragsdaten für Prompt aufbereiten
  const typLabels: Record<string, string> = {
    pflanzung: "Aufforstung",
    zaunbau: "Zaunbau",
    kulturschutz: "Kulturschutz",
    kulturpflege: "Kulturpflege",
    flaechenvorbereitung: "Flächenvorbereitung",
  }

  const gesamtPflanzen = input.protokolle?.reduce(
    (sum, p) => sum + (p.gepflanzt || 0),
    0
  ) || 0

  const projektDetails = `
Projekttyp: ${typLabels[input.typ] || input.typ}
Region: ${input.standort || ""}${input.bundesland ? `, ${input.bundesland}` : ""}
Fläche: ${input.flaeche_ha ? `${input.flaeche_ha} Hektar` : "nicht angegeben"}
Baumarten: ${input.baumarten || "verschiedene heimische Arten"}
${gesamtPflanzen > 0 ? `Gepflanzte Bäume: ca. ${gesamtPflanzen.toLocaleString("de-DE")}` : ""}
${input.wizardDaten?.pflanzverband ? `Pflanzverband: ${input.wizardDaten.pflanzverband}` : ""}
${input.wizardDaten?.schutzart ? `Schutzmaßnahmen: ${input.wizardDaten.schutzart}` : ""}
${input.wizardDaten?.zauntyp ? `Zaunschutz: ${input.wizardDaten.zauntyp}` : ""}
${input.beschreibung ? `Zusatzinfo: ${input.beschreibung}` : ""}
`.trim()

  const client = new Anthropic({ apiKey })

  // DSGVO Art. 25: Pseudonymisierung vor Übermittlung an externe KI-API
  const { text: pseudonymizedDetails } = pseudonymizePrompt(projektDetails)

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307", // Schnell + günstig für Content
      max_tokens: 1024,
      system: CONTENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Bitte erstelle einen Blog-Post für folgendes Projekt:\n\n${pseudonymizedDetails}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unerwartetes Antwortformat")
    }

    return content.text.trim()
  } catch (error) {
    console.error("[KI Content-Generator] Fehler:", error)
    throw error
  }
}

/**
 * Generiert eine Vorschau-Version (kürzer, nur Teaser)
 */
export async function generiereContentTeaser(
  input: ContentGeneratorInput
): Promise<string> {
  const fullContent = await generiereAuftragsContent(input)
  
  // Ersten Absatz extrahieren als Teaser
  const paragraphs = fullContent.split("\n\n").filter(p => p.trim())
  return paragraphs.slice(0, 2).join("\n\n")
}
