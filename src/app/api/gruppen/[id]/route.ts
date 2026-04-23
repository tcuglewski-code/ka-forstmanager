import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gruppe = await prisma.gruppe.findUnique({
    where: { id },
    include: {
      saison: true,
      auftraege: { select: { id: true, titel: true, status: true } },
      mitglieder: {
        include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true, rolle: true } } },
      },
    },
  })
  if (!gruppe) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Enrich with Gruppenführer details
  let gruppenfuehrer = null
  if (gruppe.gruppenfuehrerId) {
    gruppenfuehrer = await prisma.mitarbeiter.findUnique({
      where: { id: gruppe.gruppenfuehrerId },
      select: { id: true, vorname: true, nachname: true },
    })
  }

  return NextResponse.json({ ...gruppe, gruppenfuehrer })
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

    const { name, saisonId, gruppenfuehrerId, status } = body
    const gruppe = await prisma.gruppe.update({
      where: { id },
      data: { name, saisonId, gruppenfuehrerId, status },
    })
    return NextResponse.json(gruppe)
  } catch (error) {
    console.error("[Gruppen PATCH]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
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
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
