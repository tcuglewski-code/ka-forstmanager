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

    const auftraege = await prisma.auftrag.findMany({
      where: {
        deletedAt: null,
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      select: {
        id: true,
        status: true,
        typ: true,
        bundesland: true,
        standort: true,
        startDatum: true,
        endDatum: true,
        createdAt: true,
      },
    })

    // Volumen pro Monat
    const months = lastMonths(range === "3m" ? 3 : range === "6m" ? 6 : 12)
    const monatlich = new Map<string, number>()
    months.forEach(m => monatlich.set(m, 0))
    for (const a of auftraege) {
      const k = monthKey(a.createdAt)
      if (monatlich.has(k)) monatlich.set(k, (monatlich.get(k) || 0) + 1)
    }

    // Status-Verteilung
    const statusMap = new Map<string, number>()
    for (const a of auftraege) {
      statusMap.set(a.status, (statusMap.get(a.status) || 0) + 1)
    }

    // Typen-Verteilung
    const typenMap = new Map<string, number>()
    for (const a of auftraege) {
      if (!a.typ) continue
      typenMap.set(a.typ, (typenMap.get(a.typ) || 0) + 1)
    }

    // Bundesland-Verteilung
    const blMap = new Map<string, number>()
    for (const a of auftraege) {
      const bl = a.bundesland || "Unbekannt"
      blMap.set(bl, (blMap.get(bl) || 0) + 1)
    }

    // Ø Auftragsdauer (Tage) für abgeschlossene
    const dauer: number[] = []
    for (const a of auftraege) {
      if (a.startDatum && a.endDatum && a.endDatum > a.startDatum) {
        const tage = (a.endDatum.getTime() - a.startDatum.getTime()) / (1000 * 60 * 60 * 24)
        dauer.push(tage)
      }
    }
    const avgDauerTage = dauer.length > 0
      ? Math.round(dauer.reduce((a, b) => a + b, 0) / dauer.length)
      : null

    // Top Standorte
    const standortMap = new Map<string, number>()
    for (const a of auftraege) {
      if (!a.standort) continue
      standortMap.set(a.standort, (standortMap.get(a.standort) || 0) + 1)
    }
    const topStandorte = Array.from(standortMap.entries())
      .map(([standort, anzahl]) => ({ standort, anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl)
      .slice(0, 5)

    return NextResponse.json({
      range,
      gesamt: auftraege.length,
      avgDauerTage,
      monatlich: Array.from(monatlich.entries()).map(([monat, anzahl]) => ({ monat, anzahl })),
      statusVerteilung: Array.from(statusMap.entries())
        .map(([status, anzahl]) => ({ status, anzahl }))
        .sort((a, b) => b.anzahl - a.anzahl),
      typenVerteilung: Array.from(typenMap.entries())
        .map(([typ, anzahl]) => ({ typ, anzahl }))
        .sort((a, b) => b.anzahl - a.anzahl),
      bundeslandVerteilung: Array.from(blMap.entries())
        .map(([bundesland, anzahl]) => ({ bundesland, anzahl }))
        .sort((a, b) => b.anzahl - a.anzahl),
      topStandorte,
    })
  } catch (e) {
    console.error("[analytics/auftraege]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
