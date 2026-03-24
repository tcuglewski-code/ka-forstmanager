import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
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
  } catch (error) {
    console.error("[Geraete PATCH]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.geraet.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Geraete DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
