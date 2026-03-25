import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"


export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const mitarbeiterId = searchParams.get("mitarbeiterId")
  const where = mitarbeiterId ? { mitarbeiterId } : {}
  const data = await prisma.abwesenheit.findMany({
    where,
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
    orderBy: { von: "desc" },
    take: 100,
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const entry = await prisma.abwesenheit.create({
    data: {
      mitarbeiterId: body.mitarbeiterId,
      von: new Date(body.von),
      bis: new Date(body.bis),
      typ: body.typ,
      notiz: body.notiz ?? null,
      genehmigt: false,
    },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
  })
  return NextResponse.json(entry, { status: 201 })
}
