import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * DA-22: Automatische GPS/Temp-Löschroutinen
 *
 * 1. GPS-Koordinaten aus Tagesprotokollen, Abnahmen, ErnteEinsätzen
 *    und SOS-Events nullifizieren (konfigurierbar via RetentionConfig)
 * 2. Abgelaufene ExportRequests löschen (>7 Tage nach expiresAt)
 *
 * Läuft täglich via Vercel Cron: 30 2 * * * (02:30 UTC)
 */

// Fallback-Werte falls RetentionConfig noch nicht geseeded
const FALLBACK_GPS_DAYS = 30
const FALLBACK_TEMP_DAYS = 7

async function getRetentionDays(
  dataType: string,
  fallback: number
): Promise<number> {
  const config = await prisma.retentionConfig.findUnique({
    where: { dataType },
  })
  return config?.retentionDays ?? fallback
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  try {
    // Retention-Tage aus RetentionConfig laden
    const gpsDays = await getRetentionDays("gps_logs", FALLBACK_GPS_DAYS)
    const tempDays = await getRetentionDays("temp_files", FALLBACK_TEMP_DAYS)

    const gpsCutoff = new Date(now)
    gpsCutoff.setDate(gpsCutoff.getDate() - gpsDays)

    const tempCutoff = new Date(now)
    tempCutoff.setDate(tempCutoff.getDate() - tempDays)

    // ── 1. GPS-Daten nullifizieren ──────────────────────────────

    // 1a. Tagesprotokolle: GPS-Felder nullen
    const protokolle = await prisma.tagesprotokoll.updateMany({
      where: {
        createdAt: { lt: gpsCutoff },
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

    // 1b. Abnahmen: GPS-Felder nullen
    const abnahmen = await prisma.abnahme.updateMany({
      where: {
        createdAt: { lt: gpsCutoff },
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

    // 1c. ErnteEinsätze: GPS-Track nullen
    const einsaetze = await prisma.ernteEinsatz.updateMany({
      where: {
        createdAt: { lt: gpsCutoff },
        gpsTrack: { not: null },
      },
      data: {
        gpsTrack: null,
      },
    })

    // 1d. SOS-Events: GPS-Daten nullen
    const sosEvents = await prisma.sOSEvent.updateMany({
      where: {
        createdAt: { lt: gpsCutoff },
        OR: [
          { gpsLatitude: { not: null } },
          { gpsLongitude: { not: null } },
        ],
      },
      data: {
        gpsLatitude: null,
        gpsLongitude: null,
        gpsAccuracy: null,
        gpsAltitude: null,
        gpsTimestamp: null,
        googleMapsLink: null,
      },
    })

    const totalGps =
      protokolle.count + abnahmen.count + einsaetze.count + sosEvents.count

    // ── 2. Abgelaufene ExportRequests löschen ───────────────────

    const exports = await prisma.exportRequest.deleteMany({
      where: {
        expiresAt: { lt: tempCutoff },
        status: { in: ["completed", "expired", "failed"] },
      },
    })

    // ── 3. Audit-Trail ──────────────────────────────────────────

    const totalCleaned = totalGps + exports.count

    if (totalCleaned > 0) {
      await prisma.deletionLog.create({
        data: {
          entityType: "DATA_RETENTION",
          entityId: `cron-cleanup-data-${now.toISOString().slice(0, 10)}`,
          entitySummary: `GPS: ${totalGps} Datensätze, Exports: ${exports.count} gelöscht`,
          deletedBy: "SYSTEM_CRON",
          reason: "RETENTION_POLICY",
          retentionDays: gpsDays,
          metadata: {
            gpsCutoff: gpsCutoff.toISOString(),
            tempCutoff: tempCutoff.toISOString(),
            retentionConfig: { gpsDays, tempDays },
            gps: {
              protokolle: protokolle.count,
              abnahmen: abnahmen.count,
              einsaetze: einsaetze.count,
              sosEvents: sosEvents.count,
            },
            exports: exports.count,
          },
        },
      })
    }

    console.log(
      `[Cron cleanup-data] GPS: ${totalGps}, Exports: ${exports.count} (gpsDays=${gpsDays}, tempDays=${tempDays})`
    )

    return NextResponse.json({
      success: true,
      message: `Daten-Retention abgeschlossen`,
      retention: {
        gpsDays,
        tempDays,
        source: "RetentionConfig",
      },
      cleaned: {
        gps: {
          protokolle: protokolle.count,
          abnahmen: abnahmen.count,
          einsaetze: einsaetze.count,
          sosEvents: sosEvents.count,
          total: totalGps,
        },
        exports: exports.count,
        total: totalCleaned,
      },
    })
  } catch (error) {
    console.error("[Cron cleanup-data] Fehler:", error)
    return NextResponse.json(
      { success: false, error: "Interner Fehler bei Daten-Retention" },
      { status: 500 }
    )
  }
}
