import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const fahrzeug = await prisma.fahrzeug.update({
      where: { id },
      data: {
        ...body,
        baujahr: body.baujahr ? parseInt(body.baujahr) : undefined,
        tuvDatum: body.tuvDatum ? new Date(body.tuvDatum) : undefined,
        naechsteWartung: body.naechsteWartung ? new Date(body.naechsteWartung) : undefined,
        stundenBonus: body.stundenBonus !== undefined ? parseFloat(body.stundenBonus) || 0 : undefined,
        bonusBeschreibung: body.bonusBeschreibung !== undefined ? body.bonusBeschreibung : undefined,
      },
    })
    return NextResponse.json(fahrzeug)
  } catch (error) {
    console.error("[Fuhrpark PATCH]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.fahrzeug.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Fuhrpark DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
