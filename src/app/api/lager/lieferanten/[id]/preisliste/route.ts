// KU-2: Lieferanten-Preisliste API für Angebots-Integration
// Lädt Artikel eines Lieferanten zur Übernahme in Angebote

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  const { id } = await params

  try {
    const lieferant = await prisma.lieferant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        artikel: {
          where: { 
            // Nur Artikel mit Preis
            OR: [
              { lieferantPreis: { not: null } },
              { einkaufspreis: { not: null } }
            ]
          },
          select: {
            id: true,
            name: true,
            kategorie: true,
            einheit: true,
            einkaufspreis: true,
            verkaufspreis: true,
            lieferantPreis: true,
            lieferantBestellnummer: true,
            bestand: true,
            updatedAt: true
          },
          orderBy: { name: "asc" }
        }
      }
    })

    if (!lieferant) {
      return NextResponse.json({ error: "Lieferant nicht gefunden" }, { status: 404 })
    }

    // Preis-Warnung hinzufügen (>30 Tage alt)
    const artikelMitWarnung = lieferant.artikel.map(a => {
      const alterInTagen = Math.floor(
        (Date.now() - new Date(a.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        ...a,
        lieferantPreis: a.lieferantPreis ? Number(a.lieferantPreis) : null,
        preisAlt: alterInTagen > 30,
        preisAlterTage: alterInTagen,
        preisVom: a.updatedAt
      }
    })

    return NextResponse.json({
      lieferant: {
        id: lieferant.id,
        name: lieferant.name
      },
      artikel: artikelMitWarnung
    })

  } catch (error) {
    console.error("[Lieferanten-Preisliste API] Fehler:", error)
    return NextResponse.json({ 
      error: "Interner Fehler",
      details: error instanceof Error ? error.message : "Unbekannt"
    }, { status: 500 })
  }
}
