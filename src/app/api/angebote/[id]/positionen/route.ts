/**
 * A1 — Positionen eines Angebots lesen/bearbeiten (ANG-023)
 * GET: alle Positionen. PATCH: einzelne Position manuell anpassen (markiert
 * manuellGeaendert=true, quelle="manuell") und Angebots-Summen neu berechnen.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"

export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const positionen = await prisma.angebotsPosition.findMany({
      where: { angebotId: id },
      orderBy: { reihenfolge: "asc" },
    })
    return NextResponse.json(positionen)
  }
)

export const PATCH = withErrorHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    if (!body.positionId) return NextResponse.json({ error: "positionId erforderlich" }, { status: 400 })

    const pos = await prisma.angebotsPosition.findUnique({ where: { id: body.positionId } })
    if (!pos || pos.angebotId !== id) {
      return NextResponse.json({ error: "Position nicht gefunden" }, { status: 404 })
    }

    const menge = body.menge != null ? Number(body.menge) : pos.menge
    const einzelpreis = body.einzelpreis != null ? Number(body.einzelpreis) : pos.einzelpreis
    if (!Number.isFinite(menge) || menge < 0 || !Number.isFinite(einzelpreis) || einzelpreis < 0) {
      return NextResponse.json({ error: "Ungültige menge/einzelpreis" }, { status: 400 })
    }
    const gesamtpreis = round2(menge * einzelpreis)

    await prisma.angebotsPosition.update({
      where: { id: pos.id },
      data: {
        menge,
        einzelpreis,
        gesamtpreis,
        bezeichnung: typeof body.bezeichnung === "string" ? body.bezeichnung : pos.bezeichnung,
        manuellGeaendert: true,
        quelle: "manuell",
      },
    })

    // Angebots-Summen neu berechnen
    const alle = await prisma.angebotsPosition.findMany({ where: { angebotId: id } })
    let netto = 0
    let mwst = 0
    for (const p of alle) {
      netto += p.gesamtpreis
      mwst += p.gesamtpreis * (p.mwstSatz / 100)
    }
    netto = round2(netto)
    mwst = round2(mwst)
    const angebot = await prisma.angebot.update({
      where: { id },
      data: { gesamtNetto: netto, mwstBetrag: mwst, gesamtpreis: round2(netto + mwst) },
      include: { positionen: { orderBy: { reihenfolge: "asc" } } },
    })

    return NextResponse.json(angebot)
  }
)

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
