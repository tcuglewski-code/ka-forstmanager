// KS-2: Webhook-Empfänger für WordPress Wizard-Anfragen
// Nimmt POST von WordPress entgegen und erstellt Auftrag im ForstManager

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Webhook-Token für Authentifizierung
const WEBHOOK_TOKEN = process.env.WP_WEBHOOK_TOKEN || "KochAufforstungWebhook2026"

interface WPWizardDaten {
  // Basis-Felder aus WP Wizard
  id?: number
  titel?: string
  waldbesitzer?: string
  email?: string
  telefon?: string
  flaeche?: string | number
  standort?: string
  bundesland?: string
  angelegt?: number // Unix Timestamp
  
  // Wizard-spezifische Daten
  wizard_typ?: string // "pflanzung", "kulturschutz", etc.
  wizard_daten?: {
    pflanzverband?: string
    schutztyp?: string[]
    schutzart?: string
    zauntyp?: string
    aufwuchsart?: string[]
    arbeitsmethode?: string
    baumarten?: string
    beschreibung?: string
    lat?: number
    lng?: number
    [key: string]: unknown
  }
  
  // Weitere Felder
  status?: string
  kommentar?: string
}

export async function POST(request: NextRequest) {
  try {
    // Bearer Token Authentifizierung prüfen
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[WP-Webhook] Fehlende Authorization Header")
      return NextResponse.json(
        { success: false, error: "Unauthorized - Bearer Token erforderlich" },
        { status: 401 }
      )
    }

    const token = authHeader.replace("Bearer ", "")
    if (token !== WEBHOOK_TOKEN) {
      console.warn("[WP-Webhook] Ungültiger Token")
      return NextResponse.json(
        { success: false, error: "Unauthorized - Ungültiger Token" },
        { status: 401 }
      )
    }

    // Body parsen
    const data: WPWizardDaten = await request.json()
    
    console.log("[WP-Webhook] Eingehende Anfrage:", {
      wpId: data.id,
      titel: data.titel,
      waldbesitzer: data.waldbesitzer,
      email: data.email,
      wizardTyp: data.wizard_typ
    })

    // Prüfen ob Auftrag bereits existiert (Duplikat-Schutz)
    if (data.id) {
      const existing = await prisma.auftrag.findUnique({
        where: { wpProjektId: String(data.id) }
      })
      
      if (existing) {
        console.log("[WP-Webhook] Auftrag existiert bereits:", existing.id)
        return NextResponse.json({
          success: true,
          auftragId: existing.id,
          message: "Auftrag existiert bereits"
        })
      }
    }

    // Wizard-Daten zusammenführen
    const wizardDaten = {
      ...(data.wizard_daten || {}),
      wizard_typ: data.wizard_typ,
      original_wp_id: data.id,
    }

    // Nächste Auftragsnummer generieren
    const currentYear = new Date().getFullYear()
    const lastAuftrag = await prisma.auftrag.findFirst({
      where: {
        nummer: { startsWith: `AU-${currentYear}-` }
      },
      orderBy: { nummer: "desc" }
    })

    let nextNumber = 1
    if (lastAuftrag?.nummer) {
      const match = lastAuftrag.nummer.match(/AU-\d{4}-(\d{4})/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }
    const nummer = `AU-${currentYear}-${String(nextNumber).padStart(4, "0")}`

    // Auftrag erstellen
    const auftrag = await prisma.auftrag.create({
      data: {
        titel: data.titel || `Anfrage von ${data.waldbesitzer || "Unbekannt"}`,
        typ: data.wizard_typ || "anfrage",
        status: "anfrage",
        nummer,
        waldbesitzer: data.waldbesitzer || null,
        waldbesitzerEmail: data.email || null,
        waldbesitzerTelefon: data.telefon || null,
        flaeche_ha: data.flaeche 
          ? parseFloat(String(data.flaeche).replace(",", ".")) 
          : null,
        standort: data.standort || null,
        bundesland: data.bundesland || null,
        baumarten: data.wizard_daten?.baumarten || null,
        beschreibung: data.wizard_daten?.beschreibung || data.kommentar || null,
        lat: data.wizard_daten?.lat || null,
        lng: data.wizard_daten?.lng || null,
        wpProjektId: data.id ? String(data.id) : null,
        wpErstelltAm: data.angelegt ? new Date(data.angelegt * 1000) : new Date(),
        wpSyncedAt: new Date(),
        syncStatus: "synced",
        wizardDaten: wizardDaten,
        neuFlag: true,
      }
    })

    console.log("[WP-Webhook] Auftrag erstellt:", auftrag.id, auftrag.nummer)

    // Activity-Log
    await prisma.activityLog.create({
      data: {
        action: "auftrag_erstellt_via_webhook",
        entityType: "Auftrag",
        entityId: auftrag.id,
        entityName: auftrag.titel,
        metadata: JSON.stringify({
          wpProjektId: data.id,
          wizardTyp: data.wizard_typ,
          source: "wp-webhook"
        })
      }
    })

    // SyncLog
    await prisma.syncLog.create({
      data: {
        entityType: "Auftrag",
        entityId: auftrag.id,
        direction: "WP_TO_FM",
        status: "OK"
      }
    })

    return NextResponse.json({
      success: true,
      auftragId: auftrag.id,
      nummer: auftrag.nummer,
      message: "Auftrag erfolgreich erstellt"
    })

  } catch (error) {
    console.error("[WP-Webhook] Fehler:", error)
    
    // Bei Fehler trotzdem 200 zurückgeben (fire-and-forget)
    // Cron kann später nachsynchronisieren
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
      message: "Fehler bei Auftragserstellung - wird bei nächstem Sync nachgeholt"
    }, { status: 200 })
  }
}

// GET: Webhook-Status prüfen
export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/anfragen/wp-webhook",
    method: "POST",
    auth: "Bearer Token",
    timestamp: new Date().toISOString()
  })
}
