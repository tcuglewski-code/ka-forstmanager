import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const typ = searchParams.get("typ")
  const auftragId = searchParams.get("auftragId")
  const saisonId = searchParams.get("saisonId")
  const where: Record<string, unknown> = {}
  if (typ) where.typ = typ
  if (auftragId) where.auftragId = auftragId
  if (saisonId) where.saisonId = saisonId
  const data = await prisma.dokument.findMany({
    where,
    include: {
      auftrag: { select: { id: true, titel: true } },
      saison: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const doc = await prisma.dokument.create({
    data: {
      name: body.name,
      typ: body.typ ?? "sonstiges",
      url: body.url,
      auftragId: body.auftragId ?? null,
      saisonId: body.saisonId ?? null,
      hochgeladenVon: session.user?.name ?? null,
    },
    include: {
      auftrag: { select: { id: true, titel: true } },
      saison: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(doc, { status: 201 })
}
