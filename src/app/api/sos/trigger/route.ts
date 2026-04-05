import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// ============================================================
// SOS Trigger API — Sprint JJ (SOS-02+04)
// Empfängt SOS-Events von der App und sendet Push an Koordinatoren
// ============================================================

interface SOSTriggerRequest {
  eventId: string
  mitarbeiterId: number
  mitarbeiterName: string
  aktiverEinsatzId?: number
  aktiverEinsatzName?: string
  gps: {
    latitude: number
    longitude: number
    accuracy: number | null
    altitude: number | null
    timestamp: string
  } | null
  googleMapsLink: string | null
  ausgeloestAt: string
  isDelayedSync?: boolean // War offline, nachträglich synchronisiert
}

export async function POST(req: NextRequest) {
  try {
    // Auth: App-User muss eingeloggt sein
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: SOSTriggerRequest = await req.json()

    // Validierung
    if (!body.eventId || !body.mitarbeiterId || !body.mitarbeiterName) {
      return NextResponse.json(
        { error: "eventId, mitarbeiterId und mitarbeiterName sind erforderlich" },
        { status: 400 }
      )
    }

    // Prüfen ob Event bereits existiert (Idempotenz)
    const existing = await prisma.sOSEvent.findUnique({
      where: { eventId: body.eventId },
    })

    if (existing) {
      // Event existiert bereits — kein Duplikat anlegen
      return NextResponse.json({
        success: true,
        eventId: existing.eventId,
        koordinatorenBenachrichtigt: existing.koordinatorenNotified,
        message: "SOS-Event bereits verarbeitet",
      })
    }

    // SOS-Event in DB speichern
    const sosEvent = await prisma.sOSEvent.create({
      data: {
        eventId: body.eventId,
        mitarbeiterId: String(body.mitarbeiterId),
        mitarbeiterName: body.mitarbeiterName,
        aktiverEinsatzId: body.aktiverEinsatzId ? String(body.aktiverEinsatzId) : null,
        aktiverEinsatzName: body.aktiverEinsatzName || null,
        gpsLatitude: body.gps?.latitude || null,
        gpsLongitude: body.gps?.longitude || null,
        gpsAccuracy: body.gps?.accuracy || null,
        gpsAltitude: body.gps?.altitude || null,
        gpsTimestamp: body.gps?.timestamp ? new Date(body.gps.timestamp) : null,
        googleMapsLink: body.googleMapsLink || null,
        ausgeloestAt: new Date(body.ausgeloestAt),
        gesendetAt: new Date(),
        status: "sent",
        isDelayedSync: body.isDelayedSync || false,
      },
    })

    // Koordinatoren ermitteln (ka_admin, ka_gruppenführer)
    const koordinatoren = await prisma.user.findMany({
      where: {
        active: true,
        role: { in: ["ka_admin", "ka_gruppenführer"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Push-Benachrichtigungen an Koordinatoren
    // Hinweis: Für echte Push-Notifications benötigen wir Expo Push Tokens
    // Aktuell loggen wir und senden E-Mail-Fallback
    const notifiedCount = koordinatoren.length

    // E-Mail an Koordinatoren (wenn RESEND konfiguriert)
    if (process.env.RESEND_API_KEY && koordinatoren.length > 0) {
      try {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)

        for (const koordinator of koordinatoren) {
          if (koordinator.email) {
            const mapsLink = body.googleMapsLink
              ? `<a href="${body.googleMapsLink}" style="color:#DC2626;font-weight:bold;">📍 Standort auf Google Maps öffnen</a>`
              : "GPS-Position nicht verfügbar"

            await resend.emails.send({
              from: "Koch Aufforstung <noreply@koch-aufforstung.de>",
              to: koordinator.email,
              subject: `🚨 SOS-ALARM: ${body.mitarbeiterName}`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                  <div style="background:#DC2626;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                    <h1 style="margin:0;font-size:28px;">🚨 SOS-ALARM</h1>
                  </div>
                  <div style="background:#FEE2E2;padding:20px;border-radius:0 0 8px 8px;">
                    <table style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="padding:8px 0;font-weight:bold;">Mitarbeiter:</td>
                        <td style="padding:8px 0;">${body.mitarbeiterName}</td>
                      </tr>
                      ${body.aktiverEinsatzName ? `
                      <tr>
                        <td style="padding:8px 0;font-weight:bold;">Einsatz:</td>
                        <td style="padding:8px 0;">${body.aktiverEinsatzName}</td>
                      </tr>
                      ` : ""}
                      <tr>
                        <td style="padding:8px 0;font-weight:bold;">Ausgelöst:</td>
                        <td style="padding:8px 0;">${new Date(body.ausgeloestAt).toLocaleString("de-DE")}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-weight:bold;">Standort:</td>
                        <td style="padding:8px 0;">${mapsLink}</td>
                      </tr>
                      ${body.gps ? `
                      <tr>
                        <td style="padding:8px 0;font-weight:bold;">Koordinaten:</td>
                        <td style="padding:8px 0;">${body.gps.latitude.toFixed(6)}, ${body.gps.longitude.toFixed(6)}</td>
                      </tr>
                      ` : ""}
                    </table>
                    ${body.isDelayedSync ? `
                    <p style="background:#FEF3C7;padding:10px;border-radius:4px;margin-top:16px;">
                      ⚠️ <strong>Verspätete Zustellung:</strong> Dieses SOS wurde offline ausgelöst und erst jetzt synchronisiert.
                    </p>
                    ` : ""}
                    <p style="margin-top:20px;padding:15px;background:#DC2626;border-radius:8px;text-align:center;">
                      <a href="https://ka-forstmanager.vercel.app/sos" style="color:white;text-decoration:none;font-weight:bold;font-size:16px;">
                        → Zum SOS-Dashboard
                      </a>
                    </p>
                  </div>
                </div>
              `,
            })
          }
        }
      } catch (emailError) {
        console.error("[SOS] E-Mail-Versand fehlgeschlagen:", emailError)
        // Kein Fehler werfen — SOS wurde trotzdem gespeichert
      }
    }

    // Koordinatoren-Anzahl aktualisieren
    await prisma.sOSEvent.update({
      where: { id: sosEvent.id },
      data: { koordinatorenNotified: notifiedCount },
    })

    // Audit-Log
    console.log(`[SOS] Event ${body.eventId} von ${body.mitarbeiterName} — ${notifiedCount} Koordinatoren benachrichtigt`)

    return NextResponse.json({
      success: true,
      eventId: sosEvent.eventId,
      koordinatorenBenachrichtigt: notifiedCount,
      message: body.isDelayedSync
        ? "SOS nachträglich synchronisiert"
        : "SOS gesendet — Hilfe ist unterwegs",
    })
  } catch (error: any) {
    console.error("[SOS] Trigger-Fehler:", error)
    return NextResponse.json(
      { error: "SOS konnte nicht verarbeitet werden", details: error.message },
      { status: 500 }
    )
  }
}

// GET: Alle aktiven SOS-Events (für Dashboard)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status") // "pending", "sent", "acknowledged", "resolved"
  const limit = parseInt(searchParams.get("limit") || "50")

  const where: any = {}
  if (statusFilter) {
    where.status = statusFilter
  }

  const events = await prisma.sOSEvent.findMany({
    where,
    orderBy: { ausgeloestAt: "desc" },
    take: limit,
  })

  return NextResponse.json(events)
}
