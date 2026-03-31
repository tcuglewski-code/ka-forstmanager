import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Einzelne Reservierung
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const reservierung = await prisma.lagerReservierung.findUnique({
      where: { id },
      include: {
        artikel: true
      }
    })
    
    if (!reservierung) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    
    return NextResponse.json(reservierung)
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// PATCH: Status einer Reservierung ändern (z.B. ZURUECK)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await req.json()
    const { status } = body
    
    const reservierung = await prisma.lagerReservierung.findUnique({
      where: { id },
      include: { artikel: true }
    })
    
    if (!reservierung) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    
    // Wenn zurückgegeben, Bestand wieder erhöhen
    if (status === "ZURUECK" && reservierung.status === "RESERVIERT") {
      await prisma.$transaction([
        prisma.lagerReservierung.update({
          where: { id },
          data: { status: "ZURUECK" }
        }),
        prisma.lagerArtikel.update({
          where: { id: reservierung.artikelId },
          data: { bestand: { increment: reservierung.menge } }
        }),
        prisma.lagerBewegung.create({
          data: {
            artikelId: reservierung.artikelId,
            auftragId: reservierung.auftragId,
            typ: "rueckgabe",
            menge: reservierung.menge,
            notiz: "Reservierung zurückgegeben"
          }
        })
      ])
    } else {
      await prisma.lagerReservierung.update({
        where: { id },
        data: { status }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

// DELETE: Reservierung löschen
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const reservierung = await prisma.lagerReservierung.findUnique({
      where: { id }
    })
    
    if (!reservierung) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    
    // Wenn noch reserviert, Bestand wieder erhöhen
    if (reservierung.status === "RESERVIERT") {
      await prisma.$transaction([
        prisma.lagerReservierung.delete({ where: { id } }),
        prisma.lagerArtikel.update({
          where: { id: reservierung.artikelId },
          data: { bestand: { increment: reservierung.menge } }
        })
      ])
    } else {
      await prisma.lagerReservierung.delete({ where: { id } })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
