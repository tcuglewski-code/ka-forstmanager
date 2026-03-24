import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const abnahme = await prisma.abnahme.findUnique({
    where: { id },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  if (!abnahme) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(abnahme)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const abnahme = await prisma.abnahme.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.notizen !== undefined && { notizen: body.notizen }),
      ...(body.signaturUrl !== undefined && { signaturUrl: body.signaturUrl }),
      ...(body.foersterId !== undefined && { foersterId: body.foersterId }),
    },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  return NextResponse.json(abnahme)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    await prisma.abnahme.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    console.error("[ABNAHME DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
