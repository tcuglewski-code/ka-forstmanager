import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const fahrzeug = await prisma.fahrzeug.update({
    where: { id },
    data: {
      ...body,
      baujahr: body.baujahr ? parseInt(body.baujahr) : undefined,
      tuvDatum: body.tuvDatum ? new Date(body.tuvDatum) : undefined,
      naechsteWartung: body.naechsteWartung ? new Date(body.naechsteWartung) : undefined,
    },
  })
  return NextResponse.json(fahrzeug)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.fahrzeug.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
