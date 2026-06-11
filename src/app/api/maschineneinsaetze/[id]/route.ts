import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"


export const PATCH = withErrorHandler(async (req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const einsatz = await prisma.maschineneinsatz.update({
    where: { id },
    data: {
      ...(body.bisDatum !== undefined && {
        bisDatum: body.bisDatum ? new Date(body.bisDatum) : null,
      }),
      ...(body.zweck !== undefined && { zweck: body.zweck }),
      ...(body.stundensatz !== undefined && { stundensatz: body.stundensatz }),
    },
  })

  // Wenn bisDatum gesetzt → Fahrzeug zurück auf "verfuegbar"
  if (body.bisDatum) {
    await prisma.fahrzeug
      .update({
        where: { id: einsatz.fahrzeugId },
        data: { status: "verfuegbar" },
      })
      .catch((err) => { console.error("Fahrzeug-Status Reset Fehler:", err) })
  }

  return NextResponse.json(einsatz)
})

export const DELETE = withErrorHandler(async (_req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // AUDIT-FIX: [K8] Beim Löschen eines aktiven Einsatzes blieb das Fahrzeug auf "im_einsatz" hängen
  const einsatz = await prisma.maschineneinsatz.findUnique({
    where: { id },
    select: { fahrzeugId: true, bisDatum: true },
  })

  await prisma.maschineneinsatz.delete({ where: { id } })

  if (einsatz && !einsatz.bisDatum) {
    // Nur zurücksetzen, wenn kein anderer offener Einsatz für das Fahrzeug existiert
    const andererOffener = await prisma.maschineneinsatz.findFirst({
      where: { fahrzeugId: einsatz.fahrzeugId, bisDatum: null },
      select: { id: true },
    })
    if (!andererOffener) {
      await prisma.fahrzeug
        .update({ where: { id: einsatz.fahrzeugId }, data: { status: "verfuegbar" } })
        .catch((err) => { console.error("Fahrzeug-Status Reset Fehler:", err) })
    }
  }

  return NextResponse.json({ ok: true })
})
