import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Liste aller Reservierungen, optional gefiltert nach auftragId
export async function GET(req: NextRequest) {
  try {
    const auftragId = req.nextUrl.searchParams.get("auftragId")
    
    const where = auftragId ? { auftragId } : {}
    
    const reservierungen = await prisma.lagerReservierung.findMany({
      where,
      include: {
        artikel: {
          select: {
            id: true,
            name: true,
            einheit: true,
            bestand: true,
            mindestbestand: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(reservierungen)
  } catch (error) {
    console.error("Fehler beim Laden der Reservierungen:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// POST: Neue Reservierung erstellen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { artikelId, auftragId, menge } = body
    
    if (!artikelId || !auftragId || !menge) {
      return NextResponse.json(
        { error: "artikelId, auftragId und menge sind erforderlich" },
        { status: 400 }
      )
    }
    
    // Prüfe ob Artikel existiert und genügend Bestand hat
    const artikel = await prisma.lagerArtikel.findUnique({
      where: { id: artikelId }
    })
    
    if (!artikel) {
      return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 })
    }
    
    if (artikel.bestand < menge) {
      return NextResponse.json(
        { error: `Nicht genügend Bestand (verfügbar: ${artikel.bestand})` },
        { status: 400 }
      )
    }
    
    // Reservierung erstellen und Bestand reduzieren
    const [reservierung] = await prisma.$transaction([
      prisma.lagerReservierung.create({
        data: {
          artikelId,
          auftragId,
          menge: parseFloat(menge),
          status: "RESERVIERT"
        }
      }),
      prisma.lagerArtikel.update({
        where: { id: artikelId },
        data: { bestand: { decrement: parseFloat(menge) } }
      }),
      prisma.lagerBewegung.create({
        data: {
          artikelId,
          auftragId,
          typ: "reserve",
          menge: parseFloat(menge),
          notiz: `Reservierung für Auftrag`
        }
      })
    ])
    
    return NextResponse.json(reservierung, { status: 201 })
  } catch (error) {
    console.error("Fehler beim Erstellen der Reservierung:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
