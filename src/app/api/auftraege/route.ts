import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const typ = searchParams.get("typ")

  const where: Record<string, string> = {}
  if (status) where.status = status
  if (typ) where.typ = typ

  const auftraege = await prisma.auftrag.findMany({
    where,
    include: {
      saison: { select: { id: true, name: true } },
      gruppe: { select: { id: true, name: true } },
    },
    orderBy: { wpErstelltAm: "desc" },
  })

  return NextResponse.json(auftraege)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const auftrag = await prisma.auftrag.create({
      data: {
        titel: body.titel,
        typ: body.typ,
        status: body.status ?? "anfrage",
        beschreibung: body.beschreibung ?? null,
        flaeche_ha: body.flaeche_ha ? parseFloat(body.flaeche_ha) : null,
        standort: body.standort ?? null,
        bundesland: body.bundesland ?? null,
        waldbesitzer: body.waldbesitzer ?? null,
        waldbesitzerEmail: body.waldbesitzerEmail ?? null,
        wpProjektId: body.wpProjektId ?? null,
        saisonId: body.saisonId ?? null,
        gruppeId: body.gruppeId ?? null,
        startDatum: body.startDatum ? new Date(body.startDatum) : null,
        endDatum: body.endDatum ? new Date(body.endDatum) : null,
      },
    })
    return NextResponse.json(auftrag, { status: 201 })
  } catch (error) {
    console.error("[Auftraege POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
