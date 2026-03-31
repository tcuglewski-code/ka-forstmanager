import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Einzelne Bestellung
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const bestellung = await prisma.bestellung.findUnique({
      where: { id },
      include: {
        lieferant: true,
        positionen: {
          include: { artikel: true }
        }
      }
    })
    
    if (!bestellung) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    
    return NextResponse.json(bestellung)
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// PATCH: Status ändern oder Bestellung bearbeiten
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await req.json()
    const { status, notizen } = body
    
    const data: Record<string, unknown> = {}
    if (status) data.status = status
    if (notizen !== undefined) data.notizen = notizen
    
    // Wenn Bestellung auf GELIEFERT gesetzt wird, Lagerbestand erhöhen
    if (status === "GELIEFERT") {
      const bestellung = await prisma.bestellung.findUnique({
        where: { id },
        include: { positionen: true }
      })
      
      if (bestellung && bestellung.status !== "GELIEFERT") {
        // Bestand für alle Positionen erhöhen
        for (const pos of bestellung.positionen) {
          await prisma.lagerArtikel.update({
            where: { id: pos.artikelId },
            data: { bestand: { increment: Number(pos.menge) } }
          })
          
          await prisma.lagerBewegung.create({
            data: {
              artikelId: pos.artikelId,
              typ: "eingang",
              menge: Number(pos.menge),
              notiz: `Lieferung aus Bestellung`
            }
          })
        }
      }
    }
    
    const updated = await prisma.bestellung.update({
      where: { id },
      data,
      include: {
        lieferant: true,
        positionen: { include: { artikel: true } }
      }
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

// DELETE: Bestellung löschen
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    await prisma.bestellung.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
