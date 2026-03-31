// KG-2: KI Dokument- und Foto-Auswertung
// Nutzt Claude Vision API zur Extraktion von Auftragsdaten aus Dokumenten/Fotos

import Anthropic from "@anthropic-ai/sdk"

// Feature-Flag: Kann in env.ts oder .env gesetzt werden
export const KI_ENABLED = process.env.KI_ENABLED === "true"

// Typen für extrahierte Auftragsdaten
export interface ExtrahierteFlaeche {
  flaeche_ha?: string
  standort?: string
  forstamt?: string
  revier?: string
  lat?: string
  lng?: string
}

export interface ExtrahierteAuftragsDaten {
  titel?: string
  typ?: "pflanzung" | "zaunbau" | "kulturschutz" | "kulturpflege" | "flaechenvorbereitung"
  waldbesitzer?: string
  waldbesitzerEmail?: string
  waldbesitzerTelefon?: string
  bundesland?: string
  flaechen?: ExtrahierteFlaeche[]
  baumarten?: string
  pflanzverband?: string
  zauntyp?: string
  schutzart?: string
  treffpunkt?: string
  // Meta
  confidence: number // 0-1 Konfidenz der Extraktion
  rawText?: string // Extrahierter Rohtext für Debugging
}

// System-Prompt für Claude
const EXTRACTION_SYSTEM_PROMPT = `Du bist ein Spezialist für die Extraktion von Forstdaten aus Dokumenten und Fotos.

Deine Aufgabe:
1. Analysiere das bereitgestellte Bild/Dokument
2. Extrahiere alle relevanten Informationen für einen Forstauftrag
3. Gib die Daten in einem strukturierten JSON-Format zurück

Zu extrahierende Felder:
- titel: Titel oder Bezeichnung des Auftrags
- typ: Art des Auftrags (pflanzung, zaunbau, kulturschutz, kulturpflege, flaechenvorbereitung)
- waldbesitzer: Name des Waldbesitzers
- waldbesitzerEmail: E-Mail-Adresse
- waldbesitzerTelefon: Telefonnummer
- bundesland: Bundesland
- flaechen: Array mit Flächen (flaeche_ha, standort, forstamt, revier, lat, lng)
- baumarten: Liste der Baumarten (z.B. "500 Eiche, 300 Buche")
- pflanzverband: Pflanzverband (reihe, dreieck, quadrat)
- zauntyp: Zauntyp (wildzaun, knotengeflecht, elektrozaun)
- schutzart: Schutzart (wuchshuellen, verbissschutz, fegeschutz)
- treffpunkt: Treffpunkt mit Förster

GPS-Koordinaten:
- Wenn GPS-Koordinaten erkennbar sind (z.B. aus Kartenbild, Google Maps Screenshot), extrahiere lat/lng
- Format: Dezimalgrad (z.B. 51.123456, 7.654321)

Antworte NUR mit validem JSON. Keine zusätzlichen Erklärungen.
Setze confidence auf einen Wert zwischen 0 und 1, basierend auf der Qualität der Extraktion.
Felder die nicht erkannt werden können, lasse leer (nicht null).`

/**
 * Analysiert ein Dokument oder Foto und extrahiert Auftragsdaten
 * 
 * @param fileBase64 - Base64-kodierter Inhalt der Datei
 * @param mimeType - MIME-Type der Datei (image/jpeg, image/png, application/pdf)
 * @returns Extrahierte Auftragsdaten oder Error
 */
export async function analysiereDokument(
  fileBase64: string,
  mimeType: string
): Promise<ExtrahierteAuftragsDaten> {
  // Feature-Flag prüfen
  if (!KI_ENABLED) {
    throw new Error("KI-Features sind deaktiviert. Setze KI_ENABLED=true in der Umgebung.")
  }

  // API Key prüfen
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht konfiguriert")
  }

  // Unterstützte Formate prüfen
  const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  if (!supportedTypes.includes(mimeType)) {
    throw new Error(`Nicht unterstütztes Format: ${mimeType}. Unterstützt: ${supportedTypes.join(", ")}`)
  }

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: fileBase64,
              },
            },
            {
              type: "text",
              text: "Bitte analysiere dieses Dokument/Foto und extrahiere alle Forstauftragsdaten im JSON-Format.",
            },
          ],
        },
      ],
    })

    // Extrahiere JSON aus der Antwort
    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unerwartetes Antwortformat von Claude")
    }

    // Parse JSON
    let extractedData: ExtrahierteAuftragsDaten
    try {
      // Entferne eventuelle Markdown-Code-Blöcke
      let jsonText = content.text.trim()
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7)
      }
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3)
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3)
      }
      
      extractedData = JSON.parse(jsonText.trim())
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      throw new Error("Konnte Antwort nicht als JSON parsen")
    }

    // Validiere und normalisiere Daten
    return normalizeExtractedData(extractedData)
  } catch (error) {
    console.error("[KI Dokument-Auswertung]", error)
    throw error
  }
}

/**
 * Normalisiert und validiert extrahierte Daten
 */
function normalizeExtractedData(data: ExtrahierteAuftragsDaten): ExtrahierteAuftragsDaten {
  // Typ normalisieren
  const validTypen = ["pflanzung", "zaunbau", "kulturschutz", "kulturpflege", "flaechenvorbereitung"]
  if (data.typ && !validTypen.includes(data.typ)) {
    data.typ = undefined
  }

  // Confidence auf gültigen Bereich beschränken
  if (typeof data.confidence !== "number" || isNaN(data.confidence)) {
    data.confidence = 0.5
  }
  data.confidence = Math.max(0, Math.min(1, data.confidence))

  // Flächen validieren
  if (data.flaechen && Array.isArray(data.flaechen)) {
    data.flaechen = data.flaechen.map((f) => ({
      flaeche_ha: f.flaeche_ha ? String(f.flaeche_ha) : undefined,
      standort: f.standort || undefined,
      forstamt: f.forstamt || undefined,
      revier: f.revier || undefined,
      lat: f.lat ? String(f.lat) : undefined,
      lng: f.lng ? String(f.lng) : undefined,
    }))
  }

  return data
}

/**
 * Prüft ob KI-Features verfügbar sind
 */
export function isKIVerfuegbar(): { verfuegbar: boolean; grund?: string } {
  if (!KI_ENABLED) {
    return { verfuegbar: false, grund: "KI_ENABLED=false" }
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { verfuegbar: false, grund: "ANTHROPIC_API_KEY fehlt" }
  }
  return { verfuegbar: true }
}

/**
 * Schätzt die Kosten für eine KI-Analyse
 */
export function schaetzeKosten(bildGroesseKb: number): { inputCost: number; outputCost: number; total: number } {
  // Claude Vision Preise (ca. März 2024):
  // Input: $3/MTok, Output: $15/MTok
  // Bilder: ~1000 Tokens pro 512x512 Pixel
  
  const estimatedImageTokens = Math.ceil(bildGroesseKb / 10) * 100 // Grobe Schätzung
  const estimatedOutputTokens = 500 // Typische Antwortlänge
  
  const inputCost = (estimatedImageTokens / 1_000_000) * 3
  const outputCost = (estimatedOutputTokens / 1_000_000) * 15
  
  return {
    inputCost,
    outputCost,
    total: inputCost + outputCost,
  }
}
