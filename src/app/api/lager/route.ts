import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const artikel = await prisma.lagerArtikel.findMany({
    orderBy: { name: "asc" },
  })
  return NextResponse.json(artikel)
}

export async function POST(req: NextRequest) {
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
}
