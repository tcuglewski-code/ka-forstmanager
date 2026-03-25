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

  // Paginierung (Sprint P)
  const take = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)
  const skip = parseInt(searchParams.get("offset") ?? "0")

  const where: Record<string, unknown> = {}
  if (mitarbeiterId) where.mitarbeiterId = mitarbeiterId
  if (genehmigt !== null && genehmigt !== "") where.genehmigt = genehmigt === "true"
  if (monat && jahr) {
    const m = parseInt(monat), y = parseInt(jahr)
    const von = new Date(y, m - 1, 1)
    const bis = new Date(y, m, 1)
    where.datum = { gte: von, lt: bis }
  }

  const [data, total] = await Promise.all([
    prisma.stundeneintrag.findMany({
      where,
      include: {
        mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
        auftrag: { select: { id: true, titel: true, typ: true } },
      },
      orderBy: { datum: "desc" },
      take,
      skip,
    }),
    prisma.stundeneintrag.count({ where }),
  ])

  return NextResponse.json(data, {
    headers: { "X-Total-Count": String(total) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()

  // Pflichtfeld-Validierung (Sprint P)
  if (!body.mitarbeiterId || !body.datum || !body.stunden) {
    return NextResponse.json({ error: "mitarbeiterId, datum und stunden sind Pflichtfelder" }, { status: 400 })
  }
  if (isNaN(parseFloat(body.stunden)) || parseFloat(body.stunden) <= 0) {
    return NextResponse.json({ error: "stunden muss eine positive Zahl sein" }, { status: 400 })
  }

  // Maschinenzuschlag automatisch aus Fahrzeug holen (Sprint K6)
  if (body.fahrzeugId && body.maschinenzuschlag == null) {
    const fahrzeug = await prisma.fahrzeug.findUnique({
      where: { id: body.fahrzeugId },
      select: { stundenBonus: true },
    })
    if (fahrzeug?.stundenBonus) {
      body.maschinenzuschlag = fahrzeug.stundenBonus
    }
  }

  const entry = await prisma.stundeneintrag.create({
    data: {
      mitarbeiterId: body.mitarbeiterId,
      datum: new Date(body.datum),
      stunden: parseFloat(body.stunden),
      typ: body.typ ?? "arbeit",
      auftragId: body.auftragId ?? null,
      notiz: body.notiz ?? null,
      genehmigt: body.genehmigt ?? false,
      stundenlohn: body.stundenlohn != null ? parseFloat(body.stundenlohn) : null,
      maschinenzuschlag: body.maschinenzuschlag != null ? parseFloat(body.maschinenzuschlag) : null,
    },
    include: {
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
      auftrag: { select: { id: true, titel: true, typ: true } },
    },
  })
  return NextResponse.json(entry, { status: 201 })
}
