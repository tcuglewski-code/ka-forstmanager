import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GPS-Daten Löschroutine nach Projektabschluss (DSGVO Art. 17 / Löschfristen-Matrix)
 *
 * Nullifiziert GPS-Koordinaten aus Tagesprotokollen und Abnahmen,
 * wenn der zugehörige Auftrag seit 30+ Tagen abgeschlossen ist.
 * Die Datensätze bleiben erhalten — nur die GPS-Felder werden genullt.
 *
 * Läuft täglich via Vercel Cron: 30 4 * * * (04:30 UTC)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)

  try {
    // Abgeschlossene Aufträge finden, deren Status seit 30+ Tagen nicht geändert wurde
    const completedAuftraege = await prisma.auftrag.findMany({
      where: {
        status: "abgeschlossen",
        updatedAt: { lt: cutoffDate },
      },
      select: { id: true, titel: true },
    })

    if (completedAuftraege.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine abgeschlossenen Aufträge zur GPS-Bereinigung gefunden",
        cleaned: { tagesprotokolle: 0, abnahmen: 0, total: 0 },
      })
    }

    const auftragIds = completedAuftraege.map((a) => a.id)

    // 1. Tagesprotokolle: GPS-Felder nullen
    const protokolleResult = await prisma.tagesprotokoll.updateMany({
      where: {
        auftragId: { in: auftragIds },
        OR: [
          { gpsStartLat: { not: null } },
          { gpsStartLon: { not: null } },
          { gpsEndLat: { not: null } },
          { gpsEndLon: { not: null } },
          { gpsTrack: { not: null } },
        ],
      },
      data: {
        gpsStartLat: null,
        gpsStartLon: null,
        gpsEndLat: null,
        gpsEndLon: null,
        gpsTrack: null,
      },
    })

    // 2. Abnahmen: GPS-Felder nullen
    const abnahmenResult = await prisma.abnahme.updateMany({
      where: {
        auftragId: { in: auftragIds },
        OR: [
          { gpsLat: { not: null } },
          { gpsLon: { not: null } },
        ],
      },
      data: {
        gpsLat: null,
        gpsLon: null,
      },
    })

    const totalCleaned = protokolleResult.count + abnahmenResult.count

    // DeletionLog-Einträge für Audit-Trail
    if (totalCleaned > 0) {
      await prisma.deletionLog.create({
        data: {
          entityType: "GPS_DATA",
          entityId: `cron-${new Date().toISOString().slice(0, 10)}`,
          entitySummary: `GPS-Bereinigung: ${protokolleResult.count} Protokolle, ${abnahmenResult.count} Abnahmen`,
          deletedBy: "SYSTEM_CRON",
          reason: "RETENTION_POLICY",
          retentionDays: 30,
          metadata: {
            cutoffDate: cutoffDate.toISOString(),
            auftraegeCount: completedAuftraege.length,
            auftraegeIds: auftragIds,
            tagesprotokolle: protokolleResult.count,
            abnahmen: abnahmenResult.count,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `GPS-Daten bereinigt für ${completedAuftraege.length} abgeschlossene Aufträge`,
      cutoffDate: cutoffDate.toISOString(),
      cleaned: {
        tagesprotokolle: protokolleResult.count,
        abnahmen: abnahmenResult.count,
        total: totalCleaned,
      },
    })
  } catch (error) {
    console.error("GPS-Data-Cleanup Fehler:", error)
    return NextResponse.json(
      { success: false, error: "Interner Fehler bei GPS-Bereinigung" },
      { status: 500 }
    )
  }
}
