import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.vorschuss.findMany({
      include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
      orderBy: { datum: "desc" },
      skip,
      take: limit,
    }),
    prisma.vorschuss.count(),
  ])
  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
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
