import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cron/sync-wetterdaten
 *
 * Vercel Cron — taeglich um 07:00 UTC
 * Holt aktuelle Wetterdaten (Tages-Forecast) fuer RegisterFlaechen mit GPS-Koordinaten.
 * Upserts in WetterSnapshot (flaecheId + datum).
 * Limitiert auf 50 Flaechen pro Durchlauf.
 */

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

interface OpenMeteoDaily {
  time: string[]
  temperature_2m_max: number[]
  precipitation_sum: number[]
}

interface OpenMeteoResponse {
  daily: OpenMeteoDaily
}

export async function GET(req: NextRequest) {
  // Auth check (same pattern as other crons)
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  let updated = 0
  let skipped = 0
  const errors: { flaecheId: string; error: string }[] = []

  try {
    // Fetch RegisterFlaeche entries with GPS coordinates, limit 50
    const flaechen = await prisma.registerFlaeche.findMany({
      where: {
        latDez: { not: null },
        lonDez: { not: null },
      },
      select: {
        id: true,
        latDez: true,
        lonDez: true,
      },
      take: 50,
    })

    if (flaechen.length === 0) {
      return NextResponse.json({
        message: "Keine Flaechen mit Koordinaten gefunden",
        updated: 0,
        skipped: 0,
        durationMs: Date.now() - startTime,
      })
    }

    for (const flaeche of flaechen) {
      try {
        const lat = flaeche.latDez!
        const lon = flaeche.lonDez!

        const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum&timezone=Europe/Berlin`
        const response = await fetch(url)

        if (!response.ok) {
          errors.push({
            flaecheId: flaeche.id,
            error: `Open-Meteo HTTP ${response.status}`,
          })
          skipped++
          continue
        }

        const data: OpenMeteoResponse = await response.json()

        if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
          errors.push({
            flaecheId: flaeche.id,
            error: "No daily data returned from Open-Meteo",
          })
          skipped++
          continue
        }

        // Process each day from the forecast
        for (let i = 0; i < data.daily.time.length; i++) {
          const dateStr = data.daily.time[i]
          const tempMax = data.daily.temperature_2m_max[i]
          const niederschlag = data.daily.precipitation_sum[i]
          const datum = new Date(dateStr)
          const jahr = datum.getFullYear()

          // Upsert into WetterSnapshot (unique on flaecheId + jahr)
          // Since the unique constraint is on [flaecheId, jahr], we update per year
          // For daily granularity, we update the snapshot with latest data
          await prisma.wetterSnapshot.upsert({
            where: {
              flaecheId_jahr: {
                flaecheId: flaeche.id,
                jahr,
              },
            },
            create: {
              flaecheId: flaeche.id,
              datum,
              jahr,
              tempMaxC: tempMax,
              niederschlagMm: niederschlag,
              datenQuelle: "open-meteo",
            },
            update: {
              datum,
              tempMaxC: tempMax,
              niederschlagMm: niederschlag,
              updatedAt: new Date(),
            },
          })
        }

        updated++
      } catch (e) {
        errors.push({
          flaecheId: flaeche.id,
          error: e instanceof Error ? e.message : "Unknown error",
        })
        skipped++
      }
    }

    return NextResponse.json({
      message: "Wetterdaten-Sync abgeschlossen",
      total: flaechen.length,
      updated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      durationMs: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[sync-wetterdaten] Fatal error:", error)
    return NextResponse.json(
      {
        error: "Sync fehlgeschlagen",
        message: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
