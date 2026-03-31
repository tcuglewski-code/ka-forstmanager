// KL-1: Lager Reservierungslogik API
// POST /api/lager/reservierung — Artikel für Auftrag reservieren
// GET /api/lager/reservierung — Reservierungen auflisten

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Reservierungen auflisten
export async function GET(req: NextRequest) {
  try {
    await auth()
    
    const { searchParams } = new URL(req.url)
    const auftragId = searchParams.get("auftragId")
    const artikelId = searchParams.get("artikelId")
    const status = searchParams.get("status")

    const where: Record<string, string> = {}
    if (auftragId) where.auftragId = auftragId
    if (artikelId) where.artikelId = artikelId
    if (status) where.status = status

    const reservierungen = await prisma.lagerReservierung.findMany({
      where,
      include: {
        artikel: {
          select: {
            id: true,
            name: true,
            einheit: true,
            bestand: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reservierungen)
  } catch (error) {
    console.error("[Reservierung GET] Fehler:", error)
    return NextResponse.json({ error: "Abruf fehlgeschlagen" }, { status: 500 })
  }
}

// POST — Neue Reservierung erstellen
export async function POST(req: NextRequest) {
  try {
    await auth()
    
    const body = await req.json()
    const { artikelId, auftragId, menge } = body

    if (!artikelId || !auftragId || !menge) {
      return NextResponse.json(
        { error: "artikelId, auftragId und menge erforderlich" },
        { status: 400 }
      )
    }

    // Artikel laden und Bestand prüfen
    const artikel = await prisma.lagerArtikel.findUnique({
      where: { id: artikelId },
      include: {
        reservierungen: {
          where: { status: "RESERVIERT" },
        },
      },
    })

    if (!artikel) {
      return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 })
    }

    // Bereits reservierte Menge berechnen
    const reservierteMenge = artikel.reservierungen.reduce(
      (sum, r) => sum + r.menge,
      0
    )

    // Verfügbare Menge prüfen
    const verfuegbar = artikel.bestand - reservierteMenge
    if (menge > verfuegbar) {
      return NextResponse.json(
        {
          error: "Nicht genug Bestand",
          bestand: artikel.bestand,
          reserviert: reservierteMenge,
          verfuegbar,
          angefragt: menge,
        },
        { status: 400 }
      )
    }

    // Reservierung erstellen
    const reservierung = await prisma.lagerReservierung.create({
      data: {
        artikelId,
        auftragId,
        menge: parseFloat(String(menge)),
        status: "RESERVIERT",
      },
      include: {
        artikel: {
          select: { name: true, einheit: true },
        },
      },
    })

    return NextResponse.json(reservierung, { status: 201 })
  } catch (error) {
    console.error("[Reservierung POST] Fehler:", error)
    return NextResponse.json({ error: "Erstellen fehlgeschlagen" }, { status: 500 })
  }
}
