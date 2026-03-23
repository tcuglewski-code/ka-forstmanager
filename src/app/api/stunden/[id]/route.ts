import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const entry = await prisma.stundeneintrag.update({
    where: { id },
    data: {
      ...(body.genehmigt !== undefined && { genehmigt: body.genehmigt }),
      ...(body.stunden !== undefined && { stunden: parseFloat(body.stunden) }),
      ...(body.notiz !== undefined && { notiz: body.notiz }),
    },
  })
  return NextResponse.json(entry)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.stundeneintrag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
