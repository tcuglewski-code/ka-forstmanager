// KL-2: Lieferanten-Stammdaten API
// GET /api/lager/lieferanten — Liste aller Lieferanten
// POST /api/lager/lieferanten — Neuen Lieferanten erstellen

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Alle Lieferanten abrufen
export async function GET(req: NextRequest) {
  try {
    await auth()
    
    const { searchParams } = new URL(req.url)
    const aktiv = searchParams.get("aktiv")

    const lieferanten = await prisma.lieferant.findMany({
      where: aktiv !== null ? { aktiv: aktiv === "true" } : undefined,
      include: {
        _count: {
          select: { artikel: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(lieferanten)
  } catch (error) {
    console.error("[Lieferanten GET] Fehler:", error)
    return NextResponse.json({ error: "Abruf fehlgeschlagen" }, { status: 500 })
  }
}

// POST — Neuen Lieferanten erstellen
export async function POST(req: NextRequest) {
  try {
    await auth()
    
    const body = await req.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name erforderlich" }, { status: 400 })
    }

    // FM-34: Auto-prefix https:// for website URLs
    let website = body.website?.trim() || null
    if (website && !/^https?:\/\//i.test(website)) {
      website = `https://${website}`
    }

    const lieferant = await prisma.lieferant.create({
      data: {
        name: body.name.trim(),
        email: body.email || null,
        telefon: body.telefon || null,
        website,
        adresse: body.adresse || null,
        plz: body.plz || null,
        ort: body.ort || null,
        land: body.land || "Deutschland",
        notizen: body.notizen || null,
      },
    })

    return NextResponse.json(lieferant, { status: 201 })
  } catch (error) {
    console.error("[Lieferanten POST] Fehler:", error)
    
    // Unique constraint error
    if (error instanceof Error && error.message.includes("Unique")) {
      return NextResponse.json(
        { error: "Lieferant mit diesem Namen existiert bereits" },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ error: "Erstellen fehlgeschlagen" }, { status: 500 })
  }
}
