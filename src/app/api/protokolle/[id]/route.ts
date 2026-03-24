import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const proto = await prisma.tagesprotokoll.findUnique({
    where: { id },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  if (!proto) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(proto)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    await prisma.tagesprotokoll.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    console.error("[TAGESPROTOKOLL DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
