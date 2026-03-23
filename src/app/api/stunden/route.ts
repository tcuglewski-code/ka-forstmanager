import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const mitarbeiterId = searchParams.get("mitarbeiterId")
  const monat = searchParams.get("monat")
  const jahr = searchParams.get("jahr")
  const genehmigt = searchParams.get("genehmigt")

  const where: Record<string, unknown> = {}
  if (mitarbeiterId) where.mitarbeiterId = mitarbeiterId
  if (genehmigt !== null && genehmigt !== "") where.genehmigt = genehmigt === "true"
  if (monat && jahr) {
    const m = parseInt(monat), y = parseInt(jahr)
    const von = new Date(y, m - 1, 1)
    const bis = new Date(y, m, 1)
    where.datum = { gte: von, lt: bis }
  }

  const data = await prisma.stundeneintrag.findMany({
    where,
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
    orderBy: { datum: "desc" },
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const entry = await prisma.stundeneintrag.create({
    data: {
      mitarbeiterId: body.mitarbeiterId,
      datum: new Date(body.datum),
      stunden: parseFloat(body.stunden),
      typ: body.typ ?? "arbeit",
      auftragId: body.auftragId ?? null,
      notiz: body.notiz ?? null,
      genehmigt: body.genehmigt ?? false,
    },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
  })
  return NextResponse.json(entry, { status: 201 })
}
