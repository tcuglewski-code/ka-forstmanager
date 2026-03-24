import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      .catch(() => {})
  }

  return NextResponse.json(einsatz)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.maschineneinsatz.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
