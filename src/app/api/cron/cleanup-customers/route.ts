import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * DSGVO Kunden-Cleanup Cron (IMPL-DA-21b + MR Datenlöschkonzept)
 *
 * 1. Kontakt-Datensätze:
 *    - Soft-Delete: updatedAt > 10 Jahre → setzt deletedAt (30 Tage Grace Period)
 *    - Hard-Delete: deletedAt > 30 Tage → unwiderrufliche Löschung + DeletionLog
 *
 * 2. GPS-Logs: Tagesprotokolle mit GPS-Daten älter als 3 Jahre → GPS-Felder nullifizieren
 *
 * 3. Allgemeine Datensätze: Tagesprotokolle + Stundeneinträge älter als 10 Jahre → Hard-Delete + DeletionLog
 *
 * Trigger: Vercel Cron (täglich 03:00 UTC) oder manuell via GET
 */

const RETENTION_YEARS = 10
const GPS_RETENTION_YEARS = 3
const GRACE_PERIOD_DAYS = 30
const TELEGRAM_CHAT_ID = "977688457"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const retentionCutoff = new Date()
  retentionCutoff.setFullYear(retentionCutoff.getFullYear() - RETENTION_YEARS)

  const graceCutoff = new Date()
  graceCutoff.setDate(graceCutoff.getDate() - GRACE_PERIOD_DAYS)

  let softDeleteCount = 0
  let hardDeleteCount = 0
  const hardDeletedIds: string[] = []
  const errors: string[] = []

  try {
    // Phase 1: Soft-Delete — Grace Period starten
    // Kontakte wo letztes Update > 10 Jahre und noch nicht soft-deleted
    try {
      const staleKontakte = await prisma.kontakt.findMany({
        where: {
          deletedAt: null,
          updatedAt: { lt: retentionCutoff },
        },
        select: { id: true },
      })

      if (staleKontakte.length > 0) {
        const result = await prisma.kontakt.updateMany({
          where: { id: { in: staleKontakte.map((k) => k.id) } },
          data: { deletedAt: now },
        })
        softDeleteCount = result.count
      }
    } catch (e) {
      errors.push(
        `Soft-Delete: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }

    // Phase 2: Hard-Delete — Grace Period abgelaufen
    // Kontakte wo deletedAt > 30 Tage
    try {
      const expiredKontakte = await prisma.kontakt.findMany({
        where: {
          deletedAt: { not: null, lt: graceCutoff },
        },
        select: { id: true },
      })

      if (expiredKontakte.length > 0) {
        await prisma.deletionLog.createMany({
          data: expiredKontakte.map((k) => ({
            entityType: "Kontakt",
            entityId: k.id,
            entitySummary: `Kontakt ${k.id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "DSGVO_RETENTION_10Y",
            retentionDays: RETENTION_YEARS * 365,
          })),
        })

        await prisma.kontakt.deleteMany({
          where: { id: { in: expiredKontakte.map((k) => k.id) } },
        })

        hardDeleteCount = expiredKontakte.length
        hardDeletedIds.push(...expiredKontakte.map((k) => k.id))
      }
    } catch (e) {
      errors.push(
        `Hard-Delete: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }

    // ── Phase 3: GPS-Logs älter als 3 Jahre nullifizieren ──────
    let gpsCleanedCount = 0
    const gpsCutoff = new Date()
    gpsCutoff.setFullYear(gpsCutoff.getFullYear() - GPS_RETENTION_YEARS)

    try {
      const gpsResult = await prisma.tagesprotokoll.updateMany({
        where: {
          datum: { lt: gpsCutoff },
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
      gpsCleanedCount = gpsResult.count

      if (gpsCleanedCount > 0) {
        await prisma.deletionLog.create({
          data: {
            entityType: "GPS_DATA_3Y",
            entityId: `cron-cleanup-customers-gps-${now.toISOString().slice(0, 10)}`,
            entitySummary: `GPS-Daten nullifiziert: ${gpsCleanedCount} Protokolle (>3 Jahre)`,
            deletedBy: "SYSTEM_CRON",
            reason: "RETENTION_POLICY",
            retentionDays: GPS_RETENTION_YEARS * 365,
          },
        })
      }
    } catch (e) {
      errors.push(
        `GPS-Cleanup: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }

    // ── Phase 4: Allgemeine Datensätze älter als 10 Jahre hard-deleten ──
    let protokolleDeletedCount = 0
    let stundenDeletedCount = 0

    try {
      // Tagesprotokolle älter als 10 Jahre
      const oldProtokolle = await prisma.tagesprotokoll.findMany({
        where: { datum: { lt: retentionCutoff } },
        select: { id: true },
      })

      if (oldProtokolle.length > 0) {
        const ids = oldProtokolle.map((p: { id: string }) => p.id)

        await prisma.deletionLog.createMany({
          data: ids.map((id: string) => ({
            entityType: "Tagesprotokoll",
            entityId: id,
            entitySummary: `Tagesprotokoll ${id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "DSGVO_RETENTION_10Y",
            retentionDays: RETENTION_YEARS * 365,
          })),
        })

        // Direct deleteMany (Tagesprotokoll has no deletedAt, so no soft-delete intercept)
        await prisma.tagesprotokoll.deleteMany({
          where: { id: { in: ids } },
        })

        protokolleDeletedCount = ids.length
      }
    } catch (e) {
      errors.push(
        `Protokoll-Cleanup: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }

    try {
      // Stundeneinträge älter als 10 Jahre
      const oldStunden = await prisma.stundeneintrag.findMany({
        where: { datum: { lt: retentionCutoff } },
        select: { id: true },
      })

      if (oldStunden.length > 0) {
        const ids = oldStunden.map((s: { id: string }) => s.id)

        await prisma.deletionLog.createMany({
          data: ids.map((id: string) => ({
            entityType: "Stundeneintrag",
            entityId: id,
            entitySummary: `Stundeneintrag ${id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "DSGVO_RETENTION_10Y",
            retentionDays: RETENTION_YEARS * 365,
          })),
        })

        await prisma.stundeneintrag.deleteMany({
          where: { id: { in: ids } },
        })

        stundenDeletedCount = ids.length
      }
    } catch (e) {
      errors.push(
        `Stunden-Cleanup: ${e instanceof Error ? e.message : "Unknown error"}`
      )
    }

    // Telegram-Benachrichtigung
    if (softDeleteCount > 0 || hardDeleteCount > 0 || gpsCleanedCount > 0 || protokolleDeletedCount > 0 || stundenDeletedCount > 0) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN
      if (telegramToken) {
        const message =
          `🗑️ Kunden-Cleanup (DSGVO):\n` +
          `• Kontakte Soft-Delete (Grace Period): ${softDeleteCount}\n` +
          `• Kontakte Hard-Delete (endgültig): ${hardDeleteCount}\n` +
          `• GPS-Daten nullifiziert (>${GPS_RETENTION_YEARS}J): ${gpsCleanedCount}\n` +
          `• Protokolle gelöscht (>${RETENTION_YEARS}J): ${protokolleDeletedCount}\n` +
          `• Stundeneinträge gelöscht (>${RETENTION_YEARS}J): ${stundenDeletedCount}` +
          (errors.length > 0 ? `\n\n⚠️ Fehler:\n${errors.join("\n")}` : "")

        try {
          await fetch(
            `https://api.telegram.org/bot${telegramToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
              }),
            }
          )
        } catch {
          console.error("Telegram notification failed")
        }
      }
    }

    return NextResponse.json({
      success: true,
      retentionYears: RETENTION_YEARS,
      gpsRetentionYears: GPS_RETENTION_YEARS,
      gracePeriodDays: GRACE_PERIOD_DAYS,
      kontakte: {
        softDeleted: softDeleteCount,
        hardDeleted: hardDeleteCount,
        hardDeletedIds:
          hardDeletedIds.length > 0 ? hardDeletedIds : undefined,
      },
      gpsCleaned: gpsCleanedCount,
      recordsDeleted: {
        tagesprotokolle: protokolleDeletedCount,
        stundeneintraege: stundenDeletedCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("cleanup-customers Fehler:", error)
    return NextResponse.json(
      {
        error: "Interner Fehler",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
