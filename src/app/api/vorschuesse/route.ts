import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/permissions"
import { verifyToken } from "@/lib/auth-helpers"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  // Support both session auth and bearer token auth (App)
  const session = await auth()
  const tokenUser = !session ? await verifyToken(req) : null
  if (!session && !tokenUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit

  // If non-admin via token, filter to own Vorschuesse
  const where: Record<string, unknown> = {}
  if (tokenUser && !session) {
    const userId = (tokenUser as { id?: string; sub?: string }).id || (tokenUser as { sub?: string }).sub
    if (userId) {
      const ma = await prisma.mitarbeiter.findFirst({ where: { userId }, select: { id: true } })
      if (ma) where.mitarbeiterId = ma.id
    }
  }

  const [items, total] = await Promise.all([
    prisma.vorschuss.findMany({
      where,
      include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
      orderBy: { datum: "desc" },
      skip,
      take: limit,
    }),
    prisma.vorschuss.count({ where }),
  ])
  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Support both session auth (FM) and bearer token auth (App)
  const session = await auth()
  const tokenUser = !session ? await verifyToken(req) : null
  if (!session && !tokenUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // For App users: they can only create Vorschuss for themselves
  if (tokenUser && !session) {
    const userId = (tokenUser as { id?: string; sub?: string }).id || (tokenUser as { sub?: string }).sub
    if (userId) {
      const ma = await prisma.mitarbeiter.findFirst({ where: { userId }, select: { id: true } })
      if (!ma) return NextResponse.json({ error: "Kein Mitarbeiter-Profil gefunden" }, { status: 404 })
      body.mitarbeiterId = ma.id
    }
  } else if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const vs = await prisma.vorschuss.create({
    data: {
      mitarbeiterId: body.mitarbeiterId,
      betrag: parseFloat(body.betrag),
      datum: body.datum ? new Date(body.datum) : new Date(),
      grund: body.grund ?? null,
      genehmigt: false,
      zurueckgezahlt: false,
      individualBonus: body.individualBonus != null ? parseFloat(body.individualBonus) : 0,
      individualBonusGrund: body.individualBonusGrund ?? null,
    },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
  })
  return NextResponse.json(vs, { status: 201 })
})
