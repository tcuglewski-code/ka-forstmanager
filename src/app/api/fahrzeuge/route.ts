// Alias route: App calls /api/fahrzeuge, mirrors /api/fuhrpark logic
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const fahrzeuge = await prisma.fahrzeug.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(fahrzeuge)
}

export async function POST(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
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
  } catch (error) {
    console.error("[Fahrzeuge POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
