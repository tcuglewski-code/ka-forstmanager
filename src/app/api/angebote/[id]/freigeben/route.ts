/**
 * A1 — POST /api/angebote/[id]/freigeben (ANG-022)
 * Mensch-im-Loop: GF/Admin gibt einen KI-Entwurf frei. Erst danach darf
 * versendet werden. Setzt freigegebenVon/-Am und Status "freigegeben".
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"

export const POST = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const angebot = await prisma.angebot.findUnique({
      where: { id },
      include: { positionen: { select: { id: true } } },
    })
    if (!angebot) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    if (angebot.positionen.length === 0) {
      return NextResponse.json({ error: "Keine Positionen — Freigabe nicht möglich" }, { status: 400 })
    }
    if (angebot.status === "freigegeben" || angebot.versendetAm) {
      return NextResponse.json({ error: "Bereits freigegeben/versendet" }, { status: 400 })
    }

    const userId = (session.user as { id?: string } | undefined)?.id ?? null
    const updated = await prisma.angebot.update({
      where: { id },
      data: { status: "freigegeben", freigegebenVon: userId, freigegebenAm: new Date() },
    })
    return NextResponse.json(updated)
  }
)
