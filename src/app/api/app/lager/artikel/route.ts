import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Kompakte Artikel-Liste für Mobile App
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const kategorie = req.nextUrl.searchParams.get("kategorie")
    
    const where = kategorie ? { kategorie } : {}
    
    const artikel = await prisma.lagerArtikel.findMany({
      where,
      select: {
        id: true,
        name: true,
        bestand: true,
        mindestbestand: true,
        kategorie: true,
        einheit: true,
        lagerort: true
      },
      orderBy: { name: "asc" }
    })
    
    // Kompakte Response für Mobile
    return NextResponse.json({
      artikel: artikel.map(a => ({
        id: a.id,
        name: a.name,
        bestand: a.bestand,
        mindestbestand: a.mindestbestand,
        kategorie: a.kategorie,
        einheit: a.einheit,
        lagerort: a.lagerort,
        status: a.bestand <= 0 ? "leer" : a.bestand <= a.mindestbestand ? "kritisch" : "ok"
      })),
      total: artikel.length,
      kritisch: artikel.filter(a => a.bestand <= a.mindestbestand).length
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}
