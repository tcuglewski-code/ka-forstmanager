import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    include: {
      saison: true,
      gruppe: true,
      abnahmen: true,
      protokolle: true,
      rechnungen: true,
    },
  })
  if (!auftrag) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(auftrag)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const auftrag = await prisma.auftrag.update({
    where: { id },
    data: {
      ...body,
      flaeche_ha: body.flaeche_ha ? parseFloat(body.flaeche_ha) : undefined,
      startDatum: body.startDatum ? new Date(body.startDatum) : undefined,
      endDatum: body.endDatum ? new Date(body.endDatum) : undefined,
    },
  })
  return NextResponse.json(auftrag)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.auftrag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
