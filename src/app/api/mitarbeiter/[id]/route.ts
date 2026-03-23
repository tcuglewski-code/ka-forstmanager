import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id } })
  if (!mitarbeiter) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  return NextResponse.json(mitarbeiter)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const data = await req.json()
    const mitarbeiter = await prisma.mitarbeiter.update({ where: { id }, data })
    return NextResponse.json(mitarbeiter)
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    await prisma.mitarbeiter.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
