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

    // Baumschul-Bestellungen → Baumart-Nachfrage
    const bestellungen = await prisma.baumschulBestellung.findMany({
      where: {
        ...(startDate ? { createdAt: { gte: startDate } } : {}),
      },
      select: {
        baumart: true,
        menge: true,
        preis: true,
        createdAt: true,
        baumschule: { select: { name: true } },
      },
    })

    const baumartMap = new Map<string, { menge: number; wert: number; anzahl: number }>()
    for (const b of bestellungen) {
      const key = b.baumart || "Unbekannt"
      const e = baumartMap.get(key) || { menge: 0, wert: 0, anzahl: 0 }
      e.menge += b.menge ?? 0
      e.wert += (b.menge ?? 0) * (b.preis ?? 0)
      e.anzahl += 1
      baumartMap.set(key, e)
    }
    const baumarten = Array.from(baumartMap.entries())
      .map(([baumart, e]) => ({
        baumart,
        menge: e.menge,
        wert: Math.round(e.wert),
        anzahl: e.anzahl,
      }))
      .sort((a, b) => b.menge - a.menge)

    // Lieferanten-Performance (Top Baumschulen by Volumen)
    const lieferantenMap = new Map<string, { menge: number; wert: number; bestellungen: number }>()
    for (const b of bestellungen) {
      const key = b.baumschule?.name || "Direkt/Unbekannt"
      const e = lieferantenMap.get(key) || { menge: 0, wert: 0, bestellungen: 0 }
      e.menge += b.menge ?? 0
      e.wert += (b.menge ?? 0) * (b.preis ?? 0)
      e.bestellungen += 1
      lieferantenMap.set(key, e)
    }
    const lieferanten = Array.from(lieferantenMap.entries())
      .map(([lieferant, e]) => ({
        lieferant,
        menge: e.menge,
        wert: Math.round(e.wert),
        bestellungen: e.bestellungen,
      }))
      .sort((a, b) => b.menge - a.menge)
      .slice(0, 10)

    // Trend: Menge pro Monat
    const months = lastMonths(range === "3m" ? 3 : range === "6m" ? 6 : 12)
    const trendMap = new Map<string, number>()
    months.forEach(m => trendMap.set(m, 0))
    for (const b of bestellungen) {
      const k = monthKey(b.createdAt)
      if (trendMap.has(k)) trendMap.set(k, (trendMap.get(k) || 0) + (b.menge ?? 0))
    }
    const trend = Array.from(trendMap.entries()).map(([monat, menge]) => ({ monat, menge }))

    // Saatguternte — Volumen pro Baumart
    const ernten = await prisma.ernte
      .findMany({
        where: {
          ...(startDate ? { datum: { gte: startDate } } : {}),
        },
        select: { baumart: true, mengeKgGesamt: true },
      })
      .catch(() => [])

    const ernteMap = new Map<string, number>()
    for (const e of ernten) {
      const key = e.baumart || "Unbekannt"
      ernteMap.set(key, (ernteMap.get(key) || 0) + (e.mengeKgGesamt ?? 0))
    }
    const saatgutErnte = Array.from(ernteMap.entries())
      .map(([baumart, kg]) => ({ baumart, kg: Math.round(kg) }))
      .sort((a, b) => b.kg - a.kg)
      .slice(0, 10)

    return NextResponse.json({
      range,
      baumarten: baumarten.slice(0, 15),
      lieferanten,
      trend,
      saatgutErnte,
    })
  } catch (e) {
    console.error("[analytics/material]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
