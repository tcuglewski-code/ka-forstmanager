import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    await prisma.rechnung.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    console.error("[RECHNUNG DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const rechnung = await prisma.rechnung.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.notizen !== undefined && { notizen: body.notizen }),
      ...(body.pdfUrl !== undefined && { pdfUrl: body.pdfUrl }),
      ...(body.faelligAm && { faelligAm: new Date(body.faelligAm) }),
    },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  return NextResponse.json(rechnung)
}
