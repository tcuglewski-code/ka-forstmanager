import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GPS-Protokolldaten Löschroutine (DSGVO Art. 17 / Retention Policy)
 * 
 * Löscht alle GPS-Koordinatenfelder aus Protokollen älter als 90 Tage.
 * Die Protokolle selbst bleiben erhalten (GoBD), nur GPS wird anonymisiert.
 * 
 * Läuft wöchentlich via Vercel Cron: 0 4 * * 0 (Sonntag 04:00 UTC)
 */
export async function GET(req: NextRequest) {
  // Auth prüfen
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90) // 90 Tage Retention

  try {
    // 1. Tagesprotokoll: Alle GPS-Felder auf null setzen (>90 Tage)
    const protokolleResult = await prisma.tagesprotokoll.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        OR: [
          { gpsStartLat: { not: null } },
          { gpsStartLon: { not: null } },
          { gpsEndLat: { not: null } },
          { gpsEndLon: { not: null } },
          { gpsTrack: { not: null } }
        ]
      },
      data: {
        gpsStartLat: null,
        gpsStartLon: null,
        gpsEndLat: null,
        gpsEndLon: null,
        gpsTrack: null
      }
    })

    // 2. ErnteEinsatz: GPS-Track löschen (>90 Tage)
    const einsaetzeResult = await prisma.ernteEinsatz.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        gpsTrack: { not: null }
      },
      data: {
        gpsTrack: null
      }
    })

    // 3. Abnahme: GPS-Koordinaten löschen (>90 Tage)
    const abnahmenResult = await prisma.abnahme.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        OR: [
          { gpsLat: { not: null } },
          { gpsLon: { not: null } }
        ]
      },
      data: {
        gpsLat: null,
        gpsLon: null
      }
    })

    const totalCleaned = protokolleResult.count + einsaetzeResult.count + abnahmenResult.count

    // Audit-Log
    if (totalCleaned > 0) {
      await prisma.activityLog.create({
        data: {
          action: "GPS_PROTOKOLL_CLEANUP",
          entityType: "cron",
          entityId: "cleanup-gps-protokoll",
          entityName: `Retention: ${totalCleaned} GPS-Datensätze anonymisiert`,
          metadata: JSON.stringify({
            cutoffDate: cutoffDate.toISOString(),
            protokolle: protokolleResult.count,
            einsaetze: einsaetzeResult.count,
            abnahmen: abnahmenResult.count
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `GPS-Protokolldaten anonymisiert`,
      cutoffDate: cutoffDate.toISOString(),
      cleaned: {
        protokolle: protokolleResult.count,
        einsaetze: einsaetzeResult.count,
        abnahmen: abnahmenResult.count,
        total: totalCleaned
      }
    })
  } catch (error) {
    console.error("GPS-Protokoll-Cleanup Fehler:", error)
    return NextResponse.json({ 
      success: false,
      error: "Interner Fehler bei GPS-Protokoll-Bereinigung" 
    }, { status: 500 })
  }
}
