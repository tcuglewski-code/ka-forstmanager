// KR-3: API Route für KI-Unterkunftsanalyse
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analysiereUnterkuenfte, generiereAnfrageEmail, isKIVerfuegbar } from "@/lib/ki/unterkunft-empfehlung"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { auftragId, unterkuenfte, aktion } = body

    // KI-Status prüfen
    const kiStatus = isKIVerfuegbar()
    if (!kiStatus.verfuegbar) {
      return NextResponse.json({ 
        error: "KI nicht verfügbar", 
        grund: kiStatus.grund 
      }, { status: 503 })
    }

    // Aktion: Anfrage-Email generieren
    if (aktion === "generiereEmail") {
      const { unterkunft, teamGroesse, startDatum, endDatum, standort } = body
      
      if (!unterkunft || !teamGroesse || !startDatum || !endDatum) {
        return NextResponse.json({ 
          error: "Fehlende Parameter für E-Mail-Generierung" 
        }, { status: 400 })
      }

      const emailText = await generiereAnfrageEmail({
        unterkunft,
        auftrag: { standort, teamGroesse, startDatum, endDatum }
      })

      return NextResponse.json({ emailText })
    }

    // Aktion: Unterkünfte analysieren (Standard)
    if (!auftragId) {
      return NextResponse.json({ error: "auftragId fehlt" }, { status: 400 })
    }

    // Auftrag laden
    const auftrag = await prisma.auftrag.findUnique({
      where: { id: auftragId },
      select: {
        id: true,
        standort: true,
        lat: true,
        lng: true,
        startDatum: true,
        endDatum: true,
        wizardDaten: true,
      }
    })

    if (!auftrag) {
      return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 })
    }

    if (!auftrag.lat || !auftrag.lng) {
      return NextResponse.json({ 
        error: "Auftrag hat keine GPS-Koordinaten" 
      }, { status: 400 })
    }

    // Teamgröße aus wizardDaten extrahieren falls vorhanden
    const wizardDaten = auftrag.wizardDaten as Record<string, unknown> | null
    const teamGroesse = (wizardDaten?.teamGroesse as number) || 6

    // KI-Analyse durchführen
    const empfehlungen = await analysiereUnterkuenfte({
      auftrag: {
        standort: auftrag.standort || "Unbekannt",
        lat: auftrag.lat,
        lng: auftrag.lng,
        teamGroesse,
        startDatum: auftrag.startDatum?.toISOString().split("T")[0],
        endDatum: auftrag.endDatum?.toISOString().split("T")[0],
      },
      unterkuenfte: unterkuenfte || []
    })

    return NextResponse.json({ empfehlungen })

  } catch (error) {
    console.error("[KI Unterkunft-Analyse] Fehler:", error)
    return NextResponse.json({ 
      error: "Analyse fehlgeschlagen",
      details: error instanceof Error ? error.message : "Unbekannter Fehler"
    }, { status: 500 })
  }
}

// GET: KI-Status prüfen
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  const status = isKIVerfuegbar()
  return NextResponse.json(status)
}
