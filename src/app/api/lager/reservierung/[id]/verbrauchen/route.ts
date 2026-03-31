import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH: Reservierung als verbraucht markieren
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const reservierung = await prisma.lagerReservierung.findUnique({
      where: { id },
      include: { artikel: true }
    })
    
    if (!reservierung) {
      return NextResponse.json({ error: "Reservierung nicht gefunden" }, { status: 404 })
    }
    
    if (reservierung.status !== "RESERVIERT") {
      return NextResponse.json(
        { error: `Reservierung hat Status ${reservierung.status}, kann nicht als verbraucht markiert werden` },
        { status: 400 }
      )
    }
    
    // Reservierung auf VERBRAUCHT setzen
    // Bestand bleibt wie er ist (wurde bei Reservierung bereits reduziert)
    const [updated] = await prisma.$transaction([
      prisma.lagerReservierung.update({
        where: { id },
        data: {
          status: "VERBRAUCHT",
          verbrauchtAm: new Date()
        }
      }),
      prisma.lagerBewegung.create({
        data: {
          artikelId: reservierung.artikelId,
          auftragId: reservierung.auftragId,
          typ: "verbrauch",
          menge: reservierung.menge,
          notiz: `Verbrauch aus Reservierung bestätigt`
        }
      })
    ])
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Fehler beim Verbrauchen:", error)
    return NextResponse.json({ error: "Fehler beim Verarbeiten" }, { status: 500 })
  }
}
