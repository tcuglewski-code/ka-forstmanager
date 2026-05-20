import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseRange, rangeToStart, requireAnalyticsRole } from "@/lib/analytics-utils"

interface KundenEintrag {
  kunde: string
  auftragsAnzahl: number
  umsatz: number
  letzterAuftrag: Date | null
  ersterAuftrag: Date | null
  bindungsMonate: number
  clv: number
}

export async function GET(req: NextRequest) {
  const session = await requireAnalyticsRole()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const range = parseRange(searchParams)
    const startDate = rangeToStart(range)

    // Aufträge holen (mit Rechnungen)
    const auftraege = await prisma.auftrag.findMany({
      where: {
        deletedAt: null,
        waldbesitzer: { not: null },
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      select: {
        id: true,
        waldbesitzer: true,
        createdAt: true,
        rechnungen: {
          where: { deletedAt: null },
          select: { bruttoBetrag: true, betrag: true },
        },
      },
    })

    const kundenMap = new Map<string, KundenEintrag>()
    const now = new Date()

    for (const a of auftraege) {
      const key = a.waldbesitzer!.trim().toLowerCase()
      if (!key) continue
      const eintrag =
        kundenMap.get(key) ||
        ({
          kunde: a.waldbesitzer!.trim(),
          auftragsAnzahl: 0,
          umsatz: 0,
          letzterAuftrag: null,
          ersterAuftrag: null,
          bindungsMonate: 0,
          clv: 0,
        } satisfies KundenEintrag)

      eintrag.auftragsAnzahl += 1
      for (const r of a.rechnungen) {
        eintrag.umsatz += r.bruttoBetrag ?? r.betrag ?? 0
      }
      if (!eintrag.letzterAuftrag || a.createdAt > eintrag.letzterAuftrag) {
        eintrag.letzterAuftrag = a.createdAt
      }
      if (!eintrag.ersterAuftrag || a.createdAt < eintrag.ersterAuftrag) {
        eintrag.ersterAuftrag = a.createdAt
      }
      kundenMap.set(key, eintrag)
    }

    const kunden: KundenEintrag[] = []
    for (const k of kundenMap.values()) {
      if (k.ersterAuftrag) {
        const monate = Math.max(
          1,
          Math.round((now.getTime() - k.ersterAuftrag.getTime()) / (1000 * 60 * 60 * 24 * 30))
        )
        k.bindungsMonate = monate
      }
      // CLV = Umsatz × Frequenz (Aufträge pro Bindungsmonat) × Bindungsdauer
      const frequenz = k.auftragsAnzahl / Math.max(1, k.bindungsMonate)
      k.clv = Math.round(k.umsatz * frequenz * Math.max(1, k.bindungsMonate / 12))
      kunden.push(k)
    }

    kunden.sort((a, b) => b.umsatz - a.umsatz)

    const ruhendCutoff = new Date()
    ruhendCutoff.setDate(ruhendCutoff.getDate() - 180)
    const ruhendeKunden = kunden.filter(
      k => k.letzterAuftrag && k.letzterAuftrag < ruhendCutoff
    )

    return NextResponse.json({
      range,
      totalKunden: kunden.length,
      ruhendeKundenAnzahl: ruhendeKunden.length,
      kunden: kunden.slice(0, 50).map(k => ({
        kunde: k.kunde,
        auftragsAnzahl: k.auftragsAnzahl,
        umsatz: Math.round(k.umsatz),
        letzterAuftrag: k.letzterAuftrag?.toISOString() ?? null,
        bindungsMonate: k.bindungsMonate,
        clv: k.clv,
      })),
      ruhendeKunden: ruhendeKunden.slice(0, 20).map(k => ({
        kunde: k.kunde,
        letzterAuftrag: k.letzterAuftrag?.toISOString() ?? null,
        auftragsAnzahl: k.auftragsAnzahl,
        umsatz: Math.round(k.umsatz),
      })),
    })
  } catch (e) {
    console.error("[analytics/kunden]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
