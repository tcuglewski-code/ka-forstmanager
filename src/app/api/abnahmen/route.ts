import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const auftragId = searchParams.get("auftragId")
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (auftragId) where.auftragId = auftragId
  const data = await prisma.abnahme.findMany({
    where,
    include: { auftrag: { select: { id: true, titel: true } } },
    orderBy: { datum: "desc" },
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const abnahme = await prisma.abnahme.create({
    data: {
      auftragId: body.auftragId,
      datum: body.datum ? new Date(body.datum) : new Date(),
      foersterId: body.foersterId ?? null,
      status: body.status ?? "offen",
      notizen: body.notizen ?? null,
      signaturUrl: body.signaturUrl ?? null,
    },
    include: { auftrag: { select: { id: true, titel: true } } },
  })
  return NextResponse.json(abnahme, { status: 201 })
}
