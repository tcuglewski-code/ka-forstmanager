import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const artikel = await prisma.lagerArtikel.findMany({
    orderBy: { name: "asc" },
  })
  return NextResponse.json(artikel)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const artikel = await prisma.lagerArtikel.create({
      data: {
        name: body.name,
        kategorie: body.kategorie ?? "material",
        einheit: body.einheit ?? "Stück",
        bestand: body.bestand ? parseFloat(body.bestand) : 0,
        mindestbestand: body.mindestbestand ? parseFloat(body.mindestbestand) : 0,
        lagerort: body.lagerort ?? null,
        artikelnummer: body.artikelnummer ?? null,
      },
    })
    return NextResponse.json(artikel, { status: 201 })
  } catch (error) {
    console.error("[Lager POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
