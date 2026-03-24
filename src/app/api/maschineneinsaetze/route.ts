import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const einsaetze = await prisma.maschineneinsatz.findMany({
    include: {
      fahrzeug: { select: { id: true, bezeichnung: true, kennzeichen: true } },
      gruppe: { select: { id: true, name: true } },
      auftrag: { select: { id: true, titel: true } },
    },
    orderBy: { vonDatum: "desc" },
  })
  return NextResponse.json(einsaetze)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
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
    .catch(() => {})

  return NextResponse.json(einsatz, { status: 201 })
}
