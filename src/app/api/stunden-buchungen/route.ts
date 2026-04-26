import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mitarbeiterId = searchParams.get("mitarbeiterId")
  const monat = searchParams.get("monat") // format: YYYY-MM
  const page = parseInt(searchParams.get("page") || "1")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (mitarbeiterId) where.mitarbeiterId = mitarbeiterId
  if (monat) {
    const [year, month] = monat.split("-").map(Number)
    where.datum = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    }
  }

  const [items, total] = await Promise.all([
    prisma.stundeneintrag.findMany({
      where,
      include: {
        mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
        auftrag: { select: { id: true, titel: true, nummer: true } },
      },
      orderBy: { datum: "desc" },
      take: limit,
      skip,
    }),
    prisma.stundeneintrag.count({ where }),
  ])

  // Aggregation for the period
  const summe = await prisma.stundeneintrag.aggregate({
    where,
    _sum: { stunden: true },
  })

  return NextResponse.json({
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    gesamtStunden: summe._sum.stunden || 0,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { mitarbeiterId, datum, stunden, typ, auftragId, notiz } = body

    if (!mitarbeiterId || !datum || !stunden) {
      return NextResponse.json({ error: "mitarbeiterId, datum und stunden sind erforderlich" }, { status: 400 })
    }

    // Get Mitarbeiter stundenlohn for snapshot
    const mitarbeiter = await prisma.mitarbeiter.findUnique({
      where: { id: mitarbeiterId },
      select: { stundenlohn: true },
    })

    const eintrag = await prisma.stundeneintrag.create({
      data: {
        mitarbeiterId,
        datum: new Date(datum),
        stunden: parseFloat(stunden),
        typ: typ || "arbeit",
        auftragId: auftragId || null,
        notiz: notiz || null,
        stundenlohn: mitarbeiter?.stundenlohn || null,
      },
      include: {
        mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
        auftrag: { select: { id: true, titel: true, nummer: true } },
      },
    })

    return NextResponse.json(eintrag, { status: 201 })
  } catch (error) {
    console.error("[StundenBuchungen POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
