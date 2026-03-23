import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const artikel = await prisma.lagerArtikel.update({
    where: { id },
    data: {
      ...body,
      bestand: body.bestand !== undefined ? parseFloat(body.bestand) : undefined,
      mindestbestand: body.mindestbestand !== undefined ? parseFloat(body.mindestbestand) : undefined,
    },
  })
  return NextResponse.json(artikel)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.lagerArtikel.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
