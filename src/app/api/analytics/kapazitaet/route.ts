import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseRange, rangeToStart, requireAnalyticsRole, lastMonths, monthKey } from "@/lib/analytics-utils"

export async function GET(req: NextRequest) {
  const session = await requireAnalyticsRole()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const range = parseRange(searchParams)
    const startDate = rangeToStart(range)

    const [gruppen, mitarbeiterAnzahl, unterkuenfte] = await Promise.all([
      prisma.gruppe.findMany({
        where: { status: "aktiv" },
        select: {
          id: true,
          name: true,
          mitglieder: { select: { id: true } },
          auftraege: {
            where: {
              deletedAt: null,
              ...(startDate ? { createdAt: { gte: startDate } } : {}),
            },
            select: { id: true, createdAt: true },
          },
        },
      }),
      prisma.mitarbeiter.count({ where: { status: "aktiv" } }).catch(() => 0),
      prisma.unterkunft.findMany({
        where: {
          ...(startDate ? { createdAt: { gte: startDate } } : {}),
        },
        select: { id: true, preisNacht: true, createdAt: true },
      }),
    ])

    // Gruppen-Auslastung
    const monthsCount = range === "3m" ? 3 : range === "6m" ? 6 : range === "12m" ? 12 : 24
    const gruppenAuslastung = gruppen
      .map(g => ({
        gruppe: g.name,
        mitglieder: g.mitglieder.length,
        auftraege: g.auftraege.length,
        auftraegePerMonat: Math.round((g.auftraege.length / monthsCount) * 10) / 10,
      }))
      .sort((a, b) => b.auftraege - a.auftraege)

    // Unterkunft-Buchungen Trend
    const months = lastMonths(range === "3m" ? 3 : range === "6m" ? 6 : 12)
    const trendMap = new Map<string, number>()
    months.forEach(m => trendMap.set(m, 0))
    for (const u of unterkuenfte) {
      const k = monthKey(u.createdAt)
      if (trendMap.has(k)) trendMap.set(k, (trendMap.get(k) || 0) + 1)
    }
    const unterkunftTrend = Array.from(trendMap.entries()).map(([monat, anzahl]) => ({ monat, anzahl }))

    const gesamtAuftraege = gruppen.reduce((acc, g) => acc + g.auftraege.length, 0)

    return NextResponse.json({
      range,
      gruppenAnzahl: gruppen.length,
      mitarbeiterAnzahl,
      ratioMitarbeiterPerAuftrag:
        gesamtAuftraege > 0 ? Math.round((mitarbeiterAnzahl / gesamtAuftraege) * 10) / 10 : null,
      gruppenAuslastung,
      unterkunftTrend,
      unterkunftBuchungen: unterkuenfte.length,
      unterkunftDurchschnittPreis: unterkuenfte.length
        ? Math.round(
            unterkuenfte.reduce((acc, u) => acc + (u.preisNacht ?? 0), 0) / unterkuenfte.length
          )
        : 0,
    })
  } catch (e) {
    console.error("[analytics/kapazitaet]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
