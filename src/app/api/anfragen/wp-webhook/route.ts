// KS-2: Webhook-Empfänger für WordPress Wizard-Anfragen
// WIZ-01: Nimmt POST von WordPress entgegen, erstellt Auftrag, benachrichtigt Admin
// Erweitert: E-Mail-Benachrichtigung an Admin bei neuer Anfrage

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// Webhook-Token für Authentifizierung
const WEBHOOK_TOKEN = process.env.WP_WEBHOOK_TOKEN ?? ""
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@koch-aufforstung.de"

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

    // WIZ-01: Admin per E-Mail benachrichtigen
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `🌲 Neue Anfrage: ${auftrag.nummer} - ${auftrag.titel}`,
        html: adminNotificationHtml({
          nummer: auftrag.nummer,
          titel: auftrag.titel,
          waldbesitzer: auftrag.waldbesitzer || "Nicht angegeben",
          email: auftrag.waldbesitzerEmail || "Nicht angegeben",
          telefon: auftrag.waldbesitzerTelefon || "Nicht angegeben",
          flaeche: auftrag.flaeche_ha ? `${auftrag.flaeche_ha} ha` : "Nicht angegeben",
          standort: auftrag.standort || "Nicht angegeben",
          bundesland: auftrag.bundesland || "Nicht angegeben",
          wizardTyp: data.wizard_typ || "Allgemein",
          auftragId: auftrag.id,
        }),
      })
      console.log("[WP-Webhook] Admin-Benachrichtigung gesendet an:", ADMIN_EMAIL)
    } catch (emailError) {
      // Email-Fehler nicht fatal — Auftrag wurde trotzdem erstellt
      console.warn("[WP-Webhook] Admin-Benachrichtigung fehlgeschlagen:", emailError)
    }

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

// WIZ-01: Admin-Benachrichtigungs-Template
function adminNotificationHtml(daten: {
  nummer: string
  titel: string
  waldbesitzer: string
  email: string
  telefon: string
  flaeche: string
  standort: string
  bundesland: string
  wizardTyp: string
  auftragId: string
}): string {
  const fmUrl = process.env.NEXTAUTH_URL || "https://ka-forstmanager.vercel.app"
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: #2C3A1C; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 20px; }
        .content { background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; }
        .info-box { background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #2C3A1C; }
        .info-row { display: flex; margin: 8px 0; }
        .info-label { font-weight: bold; width: 140px; color: #666; }
        .info-value { flex: 1; }
        .badge { display: inline-block; background: #2C3A1C; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
        .cta { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2C3A1C; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .cta:hover { background: #3d5a2a; }
        .footer { text-align: center; padding: 16px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌲 Neue Anfrage eingegangen</h1>
        </div>
        
        <div class="content">
          <p>Eine neue Anfrage wurde über den Website-Wizard eingereicht:</p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Auftragsnummer:</span>
              <span class="info-value"><strong>${daten.nummer}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Titel:</span>
              <span class="info-value">${daten.titel}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Typ:</span>
              <span class="info-value"><span class="badge">${daten.wizardTyp}</span></span>
            </div>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #2C3A1C;">Kontaktdaten</h3>
            <div class="info-row">
              <span class="info-label">Waldbesitzer:</span>
              <span class="info-value">${daten.waldbesitzer}</span>
            </div>
            <div class="info-row">
              <span class="info-label">E-Mail:</span>
              <span class="info-value"><a href="mailto:${daten.email}">${daten.email}</a></span>
            </div>
            <div class="info-row">
              <span class="info-label">Telefon:</span>
              <span class="info-value">${daten.telefon}</span>
            </div>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #2C3A1C;">Projektdaten</h3>
            <div class="info-row">
              <span class="info-label">Fläche:</span>
              <span class="info-value">${daten.flaeche}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Standort:</span>
              <span class="info-value">${daten.standort}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bundesland:</span>
              <span class="info-value">${daten.bundesland}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${fmUrl}/auftraege/${daten.auftragId}" class="cta">
              → Im ForstManager öffnen
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Diese E-Mail wurde automatisch vom ForstManager gesendet.<br>
          Koch Aufforstung GmbH</p>
        </div>
      </div>
    </body>
    </html>
  `
}
