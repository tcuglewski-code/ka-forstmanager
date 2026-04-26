import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"


// ─── GET: Einzelnes Angebot ────────────────────────────────────────────────────
export const GET = withErrorHandler(async (_req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const angebot = await prisma.angebot.findUnique({
    where: { id },
    include: {
      auftrag: { select: { id: true, titel: true, status: true, nummer: true } },
    },
  })

  if (!angebot) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })

  return NextResponse.json(angebot)
})

// ─── PATCH: Status ändern / Angebot zu Auftrag konvertieren ───────────────────
export const PATCH = withErrorHandler(async (req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // ─── Sonderfall: Angebot → Auftrag konvertieren ──────────────────────────
  if (body.aktion === "zu_auftrag") {
    const angebot = await prisma.angebot.findUnique({ where: { id } })
    if (!angebot) return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 })

    if (angebot.auftragId) {
      return NextResponse.json(
        { error: "Diesem Angebot ist bereits ein Auftrag zugeordnet" },
        { status: 400 }
      )
    }

    // Auftragnummer generieren (robust: nur gültige NNNN-Nummern)
    const year = new Date().getFullYear()
    const allAuftraege = await prisma.auftrag.findMany({
      where: { nummer: { startsWith: `AU-${year}-` } },
      select: { nummer: true },
    })
    let maxANum = 0
    for (const a of allAuftraege) {
      const match = a.nummer?.match(/^AU-\d{4}-(\d{4})$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxANum) maxANum = num
      }
    }
    const auftragNummer = `AU-${year}-${String(maxANum + 1).padStart(4, "0")}`

    const auftrag = await prisma.auftrag.create({
      data: {
        nummer: auftragNummer,
        titel: angebot.beschreibung ?? `Auftrag aus Angebot ${angebot.nummer}`,
        waldbesitzer: angebot.waldbesitzerName ?? null,
        waldbesitzerEmail: angebot.waldbesitzerEmail ?? null,
        flaeche_ha: angebot.flaeche_ha ?? null,
        status: "geplant",
        typ: "pflanzung",
      },
    })

    const aktualisiertes = await prisma.angebot.update({
      where: { id },
      data: { status: "angenommen", auftragId: auftrag.id },
    })

    return NextResponse.json({ auftrag, angebot: aktualisiertes })
  }

  // ─── Standard-Update: Status / Felder ändern ─────────────────────────────
  const updateData: Record<string, unknown> = {}

  if (body.status) updateData.status = body.status

  // ─── Sprint FP (A1): Wenn Angebot "angenommen" → Auftrag-Status updaten ────
  if (body.status === "angenommen") {
    const angebot = await prisma.angebot.findUnique({ where: { id } })
    if (angebot?.auftragId) {
      await prisma.auftrag.update({
        where: { id: angebot.auftragId },
        data: { status: "angenommen" },
      })
    }
  }
  if (body.waldbesitzerName !== undefined) updateData.waldbesitzerName = body.waldbesitzerName
  if (body.waldbesitzerEmail !== undefined) updateData.waldbesitzerEmail = body.waldbesitzerEmail
  if (body.flaeche_ha !== undefined) updateData.flaeche_ha = body.flaeche_ha ? parseFloat(body.flaeche_ha) : null
  if (body.baumanzahl !== undefined) updateData.baumanzahl = body.baumanzahl ? parseInt(body.baumanzahl) : null
  if (body.preisProBaum !== undefined) updateData.preisProBaum = body.preisProBaum ? parseFloat(body.preisProBaum) : null
  if (body.stundenSchaetzung !== undefined) updateData.stundenSchaetzung = body.stundenSchaetzung ? parseFloat(body.stundenSchaetzung) : null
  if (body.gesamtpreis !== undefined) updateData.gesamtpreis = body.gesamtpreis ? parseFloat(String(body.gesamtpreis)) : null
  if (body.beschreibung !== undefined) updateData.beschreibung = body.beschreibung
  if (body.gueltigBis !== undefined) updateData.gueltigBis = body.gueltigBis ? new Date(body.gueltigBis) : null
  if (body.notizen !== undefined) updateData.notizen = body.notizen

  const updated = await prisma.angebot.update({
    where: { id },
    data: updateData,
    include: {
      auftrag: { select: { id: true, titel: true, status: true } },
    },
  })

  return NextResponse.json(updated)
})

// ─── DELETE: Angebot löschen ──────────────────────────────────────────────────
export const DELETE = withErrorHandler(async (_req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  await prisma.angebot.delete({ where: { id } })

  return NextResponse.json({ ok: true })
})
