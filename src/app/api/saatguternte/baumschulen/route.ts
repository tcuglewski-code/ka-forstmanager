// @ts-nocheck
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // BS-MKT-01 Phase 2: pending zuerst sortieren, Sortiment direkt mitliefern
    // (Phase-1-Fix: N+1-Fetches in /baumschulen/bestellungen Admin-View vermeiden)
    const baumschulen = await prisma.baumschule.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        ort: true,
        bundesland: true,
        ansprechpartner: true,
        email: true,
        telefon: true,
        notizen: true,
        aktiv: true,
        status: true,
        lieferBundeslaender: true,
        zufZertifiziert: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        preislisten: {
          where: { aktiv: true },
          select: { baumart: true, verfuegbar: true },
        },
        _count: { select: { anfragen: true, preislisten: true } },
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
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
