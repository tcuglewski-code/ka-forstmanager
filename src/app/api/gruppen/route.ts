import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit

  // Role-based filter: GF should only see their own group(s)
  const userRole = (user as { role?: string; email?: string }).role
  const userEmail = (user as { role?: string; email?: string }).email
  const isAdmin = !!userRole && ["admin", "ka_admin", "administrator"].includes(userRole)
  const isGF = userRole === "ka_gruppenführer" || userRole === "ka_gruppenfuehrer"

  const where: Prisma.GruppeWhereInput = {}
  if (!isAdmin && isGF && userEmail) {
    const ownMitarbeiter = await prisma.mitarbeiter.findFirst({
      where: { email: userEmail, deletedAt: null },
      select: { id: true },
    })
    const mitarbeiterId = ownMitarbeiter?.id ?? "__none__"
    where.OR = [
      { gruppenfuehrerId: mitarbeiterId },
      { mitglieder: { some: { mitarbeiterId } } },
    ]
  }

  const gruppen = await prisma.gruppe.findMany({
    where,
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

  const total = await prisma.gruppe.count({ where })
  return NextResponse.json({ items: result, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
