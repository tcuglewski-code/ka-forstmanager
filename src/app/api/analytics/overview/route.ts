import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseRange, rangeToStart, requireAnalyticsRole, lastMonths, monthKey } from "@/lib/analytics-utils"

const OFFENE_STATUS = ["anfrage", "geplant", "aktiv", "in_bearbeitung"]

export async function GET(req: NextRequest) {
  const session = await requireAnalyticsRole()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const range = parseRange(searchParams)
    const startDate = rangeToStart(range)

    const rechnungWhere = {
      deletedAt: null,
      ...(startDate ? { rechnungsDatum: { gte: startDate } } : {}),
    }

    const [umsatzAgg, alleRechnungen, offeneAuftraegeCount, kundenAuftraege] = await Promise.all([
      prisma.rechnung.aggregate({
        where: rechnungWhere,
        _sum: { bruttoBetrag: true, nettoBetrag: true, betrag: true },
        _count: { _all: true },
        _avg: { bruttoBetrag: true },
      }),
      prisma.rechnung.findMany({
        where: rechnungWhere,
        select: { bruttoBetrag: true, betrag: true, rechnungsDatum: true },
      }),
      prisma.auftrag.count({
        where: { status: { in: OFFENE_STATUS }, deletedAt: null },
      }),
      prisma.auftrag.findMany({
        where: {
          deletedAt: null,
          ...(startDate ? { createdAt: { gte: startDate } } : {}),
        },
        select: { waldbesitzer: true, createdAt: true },
      }),
    ])

    // Umsatz-Trend pro Monat
    const trendMap = new Map<string, number>()
    const months = lastMonths(range === "3m" ? 3 : range === "6m" ? 6 : 12)
    months.forEach(m => trendMap.set(m, 0))
    for (const r of alleRechnungen) {
      const k = monthKey(r.rechnungsDatum)
      if (trendMap.has(k)) {
        trendMap.set(k, (trendMap.get(k) || 0) + (r.bruttoBetrag ?? r.betrag ?? 0))
      }
    }
    const umsatzTrend = Array.from(trendMap.entries()).map(([monat, umsatz]) => ({
      monat,
      umsatz: Math.round(umsatz),
    }))

    const aktiveKunden = new Set(
      kundenAuftraege.filter(a => a.waldbesitzer).map(a => a.waldbesitzer!.trim().toLowerCase())
    ).size

    const totalUmsatz =
      umsatzAgg._sum.bruttoBetrag ?? umsatzAgg._sum.betrag ?? 0

    return NextResponse.json({
      range,
      gesamtUmsatz: Math.round(totalUmsatz),
      gesamtUmsatzNetto: Math.round(umsatzAgg._sum.nettoBetrag ?? 0),
      rechnungenAnzahl: umsatzAgg._count._all,
      aktiveKunden,
      offeneAuftraege: offeneAuftraegeCount,
      avgAuftragswert: Math.round(umsatzAgg._avg.bruttoBetrag ?? 0),
      umsatzTrend,
    })
  } catch (e) {
    console.error("[analytics/overview]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
