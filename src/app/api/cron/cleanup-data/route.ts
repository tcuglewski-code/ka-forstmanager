import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * DA-22: Unified GPS + Temp Data + Soft-Delete Cleanup Cron (DSGVO)
 *
 * 1. GPS-Koordinaten aus Tagesprotokollen, Abnahmen, ErnteEinsätzen
 *    und SOS-Events nullifizieren (30d via RetentionConfig)
 * 2. Abgelaufene ExportRequests löschen (>7 Tage nach expiresAt)
 * 3. Soft-Deleted Einträge >90 Tage unwiderruflich hard-deleten
 *
 * Läuft täglich via Vercel Cron: 0 4 * * * (04:00 UTC)
 */

const FALLBACK_GPS_DAYS = 30
const FALLBACK_TEMP_DAYS = 7
const SOFT_DELETE_RETENTION_DAYS = 90

async function getRetentionDays(
  dataType: string,
  fallback: number
): Promise<number> {
  const config = await prisma.retentionConfig.findUnique({
    where: { dataType },
  })
  return config?.retentionDays ?? fallback
}

interface SoftDeleteResult {
  entityType: string
  count: number
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  try {
    const gpsDays = await getRetentionDays("gps_logs", FALLBACK_GPS_DAYS)
    const tempDays = await getRetentionDays("temp_files", FALLBACK_TEMP_DAYS)

    const gpsCutoff = new Date(now)
    gpsCutoff.setDate(gpsCutoff.getDate() - gpsDays)

    const tempCutoff = new Date(now)
    tempCutoff.setDate(tempCutoff.getDate() - tempDays)

    const softDeleteCutoff = new Date(now)
    softDeleteCutoff.setDate(softDeleteCutoff.getDate() - SOFT_DELETE_RETENTION_DAYS)

    // ── 1. GPS-Daten nullifizieren (30d) ────────────────────────

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

    const einsaetze = await prisma.ernteEinsatz.updateMany({
      where: {
        createdAt: { lt: gpsCutoff },
        gpsTrack: { not: null },
      },
      data: {
        gpsTrack: null,
      },
    })

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

    // ── 3. Soft-Delete → Hard-Delete (90d) ──────────────────────

    const softDeleteResults: SoftDeleteResult[] = []
    const softDeleteErrors: string[] = []

    const softDeleteTables = [
      { name: "User", model: prisma.user, select: { id: true } },
      { name: "Mitarbeiter", model: prisma.mitarbeiter, select: { id: true } },
      { name: "Auftrag", model: prisma.auftrag, select: { id: true } },
      { name: "Dokument", model: prisma.dokument, select: { id: true } },
      { name: "Kontakt", model: prisma.kontakt, select: { id: true } },
      { name: "LagerArtikel", model: prisma.lagerArtikel, select: { id: true } },
    ] as const

    for (const table of softDeleteTables) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const model = table.model as any
        const toDelete = await model.findMany({
          where: { deletedAt: { not: null, lt: softDeleteCutoff } },
          select: { id: true },
        })

        if (toDelete.length > 0) {
          const ids = toDelete.map((r: { id: string }) => r.id)

          await prisma.deletionLog.createMany({
            data: ids.map((id: string) => ({
              entityType: table.name,
              entityId: id,
              entitySummary: `${table.name} ${id.slice(-6)}`,
              deletedBy: "SYSTEM_CRON",
              reason: "RETENTION_POLICY",
              retentionDays: SOFT_DELETE_RETENTION_DAYS,
            })),
          })

          await model.deleteMany({
            where: { id: { in: ids } },
          })

          softDeleteResults.push({ entityType: table.name, count: ids.length })
        }
      } catch (e) {
        softDeleteErrors.push(
          `${table.name}: ${e instanceof Error ? e.message : "Unknown error"}`
        )
      }
    }

    const totalSoftDeleted = softDeleteResults.reduce((s, r) => s + r.count, 0)

    // ── 4. Audit-Trail ──────────────────────────────────────────

    const totalCleaned = totalGps + exports.count + totalSoftDeleted

    if (totalGps + exports.count > 0) {
      await prisma.deletionLog.create({
        data: {
          entityType: "DATA_RETENTION",
          entityId: `cron-cleanup-data-${now.toISOString().slice(0, 10)}`,
          entitySummary: `GPS: ${totalGps}, Exports: ${exports.count}, SoftDelete: ${totalSoftDeleted}`,
          deletedBy: "SYSTEM_CRON",
          reason: "RETENTION_POLICY",
          retentionDays: gpsDays,
          metadata: {
            gpsCutoff: gpsCutoff.toISOString(),
            tempCutoff: tempCutoff.toISOString(),
            softDeleteCutoff: softDeleteCutoff.toISOString(),
            retentionConfig: { gpsDays, tempDays, softDeleteDays: SOFT_DELETE_RETENTION_DAYS },
            gps: {
              protokolle: protokolle.count,
              abnahmen: abnahmen.count,
              einsaetze: einsaetze.count,
              sosEvents: sosEvents.count,
            },
            exports: exports.count,
            softDelete: softDeleteResults,
            softDeleteErrors: softDeleteErrors.length > 0 ? softDeleteErrors : undefined,
          },
        },
      })
    }

    console.log(
      `[Cron cleanup-data] GPS: ${totalGps}, Exports: ${exports.count}, SoftDelete: ${totalSoftDeleted} (gpsDays=${gpsDays}, tempDays=${tempDays}, softDeleteDays=${SOFT_DELETE_RETENTION_DAYS})`
    )

    return NextResponse.json({
      success: true,
      message: `Daten-Retention abgeschlossen`,
      retention: {
        gpsDays,
        tempDays,
        softDeleteDays: SOFT_DELETE_RETENTION_DAYS,
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
        softDelete: {
          results: softDeleteResults,
          total: totalSoftDeleted,
          errors: softDeleteErrors.length > 0 ? softDeleteErrors : undefined,
        },
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
