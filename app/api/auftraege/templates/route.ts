import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/auftraege/templates
 * Lädt alle aktiven Auftrags-Templates
 */
export async function GET() {
  try {
    const templates = await prisma.auftragTemplate.findMany({
      where: { aktiv: true },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error("[TEMPLATES] Fehler:", error)
    return NextResponse.json(
      { error: "Fehler beim Laden der Templates" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auftraege/templates
 * Erstellt ein neues Template (Admin only)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      beschreibung,
      typ,
      defaultTitel,
      defaultBeschreibung,
      defaultFlaeche,
      defaultBaumarten,
      defaultZeitraum,
      defaultWizardDaten,
      icon,
      sortOrder,
    } = body

    if (!name || !typ) {
      return NextResponse.json(
        { error: "Name und Typ sind erforderlich" },
        { status: 400 }
      )
    }

    const template = await prisma.auftragTemplate.create({
      data: {
        name,
        beschreibung,
        typ,
        defaultTitel,
        defaultBeschreibung,
        defaultFlaeche: defaultFlaeche ? parseFloat(defaultFlaeche) : null,
        defaultBaumarten,
        defaultZeitraum,
        defaultWizardDaten,
        icon,
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("[TEMPLATES] Fehler beim Erstellen:", error)
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Templates" },
      { status: 500 }
    )
  }
}
