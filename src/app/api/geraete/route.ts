import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const geraete = await prisma.geraet.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(geraete)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const geraet = await prisma.geraet.create({
    data: {
      typ: body.typ,
      bezeichnung: body.bezeichnung,
      seriennummer: body.seriennummer ?? null,
      status: body.status ?? "verfuegbar",
      naechsteWartung: body.naechsteWartung ? new Date(body.naechsteWartung) : null,
      notizen: body.notizen ?? null,
    },
  })
  return NextResponse.json(geraet, { status: 201 })
}
