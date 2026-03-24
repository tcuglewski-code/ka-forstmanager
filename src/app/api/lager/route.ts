import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Paginierung (Sprint P)
  const take = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)
  const skip = parseInt(searchParams.get("offset") ?? "0")

  const [artikel, total] = await Promise.all([
    prisma.lagerArtikel.findMany({
      orderBy: { name: "asc" },
      take,
      skip,
    }),
    prisma.lagerArtikel.count(),
  ])

  return NextResponse.json(artikel, {
    headers: { "X-Total-Count": String(total) },
  })
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
