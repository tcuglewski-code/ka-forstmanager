import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const monat = searchParams.get("monat")
  const jahr = searchParams.get("jahr")

  const where: Record<string, number> = {}
  if (monat) where.monat = parseInt(monat)
  if (jahr) where.jahr = parseInt(jahr)

  const eintraege = await prisma.lohneintrag.findMany({
    where,
    include: {
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
    },
    orderBy: [{ jahr: "desc" }, { monat: "desc" }],
  })
  return NextResponse.json(eintraege)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const stunden = parseFloat(body.stunden)
    const stundenlohn = parseFloat(body.stundenlohn)
    const eintrag = await prisma.lohneintrag.create({
      data: {
        mitarbeiterId: body.mitarbeiterId,
        saisonId: body.saisonId ?? null,
        monat: parseInt(body.monat),
        jahr: parseInt(body.jahr),
        stunden,
        stundenlohn,
        brutto: stunden * stundenlohn,
        netto: body.netto ? parseFloat(body.netto) : null,
        ausgezahlt: body.ausgezahlt ?? false,
        ausgezahltAm: body.ausgezahltAm ? new Date(body.ausgezahltAm) : null,
        notizen: body.notizen ?? null,
      },
    })
    return NextResponse.json(eintrag, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2003') {
      return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 })
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: "Datensatz nicht gefunden" }, { status: 404 })
    }
    console.error("[Lohn POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
