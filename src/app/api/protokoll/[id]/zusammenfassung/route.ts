import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"
import { logAiCall } from "@/lib/ai-audit"

export const maxDuration = 30

/**
 * MA: Protokoll-Zusammenfassung MVP
 *
 * GET /api/protokoll/[id]/zusammenfassung
 * Liest Tagesprotokoll aus DB, pseudonymisiert Personennamen,
 * sendet an Claude API und gibt eine Zusammenfassung zurück.
 */

/** Replace real names with PERSON_1, PERSON_2, etc. Returns cleaned text + mapping */
function pseudonymize(text: string): {
  cleaned: string
  mapping: Map<string, string>
} {
  // Common German name patterns: "Max Mustermann", "Hr. Meier", "Fr. Schmidt"
  const namePattern =
    /\b(?:(?:Hr\.|Herr|Fr\.|Frau|Dr\.|Prof\.)\s+)?[A-ZÄÖÜ][a-zäöüß]{2,}(?:\s+[A-ZÄÖÜ][a-zäöüß]{2,})+\b/g

  const mapping = new Map<string, string>()
  let counter = 0

  const cleaned = text.replace(namePattern, (match) => {
    // Skip common German words that match the pattern
    const skipWords = [
      "Koch Aufforstung",
      "Montag Dienstag",
      "Mittwoch Donnerstag",
      "Freitag Samstag",
      "Januar Februar",
      "Sehr Gut",
      "Nicht Vorhanden",
    ]
    if (skipWords.some((w) => match.includes(w))) return match

    if (!mapping.has(match)) {
      counter++
      mapping.set(match, `PERSON_${counter}`)
    }
    return mapping.get(match)!
  })

  return { cleaned, mapping }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth prüfen
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Tagesprotokoll laden
    const protokoll = await prisma.tagesprotokoll.findUnique({
      where: { id },
      select: {
        id: true,
        bericht: true,
        datum: true,
        gepflanztGesamt: true,
        flaecheBearbeitetHa: true,
        witterung: true,
        besonderheiten: true,
        naechsteSchritte: true,
        auftrag: {
          select: { titel: true },
        },
      },
    })

    if (!protokoll) {
      return NextResponse.json(
        { error: "Tagesprotokoll nicht gefunden" },
        { status: 404 }
      )
    }

    // API Key prüfen
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "KI-Service nicht konfiguriert" },
        { status: 503 }
      )
    }

    // Protokolldaten zusammenbauen
    const datumStr = new Date(protokoll.datum).toLocaleDateString("de-DE")
    const rawText = [
      `Datum: ${datumStr}`,
      protokoll.auftrag?.titel
        ? `Auftrag: ${protokoll.auftrag.titel}`
        : null,
      protokoll.bericht ? `Bericht: ${protokoll.bericht}` : null,
      protokoll.gepflanztGesamt != null
        ? `Gepflanzt gesamt: ${protokoll.gepflanztGesamt} Stück`
        : null,
      protokoll.flaecheBearbeitetHa != null
        ? `Fläche bearbeitet: ${protokoll.flaecheBearbeitetHa} ha`
        : null,
      protokoll.witterung ? `Witterung: ${protokoll.witterung}` : null,
      protokoll.besonderheiten
        ? `Besonderheiten: ${protokoll.besonderheiten}`
        : null,
      protokoll.naechsteSchritte
        ? `Nächste Schritte: ${protokoll.naechsteSchritte}`
        : null,
    ]
      .filter(Boolean)
      .join("\n")

    // Pseudonymisierung
    const { cleaned: pseudonymizedText } = pseudonymize(rawText)

    // Claude API aufrufen
    const anthropic = new Anthropic({ apiKey })
    const prompt = `Fasse das folgende Tagesprotokoll eines Forstbetriebs kurz und prägnant zusammen.
Maximal 200 Wörter. Schreibe auf Deutsch in sachlichem Ton.
Fokussiere auf: Arbeitsfortschritt, Mengen, Besonderheiten und nächste Schritte.
Personennamen sind pseudonymisiert (PERSON_1 etc.) — übernimm diese Platzhalter.

Tagesprotokoll:
${pseudonymizedText}`

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    })

    const zusammenfassung =
      message.content[0].type === "text" ? message.content[0].text : ""

    // AI-Audit loggen
    await logAiCall({
      userId: session.user.id,
      prompt,
      model: "claude-sonnet-4-20250514",
      tokenCount: message.usage?.input_tokens + message.usage?.output_tokens,
      route: "/api/protokoll/[id]/zusammenfassung",
    })

    return NextResponse.json({ zusammenfassung })
  } catch (error) {
    console.error("[Protokoll-Zusammenfassung] Fehler:", error)
    return NextResponse.json(
      {
        error: "Zusammenfassung fehlgeschlagen",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}
