import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const ids = sp.get("ids")?.split(",").filter(Boolean) ?? []

    if (ids.length === 0) {
      return NextResponse.json([])
    }

    const flaechen = await prisma.registerFlaeche.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        registerNr: true,
        baumart: true,
        bundesland: true,
        flaecheHa: true,
        forstamt: true,
        latDez: true,
        lonDez: true,
        profil: { select: { status: true } },
      },
    })

    return NextResponse.json(flaechen)
  } catch (error) {
    console.error("flaechen-by-ids error:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Flächen" }, { status: 500 })
  }
}
