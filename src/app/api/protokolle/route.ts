import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const auftragId = searchParams.get("auftragId")
  const gruppeId = searchParams.get("gruppeId")
  const von = searchParams.get("von")
  const bis = searchParams.get("bis")

  // Paginierung (Sprint P)
  const take = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)
  const skip = parseInt(searchParams.get("offset") ?? "0")

  const where: Record<string, unknown> = {}
  if (auftragId) where.auftragId = auftragId
  if (gruppeId) where.gruppeId = gruppeId
  if (von || bis) {
    where.datum = {}
    if (von) (where.datum as Record<string, unknown>).gte = new Date(von)
    if (bis) (where.datum as Record<string, unknown>).lte = new Date(bis)
  }

  const [data, total] = await Promise.all([
    prisma.tagesprotokoll.findMany({
      where,
      include: { auftrag: { select: { id: true, titel: true } } },
      orderBy: { datum: "desc" },
      take,
      skip,
    }),
    prisma.tagesprotokoll.count({ where }),
  ])

  return NextResponse.json(data, {
    headers: { "X-Total-Count": String(total) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const proto = await prisma.tagesprotokoll.create({
    data: {
      auftragId: body.auftragId ?? null,
      gruppeId: body.gruppeId ?? null,
      datum: new Date(body.datum),
      ersteller: body.ersteller ?? session.user?.name ?? null,
      bericht: body.bericht ?? null,
      gepflanzt: body.gepflanzt ? parseInt(body.gepflanzt) : null,
      witterung: body.witterung ?? null,
      fotos: body.fotos ?? null,
    },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  return NextResponse.json(proto, { status: 201 })
}
