// @ts-nocheck
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const baumschulen = await prisma.baumschule.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { anfragen: true } },
      },
    })
    return NextResponse.json(baumschulen)
  } catch (error) {
    console.error("GET /api/saatguternte/baumschulen error:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, ort, bundesland, ansprechpartner, email, telefon, notizen } = body

    if (!name) {
      return NextResponse.json({ error: "Name ist Pflichtfeld" }, { status: 400 })
    }

    const baumschule = await prisma.baumschule.create({
      data: { name, ort, bundesland, ansprechpartner, email, telefon, notizen },
    })

    return NextResponse.json(baumschule, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Name bereits vergeben" }, { status: 409 })
    }
    console.error("POST /api/saatguternte/baumschulen error:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 })
  }
}
