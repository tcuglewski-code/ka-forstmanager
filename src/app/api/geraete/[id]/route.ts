import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const geraet = await prisma.geraet.update({
    where: { id },
    data: {
      ...body,
      naechsteWartung: body.naechsteWartung ? new Date(body.naechsteWartung) : undefined,
    },
  })
  return NextResponse.json(geraet)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.geraet.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
