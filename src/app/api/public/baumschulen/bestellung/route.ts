/**
 * Public API Endpoint: Baumschul-Bestellung via Website-Wizard
 * Erstellt eine neue BaumschulBestellung aus dem WP Pflanzen-Anfrage Wizard
 * Kein Auth nötig — für WP Website Wizard
 *
 * POST /api/public/baumschulen/bestellung
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALLOWED_ORIGIN = "https://peru-otter-113714.hostingersite.com"

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

interface BestellungRequest {
  baumschule_id: string
  pflanzen_arten: string[]
  menge_gesamt: number
  kontakt_name: string
  kontakt_email: string
  kontakt_telefon?: string
  flaeche_ha?: number
  anfrage_datum?: string
}

export async function POST(req: NextRequest) {
  const headers = { ...corsHeaders }

  try {
    const body: BestellungRequest = await req.json()

    // Pflichtfelder prüfen
    if (!body.baumschule_id || !body.kontakt_name || !body.kontakt_email) {
      return NextResponse.json(
        { success: false, error: "baumschule_id, kontakt_name und kontakt_email sind erforderlich" },
        { status: 400, headers }
      )
    }

    if (!body.pflanzen_arten || body.pflanzen_arten.length === 0) {
      return NextResponse.json(
        { success: false, error: "Mindestens eine Pflanzenart ist erforderlich" },
        { status: 400, headers }
      )
    }

    if (!body.menge_gesamt || body.menge_gesamt <= 0) {
      return NextResponse.json(
        { success: false, error: "Menge muss größer als 0 sein" },
        { status: 400, headers }
      )
    }

    // Baumschule existiert und ist aktiv?
    const baumschule = await prisma.baumschule.findFirst({
      where: { id: body.baumschule_id, aktiv: true },
      select: { id: true, name: true },
    })

    if (!baumschule) {
      return NextResponse.json(
        { success: false, error: "Baumschule nicht gefunden oder nicht aktiv" },
        { status: 404, headers }
      )
    }

    // Bestellung erstellen
    const bestellung = await prisma.baumschulBestellung.create({
      data: {
        baumschuleId: baumschule.id,
        baumart: body.pflanzen_arten.join(", "),
        menge: body.menge_gesamt,
        status: "neu",
        quelle: "website-wizard",
        kontaktName: body.kontakt_name.trim(),
        kontaktEmail: body.kontakt_email.trim(),
        kontaktTelefon: body.kontakt_telefon?.trim() ?? null,
        flaecheHa: body.flaeche_ha ?? null,
        pflanzenArten: body.pflanzen_arten,
        notizen: `Website-Anfrage vom ${body.anfrage_datum ?? new Date().toISOString().split("T")[0]}`,
      },
    })

    console.log(`[Public API] Neue Baumschul-Bestellung: ${bestellung.id} für ${baumschule.name}`)

    return NextResponse.json(
      {
        success: true,
        bestellungId: bestellung.id,
        baumschule: baumschule.name,
      },
      { status: 201, headers }
    )
  } catch (err) {
    console.error("[Public API] Baumschul-Bestellung Fehler:", err)
    return NextResponse.json(
      { success: false, error: "Interner Serverfehler" },
      { status: 500, headers }
    )
  }
}
