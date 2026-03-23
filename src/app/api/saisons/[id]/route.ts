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
  const saison = await prisma.saison.findUnique({ where: { id } })
  if (!saison) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  return NextResponse.json(saison)
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
    const saison = await prisma.saison.update({ where: { id }, data })
    return NextResponse.json(saison)
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
    await prisma.saison.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
