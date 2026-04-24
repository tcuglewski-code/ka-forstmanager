import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Einzelnen Lieferanten abrufen
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const lieferant = await prisma.lieferant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { artikel: true }
        }
      }
    })
    
    if (!lieferant) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    }
    
    return NextResponse.json(lieferant)
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// PATCH: Lieferant aktualisieren
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await req.json()
    const { name, email, telefon, website, adresse, plz, ort, land, notizen, aktiv } = body

    // FM-34: Auto-prefix https:// for website URLs
    let normalizedWebsite = website
    if (website !== undefined && website && !/^https?:\/\//i.test(website)) {
      normalizedWebsite = `https://${website}`
    }

    const updated = await prisma.lieferant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(telefon !== undefined && { telefon }),
        ...(website !== undefined && { website: normalizedWebsite }),
        ...(adresse !== undefined && { adresse }),
        ...(plz !== undefined && { plz }),
        ...(ort !== undefined && { ort }),
        ...(land !== undefined && { land }),
        ...(notizen !== undefined && { notizen }),
        ...(aktiv !== undefined && { aktiv })
      }
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

// DELETE: Lieferant löschen
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    // Prüfen ob noch Artikel zugeordnet
    const artikelCount = await prisma.lagerArtikel.count({
      where: { lieferantId: id }
    })
    
    if (artikelCount > 0) {
      return NextResponse.json(
        { error: `Kann nicht gelöscht werden: ${artikelCount} Artikel zugeordnet` },
        { status: 400 }
      )
    }
    
    await prisma.lieferant.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
