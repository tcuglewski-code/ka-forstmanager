import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GPS-Rohdaten Löschroutine (DSGVO Art. 17 / Retention Policy)
 * 
 * Löscht GPS-Track-Daten (JSON) aus Protokollen und Einsätzen älter als 30 Tage.
 * Die Protokolle selbst bleiben erhalten, nur die detaillierten GPS-Tracks werden entfernt.
 * 
 * Läuft täglich via Vercel Cron: 0 3 * * * (03:00 UTC)
 */
export async function GET(req: NextRequest) {
  // Auth prüfen
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30) // 30 Tage Retention

  try {
    // 1. GPS-Tracks aus Tagesprotokollen löschen (>30 Tage)
    const protokolleResult = await prisma.tagesprotokoll.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        gpsTrack: { not: null }
      },
      data: {
        gpsTrack: null
      }
    })

    // 2. GPS-Tracks aus ErnteEinsätzen löschen (>30 Tage)
    const einsaetzeResult = await prisma.ernteEinsatz.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        gpsTrack: { not: null }
      },
      data: {
        gpsTrack: null
      }
    })

    const totalCleaned = protokolleResult.count + einsaetzeResult.count

    // Log für Audit (minimal)
    if (totalCleaned > 0) {
      await prisma.activityLog.create({
        data: {
          action: "GPS_RAW_CLEANUP",
          entityType: "cron",
          entityId: "cleanup-gps-raw",
          entityName: `Retention: ${totalCleaned} GPS-Tracks gelöscht`,
          metadata: JSON.stringify({
            cutoffDate: cutoffDate.toISOString(),
            protokolle: protokolleResult.count,
            einsaetze: einsaetzeResult.count
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `GPS-Rohdaten bereinigt`,
      cutoffDate: cutoffDate.toISOString(),
      cleaned: {
        protokolle: protokolleResult.count,
        einsaetze: einsaetzeResult.count,
        total: totalCleaned
      }
    })
  } catch (error) {
    console.error("GPS-Raw-Cleanup Fehler:", error)
    return NextResponse.json({ 
      success: false,
      error: "Interner Fehler bei GPS-Bereinigung" 
    }, { status: 500 })
  }
}
