import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gruppe = await prisma.gruppe.findUnique({
    where: { id },
    include: {
      saison: true,
      auftraege: true,
      mitglieder: {
        include: { mitarbeiter: true },
      },
    },
  })
  if (!gruppe) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(gruppe)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const gruppe = await prisma.gruppe.update({ where: { id }, data: body })
  return NextResponse.json(gruppe)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.gruppe.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
