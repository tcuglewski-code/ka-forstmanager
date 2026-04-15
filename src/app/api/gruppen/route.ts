import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit

  const gruppen = await prisma.gruppe.findMany({
    include: {
      saison: { select: { id: true, name: true } },
      mitglieder: {
        include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  })

  // Enrich with Gruppenführer details (no relation in schema, fetch manually)
  const fuellerIds = gruppen
    .map(g => g.gruppenfuehrerId)
    .filter((id): id is string => !!id)

  const fuellerMap: Record<string, { id: string; vorname: string; nachname: string }> = {}
  if (fuellerIds.length > 0) {
    const fuellerer = await prisma.mitarbeiter.findMany({
      where: { id: { in: fuellerIds } },
      select: { id: true, vorname: true, nachname: true },
    })
    for (const f of fuellerer) {
      fuellerMap[f.id] = f
    }
  }

  const result = gruppen.map(g => ({
    ...g,
    gruppenfuehrer: g.gruppenfuehrerId ? (fuellerMap[g.gruppenfuehrerId] ?? null) : null,
  }))

  const total = await prisma.gruppe.count()
  return NextResponse.json({ items: result, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    // Pflichtfeld-Validierung (Sprint P)
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name ist ein Pflichtfeld" }, { status: 400 })
    }

    // 1 GF pro Saison Validierung
    if (body.gruppenfuehrerId && body.saisonId) {
      const conflict = await prisma.gruppe.findFirst({
        where: { gruppenfuehrerId: body.gruppenfuehrerId, saisonId: body.saisonId }
      })
      if (conflict) {
        return NextResponse.json({ error: `Dieser Gruppenführer leitet in dieser Saison bereits Gruppe "${conflict.name}"` }, { status: 409 })
      }
    }

    const gruppe = await prisma.gruppe.create({
      data: {
        name: body.name,
        saisonId: body.saisonId ?? null,
        gruppenfuehrerId: body.gruppenfuehrerId ?? null,
        status: body.status ?? "aktiv",
      },
    })
    return NextResponse.json(gruppe, { status: 201 })
  } catch (error) {
    console.error("[Gruppen POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
