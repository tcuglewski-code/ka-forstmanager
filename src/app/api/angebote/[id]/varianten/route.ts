/**
 * A1 — Gut/Besser/Best Varianten erzeugen (ANG-024)
 * GET: gespeicherte Varianten. POST: erzeugt/aktualisiert die drei Varianten
 * für ein KI-Angebot (deterministische Kalkulation + LLM-Verkaufstexte).
 * Kill-Switch greift nur für den LLM-Teil; Kalkulation bleibt verfügbar.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { safeParseJson, AnfrageSpezifikationSchema } from "@/lib/angebote/zod-schemas"
import { ladePreisbuchKontext } from "@/lib/angebote/kalkulation/preisbuch-query"
import { erzeugeVarianten } from "@/lib/angebote/varianten/varianten-generator"
import { generiereVariantenTexte } from "@/lib/angebote/varianten/text-generator"

export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const varianten = await prisma.angebotsVariante.findMany({
      where: { angebotId: id },
      orderBy: { gesamtNetto: "asc" },
    })
    return NextResponse.json(varianten)
  }
)

export const POST = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const angebot = await prisma.angebot.findUnique({ where: { id } })
    if (!angebot) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

    const spez = safeParseJson(AnfrageSpezifikationSchema, angebot.anfrageSpezifikationJson, null)
    if (!spez) {
      return NextResponse.json({ error: "Keine gültige Spezifikation am Angebot" }, { status: 400 })
    }

    const kontext = await ladePreisbuchKontext()
    const varianten = erzeugeVarianten(spez, kontext)
    const userId = (session.user as { id?: string } | undefined)?.id ?? null
    const { beschreibung, modell, kostenCent } = await generiereVariantenTexte(spez, varianten, userId)

    // Vorherige Varianten ersetzen
    await prisma.angebotsVariante.deleteMany({ where: { angebotId: id } })
    await prisma.angebotsVariante.createMany({
      data: varianten.map((v) => ({
        angebotId: id,
        stufe: v.stufe,
        titel: beschreibung[v.stufe].titel,
        verkaufstext: beschreibung[v.stufe].verkaufstext,
        begruendung: beschreibung[v.stufe].begruendung,
        gesamtNetto: v.details.gesamtNetto,
        gesamtBrutto: v.details.gesamtBrutto,
        positionenJson: v.details.positionen,
      })),
    })

    await prisma.angebotsAudit.create({
      data: {
        angebotId: id,
        schritt: "varianten",
        modell,
        kostenCent,
        detailsJson: { stufen: varianten.map((v) => ({ stufe: v.stufe, netto: v.details.gesamtNetto })) },
        erstelltVon: userId,
      },
    })

    const gespeichert = await prisma.angebotsVariante.findMany({
      where: { angebotId: id },
      orderBy: { gesamtNetto: "asc" },
    })
    return NextResponse.json(gespeichert, { status: 201 })
  }
)
