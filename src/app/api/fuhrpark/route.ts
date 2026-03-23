import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const fahrzeuge = await prisma.fahrzeug.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(fahrzeuge)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const fahrzeug = await prisma.fahrzeug.create({
    data: {
      typ: body.typ,
      bezeichnung: body.bezeichnung,
      kennzeichen: body.kennzeichen ?? null,
      baujahr: body.baujahr ? parseInt(body.baujahr) : null,
      status: body.status ?? "verfuegbar",
      tuvDatum: body.tuvDatum ? new Date(body.tuvDatum) : null,
      naechsteWartung: body.naechsteWartung ? new Date(body.naechsteWartung) : null,
      notizen: body.notizen ?? null,
    },
  })
  return NextResponse.json(fahrzeug, { status: 201 })
}
