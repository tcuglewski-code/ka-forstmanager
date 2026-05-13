import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { mapLagerToPflanzgut } from "@/lib/pflanzgut-helper"

// GET /api/pflanzgut — Liste der Pflanzgut-Artikel
// Query: ?baumart, ?lagerort, ?kritisch=1
export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const lagerort = req.nextUrl.searchParams.get("lagerort")
    const kritisch = req.nextUrl.searchParams.get("kritisch")

    const where: { kategorie: string; lagerort?: string; deletedAt?: null } = {
      kategorie: "pflanzgut",
      deletedAt: null,
    }
    if (lagerort) where.lagerort = lagerort

    let items = await prisma.lagerArtikel.findMany({
      where,
      orderBy: { name: "asc" },
      take: 500,
    })

    if (kritisch === "1" || kritisch === "true") {
      items = items.filter((a: { bestand: number; mindestbestand: number }) => a.bestand <= a.mindestbestand)
    }

    return NextResponse.json(items.map(mapLagerToPflanzgut))
  } catch (error) {
    console.error("[/api/pflanzgut GET] Error:", error)
    return NextResponse.json([])
  }
}

// POST /api/pflanzgut — neuen Pflanzgut-Artikel anlegen
// Body: { name, baumart, groesse, herkunft, einheit?, bestand_ist, bestand_soll?, mindestbestand?, lagerort? }
export async function POST(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.name) {
      return NextResponse.json({ error: "name ist erforderlich" }, { status: 400 })
    }

    const created = await prisma.lagerArtikel.create({
      data: {
        name: String(body.name),
        kategorie: "pflanzgut",
        einheit: body.einheit ?? "Stück",
        bestand: Number(body.bestand_ist ?? 0),
        mindestbestand: Number(body.mindestbestand ?? 0),
        lagerort: body.lagerort ?? null,
      },
    })

    return NextResponse.json(mapLagerToPflanzgut(created), { status: 201 })
  } catch (error) {
    console.error("[/api/pflanzgut POST] Error:", error)
    return NextResponse.json(
      { error: "Fehler beim Anlegen" },
      { status: 500 }
    )
  }
}
