// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sp = req.nextUrl.searchParams
    const jahrParam = sp.get("jahr")
    const jahrFilter = jahrParam ? parseInt(jahrParam) : undefined

    // ── 1. KPIs ──────────────────────────────────────────────────────────────

    const [kpiLeistungen, kpiEinsaetze] = await Promise.all([
      prisma.ernteLeistung.aggregate({
        where: jahrFilter
          ? { einsatz: { saison: { jahr: jahrFilter } } }
          : {},
        _sum: { gesammeltKg: true },
      }),
      prisma.ernteEinsatz.count({
        where: jahrFilter ? { saison: { jahr: jahrFilter } } : {},
      }),
    ])

    const kostenResult: { gesamt_kosten: string }[] =
      await prisma.$queryRawUnsafe(`
        SELECT COALESCE(SUM(stunden * stundenlohn), 0)::text AS gesamt_kosten
        FROM "SammlerArbeitszeit"
        WHERE stunden IS NOT NULL AND stundenlohn IS NOT NULL
      `)

    const stundenResult: { gesamt_stunden: string }[] =
      await prisma.$queryRawUnsafe(`
        SELECT COALESCE(SUM(stunden), 0)::text AS gesamt_stunden
        FROM "SammlerArbeitszeit"
        WHERE stunden IS NOT NULL
      `)

    const kpis = {
      gesamtKg:      Number(kpiLeistungen._sum.gesammeltKg ?? 0),
      einsatztage:   kpiEinsaetze,
      gesamtStunden: Number(stundenResult[0]?.gesamt_stunden ?? 0),
      gesamtKosten:  Number(kostenResult[0]?.gesamt_kosten ?? 0),
    }

    // ── 2. Sammler-Ranking ────────────────────────────────────────────────────

    const jahrWhere = jahrFilter ? `WHERE es.jahr = ${jahrFilter}` : ""

    const sammlerRaw: {
      name:           string
      gesamt_kg:      string
      gesamt_stunden: string | null
      gesamt_kosten:  string | null
      saisonId:       string
      jahr:           number
    }[] = await prisma.$queryRawUnsafe(`
      SELECT
        ep.name,
        SUM(el."gesammeltKg")::text                                      AS gesamt_kg,
        SUM(az.stunden)::text                                            AS gesamt_stunden,
        SUM(az.stunden * az.stundenlohn)::text                          AS gesamt_kosten,
        ee."saisonId",
        es.jahr
      FROM "ErnteLeistung" el
      JOIN "ErntePerson"   ep ON el."personId"  = ep.id
      JOIN "ErnteEinsatz"  ee ON el."einsatzId" = ee.id
      JOIN "ErnteSaison"   es ON ee."saisonId"  = es.id
      LEFT JOIN "SammlerArbeitszeit" az
             ON az."personId" = ep.id
            AND az.datum::date = ee.datum::date
      ${jahrWhere}
      GROUP BY ep.name, ee."saisonId", es.jahr
      ORDER BY SUM(el."gesammeltKg") DESC NULLS LAST
    `)

    // Aggregiere über alle Saisons
    const aggMap: Record<string, {
      name:          string
      gesamtKg:      number
      gesamtStunden: number
      gesamtKosten:  number
      jahre:         Set<number>
    }> = {}

    for (const r of sammlerRaw) {
      if (!aggMap[r.name]) {
        aggMap[r.name] = {
          name:          r.name,
          gesamtKg:      0,
          gesamtStunden: 0,
          gesamtKosten:  0,
          jahre:         new Set(),
        }
      }
      aggMap[r.name].gesamtKg      += Number(r.gesamt_kg ?? 0)
      aggMap[r.name].gesamtStunden += Number(r.gesamt_stunden ?? 0)
      aggMap[r.name].gesamtKosten  += Number(r.gesamt_kosten ?? 0)
      aggMap[r.name].jahre.add(r.jahr)
    }

    const aggregated = Object.values(aggMap).sort((a, b) => b.gesamtKg - a.gesamtKg)
    const gesamtKgAlle = aggregated.reduce((s, r) => s + r.gesamtKg, 0)

    const ranking = aggregated.map((r, idx) => ({
      rang:          idx + 1,
      name:          r.name,
      gesamtKg:      Math.round(r.gesamtKg * 10) / 10,
      gesamtStunden: r.gesamtStunden > 0 ? Math.round(r.gesamtStunden * 10) / 10 : null,
      gesamtKosten:  r.gesamtKosten > 0  ? Math.round(r.gesamtKosten * 100) / 100 : null,
      kgProStunde:   r.gesamtStunden > 0
                       ? Math.round((r.gesamtKg / r.gesamtStunden) * 10) / 10
                       : null,
      anteilProzent: gesamtKgAlle > 0
                       ? Math.round((r.gesamtKg / gesamtKgAlle) * 1000) / 10
                       : 0,
      jahre:         Array.from(r.jahre).sort(),
    }))

    // ── 3. Jahresvergleich ────────────────────────────────────────────────────

    const jahresRaw: {
      jahr:      number
      baumart:   string
      gesamt_kg: string
      einsaetze: number
    }[] = await prisma.$queryRawUnsafe(`
      SELECT
        es.jahr,
        ee.baumart,
        SUM(el."gesammeltKg")::text AS gesamt_kg,
        COUNT(DISTINCT ee.id)::int  AS einsaetze
      FROM "ErnteLeistung"  el
      JOIN "ErnteEinsatz"   ee ON el."einsatzId" = ee.id
      JOIN "ErnteSaison"    es ON ee."saisonId"  = es.id
      GROUP BY es.jahr, ee.baumart
      ORDER BY es.jahr, SUM(el."gesammeltKg") DESC
    `)

    const baumartVergleich: Record<string, {
      jahr2024: number; jahr2025: number; diff: number
    }> = {}

    for (const r of jahresRaw) {
      if (!baumartVergleich[r.baumart]) {
        baumartVergleich[r.baumart] = { jahr2024: 0, jahr2025: 0, diff: 0 }
      }
      const kg = Number(r.gesamt_kg ?? 0)
      if (r.jahr === 2024) baumartVergleich[r.baumart].jahr2024 = kg
      if (r.jahr === 2025) baumartVergleich[r.baumart].jahr2025 = kg
    }
    for (const b of Object.values(baumartVergleich)) {
      b.diff = Math.round((b.jahr2025 - b.jahr2024) * 10) / 10
    }

    const jahresSummen: Record<number, number> = {}
    for (const r of jahresRaw) {
      jahresSummen[r.jahr] = (jahresSummen[r.jahr] ?? 0) + Number(r.gesamt_kg ?? 0)
    }

    // ── 4. Flächen-Performance ────────────────────────────────────────────────

    const flaechenRaw: {
      register_nr: string | null
      forstamt:    string | null
      baumart:     string
      gesamt_kg:   string
      einsaetze:   number
      saisons:     number
    }[] = await prisma.$queryRawUnsafe(`
      SELECT
        ee."registerNr"               AS register_nr,
        ee.forstamt,
        ee.baumart,
        SUM(el."gesammeltKg")::text   AS gesamt_kg,
        COUNT(DISTINCT ee.id)::int    AS einsaetze,
        COUNT(DISTINCT es.id)::int    AS saisons
      FROM "ErnteLeistung"  el
      JOIN "ErnteEinsatz"   ee ON el."einsatzId" = ee.id
      JOIN "ErnteSaison"    es ON ee."saisonId"  = es.id
      GROUP BY ee."registerNr", ee.forstamt, ee.baumart
      ORDER BY SUM(el."gesammeltKg") DESC
      LIMIT 25
    `)

    // ── 5. Saisons ────────────────────────────────────────────────────────────

    const saisons = await prisma.ernteSaison.findMany({
      select: { jahr: true, gruppenFuehrer: true },
      orderBy: { jahr: "desc" },
    })

    return NextResponse.json({
      kpis,
      ranking,
      jahresvergleich: {
        baumartVergleich,
        jahresSummen,
      },
      flaechenPerformance: flaechenRaw.map((r) => ({
        registerNr: r.register_nr,
        forstamt:   r.forstamt,
        baumart:    r.baumart,
        gesamtKg:   Math.round(Number(r.gesamt_kg ?? 0) * 10) / 10,
        einsaetze:  r.einsaetze,
        saisons:    r.saisons,
      })),
      saisons,
      meta: {
        generiert:  new Date().toISOString(),
        jahrFilter: jahrFilter ?? null,
      },
    })
  } catch (error: any) {
    console.error("[statistik-v2] Fehler:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
