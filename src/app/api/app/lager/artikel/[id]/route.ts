import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Artikel-Detail mit letzten 10 Buchungen für Mobile App
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const artikel = await prisma.lagerArtikel.findUnique({
      where: { id },
      include: {
        lieferant: {
          select: { id: true, name: true, email: true, telefon: true }
        }
      }
    })
    
    if (!artikel) {
      return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 })
    }
    
    // Letzte 10 Buchungen
    const bewegungen = await prisma.lagerBewegung.findMany({
      where: { artikelId: id },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        typ: true,
        menge: true,
        notiz: true,
        createdAt: true,
        auftrag: {
          select: { id: true, titel: true }
        },
        mitarbeiter: {
          select: { id: true, vorname: true, nachname: true }
        }
      }
    })
    
    return NextResponse.json({
      artikel: {
        id: artikel.id,
        name: artikel.name,
        kategorie: artikel.kategorie,
        einheit: artikel.einheit,
        bestand: artikel.bestand,
        mindestbestand: artikel.mindestbestand,
        lagerort: artikel.lagerort,
        artikelnummer: artikel.artikelnummer,
        einkaufspreis: artikel.einkaufspreis,
        verkaufspreis: artikel.verkaufspreis,
        status: artikel.bestand <= 0 ? "leer" : artikel.bestand <= artikel.mindestbestand ? "kritisch" : "ok",
        lieferant: artikel.lieferant
      },
      bewegungen: bewegungen.map(b => ({
        id: b.id,
        typ: b.typ,
        menge: b.menge,
        notiz: b.notiz,
        datum: b.createdAt,
        auftrag: b.auftrag ? { id: b.auftrag.id, titel: b.auftrag.titel } : null,
        mitarbeiter: b.mitarbeiter ? `${b.mitarbeiter.vorname} ${b.mitarbeiter.nachname}` : null
      }))
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}
