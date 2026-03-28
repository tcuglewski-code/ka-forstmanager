import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin, isAdminOrGF } from "@/lib/permissions"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  // Sprint UX: Schnellsuche
  if (search) {
    where.OR = [
      { nummer: { contains: search, mode: "insensitive" } },
      { auftrag: { titel: { contains: search, mode: "insensitive" } } },
      { auftrag: { waldbesitzer: { contains: search, mode: "insensitive" } } },
    ]
  }

  const data = await prisma.rechnung.findMany({
    where,
    include: { auftrag: { select: { id: true, titel: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  if (body.betrag === undefined || body.betrag === null) {
    return NextResponse.json({ error: "betrag ist ein Pflichtfeld" }, { status: 400 })
  }
  if (isNaN(parseFloat(body.betrag)) || parseFloat(body.betrag) <= 0) {
    return NextResponse.json({ error: "betrag muss eine positive Zahl sein" }, { status: 400 })
  }

  // Sprint Q: Auto-Rechnungsnummer generieren falls nicht angegeben
  let nummer = body.nummer?.trim()
  if (!nummer) {
    const lastRechnung = await prisma.rechnung.findFirst({
      orderBy: { createdAt: "desc" },
      select: { nummer: true },
    })
    const lastNum = lastRechnung?.nummer
      ? parseInt(lastRechnung.nummer.replace(/\D/g, "")) || 0
      : 0
    nummer = `RE-${new Date().getFullYear()}-${String(lastNum + 1).padStart(4, "0")}`
  }

  const rechnung = await prisma.rechnung.create({
    data: {
      nummer,
      auftragId: body.auftragId || null,
      betrag: parseFloat(body.betrag),
      mwst: body.mwst ? parseFloat(body.mwst) : 19,
      status: "offen",
      faelligAm: body.faelligAm ? new Date(body.faelligAm) : null,
      notizen: body.notizen ?? null,
    },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  return NextResponse.json(rechnung, { status: 201 })
}
