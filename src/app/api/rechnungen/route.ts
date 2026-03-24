import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin, isAdminOrGF } from "@/lib/permissions"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const data = await prisma.rechnung.findMany({
    include: { auftrag: { select: { id: true, titel: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  if (!body.auftragId || body.betrag === undefined || body.betrag === null) {
    return NextResponse.json({ error: "auftragId und betrag sind Pflichtfelder" }, { status: 400 })
  }
  if (isNaN(parseFloat(body.betrag)) || parseFloat(body.betrag) <= 0) {
    return NextResponse.json({ error: "betrag muss eine positive Zahl sein" }, { status: 400 })
  }
  const rechnung = await prisma.rechnung.create({
    data: {
      nummer: body.nummer,
      auftragId: body.auftragId ?? null,
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
