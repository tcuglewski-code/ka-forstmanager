import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
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
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: "Datensatz nicht gefunden" }, { status: 404 })
    }
    console.error("[Lohn PATCH]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    await prisma.lohneintrag.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: "Datensatz nicht gefunden" }, { status: 404 })
    }
    console.error("[Lohn DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
