import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export async function GET(req: NextRequest) {
  // ⚠️ GET ist auth-geschützt — Aufträge sind interne Daten
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const typ = searchParams.get("typ")

  // Pagination
  const limitParam = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)
  const offsetParam = parseInt(searchParams.get("offset") ?? "0", 10)
  const limit = Math.min(isNaN(limitParam) ? DEFAULT_LIMIT : limitParam, MAX_LIMIT)
  const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam)

  const where: Record<string, string> = {}
  if (status) where.status = status
  if (typ) where.typ = typ

  const [auftraege, total] = await Promise.all([
    prisma.auftrag.findMany({
      where,
      include: {
        saison: { select: { id: true, name: true } },
        gruppe: { select: { id: true, name: true } },
      },
      orderBy: { wpErstelltAm: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auftrag.count({ where }),
  ])

  return NextResponse.json({
    data: auftraege,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    if (!body.titel || !body.typ) {
      return NextResponse.json({ error: "Pflichtfelder fehlen: titel, typ" }, { status: 400 })
    }

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
