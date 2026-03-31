/**
 * Public API Endpoint für Website-Wizard
 * Ermöglicht das Erstellen von Aufträgen ohne User-Auth
 * Authentifizierung via x-ka-api-key Header
 * 
 * POST /api/public/auftraege
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { notifyAdminsNewAuftrag } from "@/lib/telegram"

const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY ?? ""
const ALLOWED_ORIGIN = "https://peru-otter-113714.hostingersite.com"

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-ka-api-key",
  "Access-Control-Max-Age": "86400",
}

// CORS Preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

// Request Body Interface
interface CreateAuftragRequest {
  waldbesitzer: string
  waldbesitzerEmail?: string
  waldbesitzerTelefon?: string
  bundesland?: string
  flaeche?: number
  beschreibung?: string
  standort?: string
  baumarten?: string
  zeitraum?: string
  wizardDaten?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  // CORS Header für alle Responses
  const headers = { ...corsHeaders }

  try {
    // API-Key prüfen
    const apiKey = req.headers.get("x-ka-api-key")
    
    if (!PUBLIC_API_KEY) {
      console.error("[Public API] PUBLIC_API_KEY nicht konfiguriert")
      return NextResponse.json(
        { success: false, error: "API nicht konfiguriert" },
        { status: 500, headers }
      )
    }

    if (apiKey !== PUBLIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Ungültiger API-Key" },
        { status: 401, headers }
      )
    }

    // Request Body parsen
    const body: CreateAuftragRequest = await req.json()

    // Validierung
    if (!body.waldbesitzer || body.waldbesitzer.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Waldbesitzer ist erforderlich" },
        { status: 400, headers }
      )
    }

    // Auftragsnummer generieren: AU-YYYY-NNNN
    const year = new Date().getFullYear()
    const lastAuftrag = await prisma.auftrag.findFirst({
      where: { nummer: { startsWith: `AU-${year}-` } },
      orderBy: { nummer: "desc" },
      select: { nummer: true },
    })

    let nextNumber = 1
    if (lastAuftrag?.nummer) {
      const match = lastAuftrag.nummer.match(/AU-\d{4}-(\d{4})/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const auftragNummer = `AU-${year}-${String(nextNumber).padStart(4, "0")}`

    // Titel generieren
    const titel = body.standort
      ? `${body.waldbesitzer} - ${body.standort}`
      : `Anfrage ${body.waldbesitzer}`

    // Auftrag erstellen
    const auftrag = await prisma.auftrag.create({
      data: {
        nummer: auftragNummer,
        titel,
        typ: "pflanzung", // Default
        status: "anfrage",
        waldbesitzer: body.waldbesitzer.trim(),
        waldbesitzerEmail: body.waldbesitzerEmail?.trim() ?? null,
        waldbesitzerTelefon: body.waldbesitzerTelefon?.trim() ?? null,
        bundesland: body.bundesland?.trim() ?? null,
        flaeche_ha: body.flaeche ?? null,
        beschreibung: body.beschreibung?.trim() ?? null,
        standort: body.standort?.trim() ?? null,
        baumarten: body.baumarten?.trim() ?? null,
        zeitraum: body.zeitraum?.trim() ?? null,
        wizardDaten: body.wizardDaten ? JSON.parse(JSON.stringify(body.wizardDaten)) : undefined,
        neuFlag: true, // Als "neu" markieren
      },
    })

    // Audit-Log erstellen
    await prisma.auftragLog.create({
      data: {
        auftragId: auftrag.id,
        aktion: "erstellt_via_wizard",
        von: null,
        nach: "anfrage",
        userId: null,
      },
    }).catch(() => {}) // Silent fail

    // Telegram-Benachrichtigung an Admins (fire-and-forget)
    notifyAdminsNewAuftrag(
      auftrag.id,
      auftragNummer,
      body.waldbesitzer,
      body.bundesland,
      body.flaeche
    ).catch((err) => console.error("[Public API] Telegram-Benachrichtigung fehlgeschlagen:", err))

    console.log(`[Public API] Neuer Auftrag erstellt: ${auftragNummer}`)

    return NextResponse.json(
      {
        success: true,
        auftragId: auftrag.id,
        auftragNummer: auftragNummer,
      },
      { status: 201, headers }
    )
  } catch (err) {
    console.error("[Public API] Fehler:", err)
    return NextResponse.json(
      { success: false, error: "Interner Serverfehler" },
      { status: 500, headers }
    )
  }
}
