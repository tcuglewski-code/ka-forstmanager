import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Liste aller Bestellungen
export async function GET() {
  try {
    const bestellungen = await prisma.bestellung.findMany({
      include: {
        lieferant: {
          select: { id: true, name: true, email: true }
        },
        positionen: {
          include: {
            artikel: {
              select: { id: true, name: true, einheit: true }
            }
          }
        }
      },
      orderBy: { bestelldatum: "desc" }
    })
    
    return NextResponse.json(bestellungen)
  } catch (error) {
    console.error("Fehler beim Laden der Bestellungen:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// POST: Neue Bestellung erstellen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lieferantId, positionen, gesamtbetrag, notizen } = body

    if (!lieferantId || !positionen || positionen.length === 0) {
      return NextResponse.json(
        { error: "lieferantId und mindestens eine Position erforderlich" },
        { status: 400 }
      )
    }

    const bestellung = await prisma.bestellung.create({
      data: {
        lieferantId,
        gesamtbetrag: gesamtbetrag || 0,
        notizen,
        status: "ENTWURF",
        positionen: {
          create: positionen.map((p: { artikelId: string; menge: number; einzelpreis: number }) => ({
            artikelId: p.artikelId,
            menge: p.menge,
            einzelpreis: p.einzelpreis
          }))
        }
      },
      include: {
        lieferant: true,
        positionen: {
          include: { artikel: true }
        }
      }
    })

    return NextResponse.json(bestellung, { status: 201 })
  } catch (error) {
    console.error("Fehler beim Erstellen der Bestellung:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
