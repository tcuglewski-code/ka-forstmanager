import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  fetchHistoricalWeather,
  fetchCurrentWeather,
  aggregiereWetterdaten,
} from "@/lib/open-meteo"
import { auth } from "@/lib/auth"

// POST /api/saatguternte/wetter
// Body: { flaecheId: string, year?: number }
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { flaecheId, year } = body as { flaecheId: string; year?: number }

    if (!flaecheId) {
      return NextResponse.json({ error: "flaecheId fehlt" }, { status: 400 })
    }

    // Fläche laden
    const flaeche = await prisma.registerFlaeche.findUnique({
      where: { id: flaecheId },
      select: { id: true, latDez: true, lonDez: true },
    })

    if (!flaeche) {
      return NextResponse.json({ error: "Fläche nicht gefunden" }, { status: 404 })
    }

    if (flaeche.latDez == null || flaeche.lonDez == null) {
      return NextResponse.json({ error: "Keine Koordinaten" }, { status: 422 })
    }

    const targetYear = year ?? new Date().getFullYear() - 1

    // Open-Meteo Archive API aufrufen
    const historisch = await fetchHistoricalWeather(flaeche.latDez, flaeche.lonDez, targetYear)

    // Aggregieren
    const agg = aggregiereWetterdaten(historisch)

    // WetterSnapshot upsert (by flaecheId + jahr)
    const snapshot = await prisma.wetterSnapshot.upsert({
      where: {
        flaecheId_jahr: {
          flaecheId,
          jahr: targetYear,
        },
      },
      create: {
        flaecheId,
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
        datum: new Date(targetYear, 0, 1),
        tempMinAvgC: agg.tempMinAvg,
        tempMaxAvgC: agg.tempMaxAvg,
        niederschlagMm: agg.niederschlagGesamt,
        frosttage: agg.frosttage,
        hitzetage: agg.hitzetage,
        regentage: agg.regentage,
        monatlichDaten: agg.monate as unknown as import("@prisma/client").Prisma.JsonArray,
        datenQuelle: "open-meteo",
      },
    })

    return NextResponse.json({
      success: true,
      snapshot,
      aggregat: agg,
      jahr: targetYear,
    })
  } catch (err) {
    console.error("Wetter POST Fehler:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interner Fehler" },
      { status: 500 }
    )
  }
}

// GET /api/saatguternte/wetter?flaecheId=xxx
// Gibt gespeicherte WetterSnapshots zurück + lädt aktuelle 7-Tage-Vorschau frisch
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const flaecheId = searchParams.get("flaecheId")

    if (!flaecheId) {
      return NextResponse.json({ error: "flaecheId fehlt" }, { status: 400 })
    }

    // Fläche laden (mit Koordinaten)
    const flaeche = await prisma.registerFlaeche.findUnique({
      where: { id: flaecheId },
      select: { latDez: true, lonDez: true },
    })

    if (!flaeche) {
      return NextResponse.json({ error: "Fläche nicht gefunden" }, { status: 404 })
    }

    // Gespeicherte Snapshots laden
    const snapshots = await prisma.wetterSnapshot.findMany({
      where: { flaecheId },
      orderBy: { datum: "desc" },
    })

    // 7-Tage-Vorschau frisch laden (falls Koordinaten vorhanden)
    let aktuell = null
    if (flaeche.latDez != null && flaeche.lonDez != null) {
      try {
        aktuell = await fetchCurrentWeather(flaeche.latDez, flaeche.lonDez)
      } catch (e) {
        console.warn("Aktuelle Wetterdaten konnten nicht geladen werden:", e)
      }
    }

    return NextResponse.json({ snapshots, aktuell })
  } catch (err) {
    console.error("Wetter GET Fehler:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Interner Fehler" },
      { status: 500 }
    )
  }
}
