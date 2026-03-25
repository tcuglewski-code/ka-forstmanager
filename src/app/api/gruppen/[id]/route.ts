import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    // 1 GF pro Saison Validierung
    if (body.gruppenfuehrerId && body.saisonId) {
      const conflict = await prisma.gruppe.findFirst({
        where: {
          gruppenfuehrerId: body.gruppenfuehrerId,
          saisonId: body.saisonId,
          id: { not: id }
        }
      })
      if (conflict) {
        return NextResponse.json({ error: `Dieser Gruppenführer leitet in dieser Saison bereits Gruppe "${conflict.name}"` }, { status: 409 })
      }
    }

    const gruppe = await prisma.gruppe.update({ where: { id }, data: body })
    return NextResponse.json(gruppe)
  } catch (error) {
    console.error("[Gruppen PATCH]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.gruppe.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Gruppen DELETE]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
