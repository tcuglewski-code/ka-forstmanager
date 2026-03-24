import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const geraete = await prisma.geraet.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(geraete)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
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
  } catch (error) {
    console.error("[Geraete POST]", error)
    return NextResponse.json({ error: "Interner Serverfehler", details: String(error) }, { status: 500 })
  }
}
