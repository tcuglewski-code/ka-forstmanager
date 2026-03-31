// KJ-2: Pflanzverband API Route
// GET /api/pflanzverband — Liste aller Verbände
// POST /api/pflanzverband — Neuen Verband erstellen (Admin)

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await auth()

    const pflanzverband = await prisma.pflanzverbandConfig.findMany({
      where: { aktiv: true },
      orderBy: { sortOrder: "asc" },
    })

    // Falls keine Verbände vorhanden, Standard-Verbände erstellen
    if (pflanzverband.length === 0) {
      await seedDefaultPflanzverband()
      const seeded = await prisma.pflanzverbandConfig.findMany({
        where: { aktiv: true },
        orderBy: { sortOrder: "asc" },
      })
      return NextResponse.json(seeded)
    }

    return NextResponse.json(pflanzverband)
  } catch (error) {
    console.error("[Pflanzverband GET] Fehler:", error)
    return NextResponse.json({ error: "Abruf fehlgeschlagen" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const body = await req.json()
    
    // Stückzahl pro Hektar berechnen
    let stueckProHa = body.stueckProHa
    if (!stueckProHa && body.abstandX && body.abstandY) {
      // Bei Quincunx: Effektiv 15% mehr Pflanzen pro Fläche
      const basisStueck = Math.round(10000 / (body.abstandX * body.abstandY))
      stueckProHa = body.muster === "QUINCUNX" 
        ? Math.round(basisStueck * 1.15)
        : basisStueck
    }

    const pflanzverband = await prisma.pflanzverbandConfig.create({
      data: {
        name: body.name,
        abstandX: parseFloat(body.abstandX),
        abstandY: parseFloat(body.abstandY),
        muster: body.muster || "GLEICH",
        svgPreview: body.svgPreview || null,
        stueckProHa,
        sortOrder: body.sortOrder || 0,
      },
    })

    return NextResponse.json(pflanzverband, { status: 201 })
  } catch (error) {
    console.error("[Pflanzverband POST] Fehler:", error)
    return NextResponse.json({ error: "Erstellen fehlgeschlagen" }, { status: 500 })
  }
}

// Standard-Pflanzverbände erstellen
async function seedDefaultPflanzverband() {
  const defaults = [
    {
      name: "Quincunx 1,0×0,75m",
      abstandX: 1.0,
      abstandY: 0.75,
      muster: "QUINCUNX",
      stueckProHa: 15400,
      sortOrder: 1,
      svgPreview: `<svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="30" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="50" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="20" cy="25" r="3" fill="#2C3A1C"/>
        <circle cx="40" cy="25" r="3" fill="#2C3A1C"/>
      </svg>`,
    },
    {
      name: "Gleichverband 1,0×1,0m",
      abstandX: 1.0,
      abstandY: 1.0,
      muster: "GLEICH",
      stueckProHa: 10000,
      sortOrder: 2,
      svgPreview: `<svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="30" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="50" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="10" cy="30" r="3" fill="#2C3A1C"/>
        <circle cx="30" cy="30" r="3" fill="#2C3A1C"/>
        <circle cx="50" cy="30" r="3" fill="#2C3A1C"/>
      </svg>`,
    },
    {
      name: "Gleichverband 1,5×1,5m",
      abstandX: 1.5,
      abstandY: 1.5,
      muster: "GLEICH",
      stueckProHa: 4444,
      sortOrder: 3,
      svgPreview: `<svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="35" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="10" cy="32" r="3" fill="#2C3A1C"/>
        <circle cx="35" cy="32" r="3" fill="#2C3A1C"/>
      </svg>`,
    },
    {
      name: "Reihenverband 2,0×1,0m",
      abstandX: 2.0,
      abstandY: 1.0,
      muster: "GLEICH",
      stueckProHa: 5000,
      sortOrder: 4,
      svgPreview: `<svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="40" cy="10" r="3" fill="#2C3A1C"/>
        <circle cx="10" cy="25" r="3" fill="#2C3A1C"/>
        <circle cx="40" cy="25" r="3" fill="#2C3A1C"/>
      </svg>`,
    },
    {
      name: "Dreiecksverband 1,2×1,0m",
      abstandX: 1.2,
      abstandY: 1.0,
      muster: "QUINCUNX",
      stueckProHa: 9600,
      sortOrder: 5,
      svgPreview: `<svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="8" r="3" fill="#2C3A1C"/>
        <circle cx="30" cy="8" r="3" fill="#2C3A1C"/>
        <circle cx="50" cy="8" r="3" fill="#2C3A1C"/>
        <circle cx="20" cy="22" r="3" fill="#2C3A1C"/>
        <circle cx="40" cy="22" r="3" fill="#2C3A1C"/>
        <circle cx="10" cy="36" r="3" fill="#2C3A1C"/>
        <circle cx="30" cy="36" r="3" fill="#2C3A1C"/>
        <circle cx="50" cy="36" r="3" fill="#2C3A1C"/>
      </svg>`,
    },
  ]

  for (const verband of defaults) {
    await prisma.pflanzverbandConfig.upsert({
      where: { name: verband.name },
      update: {},
      create: verband,
    })
  }
}
