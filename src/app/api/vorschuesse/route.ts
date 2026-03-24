import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/permissions"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await prisma.vorschuss.findMany({
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
    orderBy: { datum: "desc" },
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
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
}
