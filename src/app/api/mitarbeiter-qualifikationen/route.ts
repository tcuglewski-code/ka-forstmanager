import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter") // "30" | "60" | "90"
  const heute = new Date()
  let where = {}
  if (filter) {
    const days = parseInt(filter)
    const bis = new Date(heute.getTime() + days * 24 * 60 * 60 * 1000)
    where = { ablaufDatum: { lte: bis } }
  }
  const data = await prisma.mitarbeiterQualifikation.findMany({
    where,
    include: {
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
      qualifikation: { select: { id: true, name: true, typ: true } },
    },
    orderBy: { ablaufDatum: "asc" },
  })
  return NextResponse.json(data)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const entry = await prisma.mitarbeiterQualifikation.create({
    data: {
      mitarbeiterId: body.mitarbeiterId,
      qualifikationId: body.qualifikationId,
      erworbenAm: body.erworbenAm ? new Date(body.erworbenAm) : null,
      ablaufDatum: body.ablaufDatum ? new Date(body.ablaufDatum) : null,
      notiz: body.notiz,
    },
    include: {
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
      qualifikation: { select: { id: true, name: true, typ: true } },
    },
  })
  return NextResponse.json(entry, { status: 201 })
})
