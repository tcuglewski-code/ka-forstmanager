import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchHistoricalWeather, aggregiereWetterdaten } from "@/lib/open-meteo"

// Hilfsfunktion: Warten
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GET /api/cron/wetter-update (Vercel Cron — jeden Montag um 03:00)
// Holt alle Flächen MIT Koordinaten, die keinen aktuellen WetterSnapshot haben
export async function GET() {
  const startTime = Date.now()
  const targetYear = new Date().getFullYear() - 1
  const einMonatZurueck = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  let updated = 0
  let skipped = 0
  const errors: { flaecheId: string; error: string }[] = []

  try {
    // Alle Flächen MIT Koordinaten, OHNE aktuellen WetterSnapshot (letzter Monat)
    const flaechen = await prisma.registerFlaeche.findMany({
      where: {
        latDez: { not: null },
        lonDez: { not: null },
        OR: [
          // Kein Snapshot für dieses Jahr vorhanden
          {
            wetterDaten: {
              none: {
                jahr: targetYear,
              },
            },
          },
          // Snapshot vorhanden, aber älter als 1 Monat
          {
            wetterDaten: {
              some: {
                jahr: targetYear,
                updatedAt: { lt: einMonatZurueck },
              },
            },
          },
        ],
      },
      select: { id: true, latDez: true, lonDez: true },
      take: 100,
    })

    console.log(`[Cron Wetter] Starte Update für ${flaechen.length} Flächen (Jahr ${targetYear})`)

    for (const flaeche of flaechen) {
      if (flaeche.latDez == null || flaeche.lonDez == null) {
        skipped++
        continue
      }

      try {
        const historisch = await fetchHistoricalWeather(
          flaeche.latDez,
          flaeche.lonDez,
          targetYear
        )
        const agg = aggregiereWetterdaten(historisch)

        await prisma.wetterSnapshot.upsert({
          where: {
            flaecheId_jahr: {
              flaecheId: flaeche.id,
              jahr: targetYear,
            },
          },
          create: {
            flaecheId: flaeche.id,
            datum: new Date(targetYear, 0, 1),
            jahr: targetYear,
            tempMinAvgC: agg.tempMinAvg,
            tempMaxAvgC: agg.tempMaxAvg,
            niederschlagMm: agg.niederschlagGesamt,
            frosttage: agg.frosttage,
            hitzetage: agg.hitzetage,
            regentage: agg.regentage,
            monatlichDaten: agg.monate as unknown as import("@prisma/client").Prisma.JsonArray,
            datenQuelle: "open-meteo",
          },
          update: {
            tempMinAvgC: agg.tempMinAvg,
            tempMaxAvgC: agg.tempMaxAvg,
            niederschlagMm: agg.niederschlagGesamt,
            frosttage: agg.frosttage,
            hitzetage: agg.hitzetage,
            regentage: agg.regentage,
            monatlichDaten: agg.monate as unknown as import("@prisma/client").Prisma.JsonArray,
          },
        })

        updated++
      } catch (err) {
        errors.push({
          flaecheId: flaeche.id,
          error: err instanceof Error ? err.message : "Unbekannter Fehler",
        })
        console.error(`[Cron Wetter] Fehler bei Fläche ${flaeche.id}:`, err)
      }

      // 200ms Delay zwischen API-Anfragen (Rate Limit schonen)
      await sleep(200)
    }

    const duration = Date.now() - startTime
    console.log(
      `[Cron Wetter] Fertig: updated=${updated}, skipped=${skipped}, errors=${errors.length} (${duration}ms)`
    )

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      errors,
      durationMs: duration,
      targetYear,
      gesamtFlaechen: flaechen.length,
    })
  } catch (err) {
    console.error("[Cron Wetter] Kritischer Fehler:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Interner Fehler",
        updated,
        skipped,
        errors,
      },
      { status: 500 }
    )
  }
}
