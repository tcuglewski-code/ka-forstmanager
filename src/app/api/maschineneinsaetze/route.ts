import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async () => {
  const einsaetze = await prisma.maschineneinsatz.findMany({
    include: {
      fahrzeug: { select: { id: true, bezeichnung: true, kennzeichen: true } },
      gruppe: { select: { id: true, name: true } },
      auftrag: { select: { id: true, titel: true } },
    },
    orderBy: { vonDatum: "desc" },
  })
  return NextResponse.json(einsaetze)
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // AUDIT-FIX: [K8] Overlap-Check — ein Fahrzeug konnte für überlappende Zeiträume doppelt gebucht werden
  const vonDatum = new Date(body.vonDatum)
  const bisDatum = body.bisDatum ? new Date(body.bisDatum) : null
  const ueberlappung = await prisma.maschineneinsatz.findFirst({
    where: {
      fahrzeugId: body.fahrzeugId,
      // bestehender Einsatz beginnt vor Ende des neuen (oder neuer Einsatz ist offen)
      ...(bisDatum ? { vonDatum: { lte: bisDatum } } : {}),
      // bestehender Einsatz endet nach Beginn des neuen (oder ist offen)
      OR: [{ bisDatum: null }, { bisDatum: { gte: vonDatum } }],
    },
    select: { id: true, vonDatum: true, bisDatum: true },
  })
  if (ueberlappung) {
    return NextResponse.json(
      {
        error: "Fahrzeug ist im gewählten Zeitraum bereits im Einsatz",
        konflikt: ueberlappung,
      },
      { status: 409 }
    )
  }

  const einsatz = await prisma.maschineneinsatz.create({
    data: {
      fahrzeugId: body.fahrzeugId,
      gruppeId: body.gruppeId ?? null,
      auftragId: body.auftragId ?? null,
      vonDatum: new Date(body.vonDatum),
      bisDatum: body.bisDatum ? new Date(body.bisDatum) : null,
      zweck: body.zweck ?? null,
      stundensatz: body.stundensatz ?? null,
    },
  })

  // Fahrzeug-Status auf "im_einsatz" setzen
  await prisma.fahrzeug
    .update({
      where: { id: body.fahrzeugId },
      data: { status: "im_einsatz" },
    })
    .catch((err) => { console.error("Fahrzeug-Status Update Fehler:", err) })

  return NextResponse.json(einsatz, { status: 201 })
})
