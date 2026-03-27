// Sprint AO: Wochenplan-Positionen — Erstellen und Löschen

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const GUELTIGE_TYPEN = [
  "pflanzung",
  "flaechenvorbereitung",
  "kulturpflege",
  "kulturschutz",
  "saatguternte",
  "sonstiges",
]

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: wochenplanId } = await params
  const body = await req.json()

  const { dienstleistungstyp } = body

  if (!dienstleistungstyp || !GUELTIGE_TYPEN.includes(dienstleistungstyp)) {
    return NextResponse.json(
      { error: `Ungültiger Dienstleistungstyp. Erlaubt: ${GUELTIGE_TYPEN.join(", ")}` },
      { status: 400 }
    )
  }

  // Wochenplan existiert?
  const wochenplan = await prisma.wochenplan.findUnique({
    where: { id: wochenplanId },
    select: { id: true },
  })
  if (!wochenplan) {
    return NextResponse.json({ error: "Wochenplan nicht gefunden" }, { status: 404 })
  }

  const position = await prisma.wochenplanPosition.create({
    data: {
      wochenplanId,
      dienstleistungstyp,
      datum: body.datum ? new Date(body.datum) : null,
      auftragId: body.auftragId ?? null,
      status: body.status ?? "geplant",
      notizen: body.notizen ?? null,
      // Gemeinsame Felder
      flaeche: body.flaeche ?? null,
      gpsPosition: body.gpsPosition ?? null,
      treffpunkt: body.treffpunkt ?? null,
      // Pflanzung
      baumart: body.baumart ?? null,
      stueckzahl: body.stueckzahl ? parseInt(body.stueckzahl) : null,
      // Saatguternte
      herkunftscode: body.herkunftscode ?? null,
      zielkg: body.zielkg ? parseFloat(body.zielkg) : null,
      gesammelteKg: body.gesammelteKg ? parseFloat(body.gesammelteKg) : 0,
    },
  })

  return NextResponse.json(position, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: wochenplanId } = await params
  const url = new URL(req.url)
  const positionId = url.searchParams.get("positionId")

  if (!positionId) {
    return NextResponse.json({ error: "positionId fehlt" }, { status: 400 })
  }

  const position = await prisma.wochenplanPosition.findFirst({
    where: { id: positionId, wochenplanId },
  })
  if (!position) {
    return NextResponse.json({ error: "Position nicht gefunden" }, { status: 404 })
  }

  await prisma.wochenplanPosition.delete({ where: { id: positionId } })

  return NextResponse.json({ message: "Position gelöscht" })
}
