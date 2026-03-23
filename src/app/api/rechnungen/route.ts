import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await prisma.rechnung.findMany({
    include: { auftrag: { select: { id: true, titel: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
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
