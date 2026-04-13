// KV-1 + KV-2: Content-Workflow API für Blog/Bewertungen
// Einwilligung → Content → Freigabe → WP-Veröffentlichung

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripHtml } from "@/lib/sanitize"
import { prisma } from "@/lib/prisma"
import { generiereAuftragsContent } from "@/lib/ki/content-generator"
import { wpSyncEngine } from "@/lib/sync/wp-sync"
import { emailService } from "@/lib/email"

// GET: KundenContent laden
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  const auftragId = request.nextUrl.searchParams.get("auftragId")
  
  if (!auftragId) {
    return NextResponse.json({ error: "auftragId fehlt" }, { status: 400 })
  }

  const content = await prisma.kundenContent.findUnique({
    where: { auftragId }
  })

  return NextResponse.json({ content })
}

// POST: Content-Workflow Aktionen
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { auftragId, aktion } = body

    if (!auftragId || !aktion) {
      return NextResponse.json({ error: "auftragId und aktion erforderlich" }, { status: 400 })
    }

    // Auftrag laden
    const auftrag = await prisma.auftrag.findUnique({
      where: { id: auftragId },
      include: {
        protokolle: {
          select: { gepflanztGesamt: true, datum: true, witterung: true }
        }
      }
    })

    if (!auftrag) {
      return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 })
    }

    // KundenContent erstellen falls nicht vorhanden
    let content = await prisma.kundenContent.findUnique({
      where: { auftragId }
    })

    if (!content) {
      content = await prisma.kundenContent.create({
        data: { auftragId }
      })
    }

    switch (aktion) {
      // Schritt 1: Einwilligung anfragen
      case "einwilligung_anfragen": {
        if (!auftrag.waldbesitzerEmail) {
          return NextResponse.json({ 
            error: "Keine E-Mail-Adresse des Waldbesitzers vorhanden" 
          }, { status: 400 })
        }

        // E-Mail senden
        await emailService.einwilligungAnfrage({
          empfaengerEmail: auftrag.waldbesitzerEmail,
          waldbesitzerName: auftrag.waldbesitzer || "Sehr geehrte Damen und Herren",
          auftragId,
          auftragTitel: auftrag.titel
        })

        await prisma.kundenContent.update({
          where: { auftragId },
          data: { einwilligungStatus: "ANGEFRAGT" }
        })

        return NextResponse.json({ 
          success: true, 
          message: "Einwilligungsanfrage versendet" 
        })
      }

      // Schritt 2: Content generieren (nach Einwilligung)
      case "content_generieren": {
        if (content.einwilligungStatus !== "ERTEILT") {
          return NextResponse.json({ 
            error: "Einwilligung noch nicht erteilt" 
          }, { status: 400 })
        }

        // KI-Content generieren
        const contentText = await generiereAuftragsContent({
          auftragId: auftrag.id,
          typ: auftrag.typ,
          standort: auftrag.standort,
          bundesland: auftrag.bundesland,
          flaeche_ha: auftrag.flaeche_ha,
          baumarten: auftrag.baumarten,
          beschreibung: auftrag.beschreibung,
          wizardDaten: auftrag.wizardDaten as Record<string, unknown> | null,
          protokolle: auftrag.protokolle.map(p => ({
            gepflanzt: p.gepflanztGesamt,
            datum: p.datum,
            witterung: p.witterung
          }))
        })

        await prisma.kundenContent.update({
          where: { auftragId },
          data: { contentVorschlag: contentText }
        })

        return NextResponse.json({ 
          success: true, 
          content: contentText 
        })
      }

      // Schritt 3: Tomek-Freigabe
      case "freigeben": {
        const contentFinal = body.contentFinal ? stripHtml(body.contentFinal) : null

        await prisma.kundenContent.update({
          where: { auftragId },
          data: {
            contentFinal: contentFinal || content.contentVorschlag,
            tomekFreigabe: true,
            tomekFreigabeDatum: new Date()
          }
        })

        return NextResponse.json({ 
          success: true, 
          message: "Content freigegeben" 
        })
      }

      // Schritt 4: In WordPress veröffentlichen
      case "veroeffentlichen": {
        const updatedContent = await prisma.kundenContent.findUnique({
          where: { auftragId }
        })

        if (!updatedContent?.tomekFreigabe) {
          return NextResponse.json({ 
            error: "Content muss erst freigegeben werden" 
          }, { status: 400 })
        }

        const contentToPublish = updatedContent.contentFinal || updatedContent.contentVorschlag
        if (!contentToPublish) {
          return NextResponse.json({ 
            error: "Kein Content zum Veröffentlichen" 
          }, { status: 400 })
        }

        // WP Draft erstellen
        const result = await wpSyncEngine.erstelleWPDraft({
          title: `Aufforstungsprojekt ${auftrag.standort || auftrag.nummer}`,
          content: contentToPublish,
          auftragStandort: auftrag.standort
        })

        if (!result.success) {
          return NextResponse.json({ 
            error: `WP-Veröffentlichung fehlgeschlagen: ${result.error}` 
          }, { status: 500 })
        }

        await prisma.kundenContent.update({
          where: { auftragId },
          data: {
            veroeffentlicht: true,
            wpPostId: result.postId ? String(result.postId) : null,
            wpPostUrl: result.postUrl,
            veroeffentlichtAm: new Date()
          }
        })

        return NextResponse.json({ 
          success: true,
          postId: result.postId,
          postUrl: result.postUrl,
          message: "Als Draft in WordPress erstellt" 
        })
      }

      // Einwilligung manuell setzen (z.B. telefonisch erteilt)
      case "einwilligung_setzen": {
        const { status } = body // ERTEILT oder ABGELEHNT
        
        await prisma.kundenContent.update({
          where: { auftragId },
          data: {
            einwilligungStatus: status,
            einwilligungDatum: status === "ERTEILT" ? new Date() : null
          }
        })

        return NextResponse.json({ 
          success: true, 
          message: `Einwilligung auf ${status} gesetzt` 
        })
      }

      default:
        return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 })
    }

  } catch (error) {
    console.error("[Content API] Fehler:", error)
    return NextResponse.json({ 
      error: "Interner Fehler",
      details: error instanceof Error ? error.message : "Unbekannt"
    }, { status: 500 })
  }
}
