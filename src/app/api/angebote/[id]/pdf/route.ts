/**
 * A1 — GET /api/angebote/[id]/pdf (ANG-026)
 * Liefert das markenkonforme Angebots-PDF (Koch Aufforstung). Lädt Positionen,
 * Varianten und Firmen-Stammdaten aus SystemConfig.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"
import { generiereAngebotPdf, type AngebotPdfDaten } from "@/lib/angebote/pdf/angebot-pdf"

function fmtDatum(d: Date | null | undefined): string {
  if (!d) return ""
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const angebot = await prisma.angebot.findUnique({
      where: { id },
      include: {
        positionen: { orderBy: { reihenfolge: "asc" } },
        varianten: { orderBy: { gesamtNetto: "asc" } },
      },
    })
    if (!angebot) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: ["firma_name", "firma_adresse", "firma_email"] } },
    })
    const cfg: Record<string, string> = {}
    for (const c of configs) cfg[c.key] = c.value

    const netto = angebot.gesamtNetto ?? 0
    const mwst = angebot.mwstBetrag ?? 0
    const brutto = angebot.gesamtpreis ?? netto + mwst

    const daten: AngebotPdfDaten = {
      nummer: angebot.nummer ?? "OHNE-NR",
      datum: fmtDatum(angebot.createdAt),
      gueltigBis: fmtDatum(angebot.gueltigBis),
      empfaenger: angebot.waldbesitzerName ?? "Waldbesitzer:in",
      beschreibung: angebot.beschreibung ?? undefined,
      positionen: angebot.positionen.map((p) => ({
        bezeichnung: p.bezeichnung,
        menge: p.menge,
        einheit: p.einheit,
        einzelpreis: p.einzelpreis,
        gesamtpreis: p.gesamtpreis,
        mwstSatz: p.mwstSatz,
      })),
      gesamtNetto: netto,
      mwstBetrag: mwst,
      gesamtBrutto: brutto,
      foerderHinweis: angebot.foerderHinweis,
      varianten: angebot.varianten.map((v) => ({
        stufe: v.stufe,
        titel: v.titel ?? v.stufe,
        gesamtNetto: v.gesamtNetto,
        gesamtBrutto: v.gesamtBrutto,
      })),
      firma: {
        name: cfg.firma_name ?? "Koch Aufforstung GmbH",
        adresse: cfg.firma_adresse,
        email: cfg.firma_email,
      },
    }

    const bytes = await generiereAngebotPdf(daten)
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Angebot-${daten.nummer}.pdf"`,
      },
    })
  }
)
