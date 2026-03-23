import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const eintrag = await prisma.lohneintrag.update({
    where: { id },
    data: {
      ...body,
      stunden: body.stunden ? parseFloat(body.stunden) : undefined,
      stundenlohn: body.stundenlohn ? parseFloat(body.stundenlohn) : undefined,
      ausgezahltAm: body.ausgezahltAm ? new Date(body.ausgezahltAm) : undefined,
    },
  })
  return NextResponse.json(eintrag)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.lohneintrag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
