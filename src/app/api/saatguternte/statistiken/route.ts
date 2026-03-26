// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const saisonParam = sp.get("saison")
    const saison = saisonParam ? parseInt(saisonParam) : undefined

    const ernteWhere: any = {}
    if (saison) ernteWhere.saison = saison

    // A) Saison-Übersicht
    const [gesamtErnte, erntenCount, flaechenIds] = await Promise.all([
      prisma.ernte.aggregate({
        where: ernteWhere,
        _sum: { mengeKgGesamt: true },
        _count: { id: true },
      }),
      prisma.ernte.count({ where: ernteWhere }),
      prisma.ernte.findMany({
        where: ernteWhere,
        select: { profilId: true },
        distinct: ["profilId"],
      }),
    ])

    // Aktive Sammler (distinct Namen aus ErntePositionen)
    const sammlerRaw = await prisma.erntePosition.findMany({
      where: { ernte: ernteWhere },
      select: { sammlerName: true },
      distinct: ["sammlerName"],
    })

    // B) Sammler-Ranking
    const sammlerGruppen = await prisma.erntePosition.groupBy({
      by: ["sammlerName"],
      where: { ernte: ernteWhere },
      _sum: { mengeKg: true, stunden: true },
      _count: { id: true },
      orderBy: { _sum: { mengeKg: "desc" } },
    })

    const sammlerMitAvg = sammlerGruppen.map((s) => ({
      sammlerName: s.sammlerName,
      gesamtKg: s._sum.mengeKg ?? 0,
      einsaetze: s._count.id,
      avgKgEinsatz:
        s._count.id > 0 ? Math.round(((s._sum.mengeKg ?? 0) / s._count.id) * 10) / 10 : 0,
      avgKgTag:
        s._sum.stunden && s._sum.stunden > 0
          ? Math.round((((s._sum.mengeKg ?? 0) / s._sum.stunden) * 8) * 10) / 10
          : null,
    }))

    const top3 = sammlerMitAvg.slice(0, 3)
    const flop3 = sammlerMitAvg.length > 3 ? sammlerMitAvg.slice(-3).reverse() : []

    // C) Ertrag pro Baumart
    const baumartGruppen = await prisma.ernte.groupBy({
      by: ["baumart"],
      where: ernteWhere,
      _sum: { mengeKgGesamt: true },
      _count: { id: true },
      orderBy: { _sum: { mengeKgGesamt: "desc" } },
    })

    const gesamtKg = baumartGruppen.reduce((acc, b) => acc + (b._sum.mengeKgGesamt ?? 0), 0)

    const baumartStats = baumartGruppen.map((b) => ({
      baumart: b.baumart,
      gesamtKg: b._sum.mengeKgGesamt ?? 0,
      anzahlErnten: b._count.id,
      avgKgErnte:
        b._count.id > 0 ? Math.round(((b._sum.mengeKgGesamt ?? 0) / b._count.id) * 10) / 10 : 0,
      anteilProzent:
        gesamtKg > 0 ? Math.round(((b._sum.mengeKgGesamt ?? 0) / gesamtKg) * 1000) / 10 : 0,
    }))

    // D) Ertrag pro Bundesland
    // Wir holen Ernten mit Flächen-Info
    const erntenMitFlaeche = await prisma.ernte.findMany({
      where: ernteWhere,
      select: {
        mengeKgGesamt: true,
        profil: {
          select: {
            id: true,
            flaeche: { select: { bundesland: true } },
          },
        },
      },
    })

    const bundeslandMap = new Map<string, { kg: number; profilIds: Set<string> }>()
    for (const e of erntenMitFlaeche) {
      const bl = e.profil?.flaeche?.bundesland ?? "Unbekannt"
      if (!bundeslandMap.has(bl)) bundeslandMap.set(bl, { kg: 0, profilIds: new Set() })
      const entry = bundeslandMap.get(bl)!
      entry.kg += e.mengeKgGesamt ?? 0
      entry.profilIds.add(e.profil?.id ?? "")
    }

    const bundeslandStats = Array.from(bundeslandMap.entries())
      .map(([bl, data]) => ({
        bundesland: bl,
        gesamtKg: Math.round(data.kg * 10) / 10,
        anzahlFlaechen: data.profilIds.size,
        avgKgFlaeche:
          data.profilIds.size > 0
            ? Math.round((data.kg / data.profilIds.size) * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.gesamtKg - a.gesamtKg)

    // E) Durchschnitts-Statistiken
    const avgKgSammler =
      sammlerGruppen.length > 0
        ? Math.round((gesamtKg / sammlerGruppen.length) * 10) / 10
        : 0

    const avgKgFlaeche =
      flaechenIds.length > 0 ? Math.round((gesamtKg / flaechenIds.length) * 10) / 10 : 0

    const sammlerMitTag = sammlerMitAvg.filter((s) => s.avgKgTag !== null)
    const avgKgTag =
      sammlerMitTag.length > 0
        ? Math.round(
            (sammlerMitTag.reduce((a, s) => a + (s.avgKgTag ?? 0), 0) / sammlerMitTag.length) * 10
          ) / 10
        : null

    // Verfügbare Saisons
    const saisonList = await prisma.ernte.findMany({
      select: { saison: true },
      distinct: ["saison"],
      orderBy: { saison: "desc" },
    })

    return NextResponse.json({
      saison: saison ?? null,
      saisons: saisonList.map((s) => s.saison),
      uebersicht: {
        gesamtKg: Math.round((gesamtErnte._sum.mengeKgGesamt ?? 0) * 10) / 10,
        anzahlErnten: erntenCount,
        anzahlFlaechen: flaechenIds.length,
        anzahlSammler: sammlerRaw.length,
      },
      sammlerRanking: { top3, flop3, alle: sammlerMitAvg },
      baumartStats,
      bundeslandStats,
      avgStats: {
        avgKgSammler,
        avgKgTag,
        avgKgFlaeche,
      },
    })
  } catch (err) {
    console.error("GET /api/saatguternte/statistiken", err)
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 })
  }
}
