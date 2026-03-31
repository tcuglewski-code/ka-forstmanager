// KK-1: Content-Workflow API
// Verwaltet Kunden-Content für Blog/Bewertungen

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generiereAuftragsContent } from "@/lib/ki/content-generator"
import { KI_ENABLED } from "@/lib/ki/dokument-auswertung"

// GET — Content-Status für einen Auftrag abrufen
export async function GET(req: NextRequest) {
  try {
    await auth()
    
    const { searchParams } = new URL(req.url)
    const auftragId = searchParams.get("auftragId")

    if (!auftragId) {
      return NextResponse.json({ error: "auftragId erforderlich" }, { status: 400 })
    }

    const content = await prisma.kundenContent.findUnique({
      where: { auftragId },
    })

    return NextResponse.json({
      exists: !!content,
      content,
      kiEnabled: KI_ENABLED,
    })
  } catch (error) {
    console.error("[Content GET] Fehler:", error)
    return NextResponse.json({ error: "Abruf fehlgeschlagen" }, { status: 500 })
  }
}

// POST — Neuen Content-Workflow starten
export async function POST(req: NextRequest) {
  try {
    await auth()
    
    const body = await req.json()
    const { auftragId, action } = body

    if (!auftragId) {
      return NextResponse.json({ error: "auftragId erforderlich" }, { status: 400 })
    }

    // Auftrag laden
    const auftrag = await prisma.auftrag.findUnique({
      where: { id: auftragId },
      include: {
        protokolle: {
          select: { gepflanzt: true, witterung: true, datum: true },
        },
      },
    })

    if (!auftrag) {
      return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 })
    }

    // Action-basierte Logik
    switch (action) {
      case "start_einwilligung": {
        // Neuen Content-Eintrag erstellen oder zurückgeben
        const existing = await prisma.kundenContent.findUnique({
          where: { auftragId },
        })

        if (existing) {
          return NextResponse.json(existing)
        }

        const content = await prisma.kundenContent.create({
          data: {
            auftragId,
            einwilligungStatus: "AUSSTEHEND",
          },
        })

        return NextResponse.json(content, { status: 201 })
      }

      case "einwilligung_erteilen": {
        const content = await prisma.kundenContent.upsert({
          where: { auftragId },
          update: {
            einwilligungStatus: "ERTEILT",
            einwilligungDatum: new Date(),
          },
          create: {
            auftragId,
            einwilligungStatus: "ERTEILT",
            einwilligungDatum: new Date(),
          },
        })

        return NextResponse.json(content)
      }

      case "einwilligung_ablehnen": {
        const content = await prisma.kundenContent.upsert({
          where: { auftragId },
          update: {
            einwilligungStatus: "ABGELEHNT",
            einwilligungDatum: new Date(),
          },
          create: {
            auftragId,
            einwilligungStatus: "ABGELEHNT",
            einwilligungDatum: new Date(),
          },
        })

        return NextResponse.json(content)
      }

      case "generiere_content": {
        // KI aktiviert?
        if (!KI_ENABLED) {
          return NextResponse.json(
            { error: "KI-Features deaktiviert" },
            { status: 503 }
          )
        }

        // Einwilligung prüfen
        const existing = await prisma.kundenContent.findUnique({
          where: { auftragId },
        })

        if (!existing || existing.einwilligungStatus !== "ERTEILT") {
          return NextResponse.json(
            { error: "Einwilligung erforderlich" },
            { status: 403 }
          )
        }

        // Content generieren
        const generatedContent = await generiereAuftragsContent({
          auftragId: auftrag.id,
          typ: auftrag.typ,
          standort: auftrag.standort,
          bundesland: auftrag.bundesland,
          flaeche_ha: auftrag.flaeche_ha,
          baumarten: auftrag.baumarten,
          beschreibung: auftrag.beschreibung,
          wizardDaten: auftrag.wizardDaten as Record<string, unknown> | null,
          protokolle: auftrag.protokolle,
        })

        // Speichern
        const content = await prisma.kundenContent.update({
          where: { auftragId },
          data: {
            contentVorschlag: generatedContent,
          },
        })

        return NextResponse.json(content)
      }

      case "tomek_freigabe": {
        const content = await prisma.kundenContent.update({
          where: { auftragId },
          data: {
            tomekFreigabe: true,
            tomekFreigabeDatum: new Date(),
            contentFinal: body.contentFinal || undefined,
          },
        })

        return NextResponse.json(content)
      }

      case "kunde_freigabe": {
        const content = await prisma.kundenContent.update({
          where: { auftragId },
          data: {
            kundeFreigabe: true,
            kundeFreigabeDatum: new Date(),
          },
        })

        return NextResponse.json(content)
      }

      case "veroeffentlichen": {
        // Content laden
        const content = await prisma.kundenContent.findUnique({
          where: { auftragId },
        })

        if (!content?.tomekFreigabe) {
          return NextResponse.json(
            { error: "Tomek-Freigabe fehlt" },
            { status: 403 }
          )
        }

        // WP-Post erstellen (Draft)
        const wpUser = process.env.WP_USER || "openclaw"
        const wpPass = process.env.WP_PASSWORD || ""
        const wpAuth = Buffer.from(`${wpUser}:${wpPass}`).toString("base64")

        const titel = `Projekt: ${auftrag.typ} in ${auftrag.standort || auftrag.bundesland || "Deutschland"}`

        const wpRes = await fetch(
          "https://peru-otter-113714.hostingersite.com/wp-json/wp/v2/posts",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${wpAuth}`,
            },
            body: JSON.stringify({
              title: titel,
              content: content.contentFinal || content.contentVorschlag,
              status: "draft", // Als Entwurf erstellen
              categories: [1], // Standard-Kategorie
            }),
          }
        )

        if (!wpRes.ok) {
          const err = await wpRes.text()
          console.error("[Content WP] Fehler:", err)
          return NextResponse.json(
            { error: "WP-Veröffentlichung fehlgeschlagen" },
            { status: 500 }
          )
        }

        const wpPost = await wpRes.json()

        // Status aktualisieren
        const updated = await prisma.kundenContent.update({
          where: { auftragId },
          data: {
            veroeffentlicht: true,
            wpPostId: String(wpPost.id),
            wpPostUrl: wpPost.link,
            veroeffentlichtAm: new Date(),
          },
        })

        return NextResponse.json({
          ...updated,
          wpPost: {
            id: wpPost.id,
            link: wpPost.link,
            status: wpPost.status,
          },
        })
      }

      default:
        return NextResponse.json({ error: "Unbekannte Action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Content POST] Fehler:", error)
    return NextResponse.json(
      { error: "Aktion fehlgeschlagen", details: error instanceof Error ? error.message : "Unbekannt" },
      { status: 500 }
    )
  }
}
