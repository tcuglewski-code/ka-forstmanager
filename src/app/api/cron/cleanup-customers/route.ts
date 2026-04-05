import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * DSGVO Kunden-Cleanup Cron (IMPL-DA-21b)
 *
 * Soft-Delete: Kontakt-Datensätze wo updatedAt > 10 Jahre
 *   → setzt deletedAt als Grace-Period-Start (30 Tage)
 * Hard-Delete: Kontakt-Datensätze wo deletedAt > 30 Tage
 *   → unwiderrufliche Löschung + DeletionLog
 *
 * Trigger: Vercel Cron (täglich 03:00 UTC) oder manuell via GET
 */

const RETENTION_YEARS = 10
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

    // Telegram-Benachrichtigung
    if (softDeleteCount > 0 || hardDeleteCount > 0) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN
      if (telegramToken) {
        const message =
          `🗑️ Kunden-Cleanup (DSGVO ${RETENTION_YEARS}J):\n` +
          `• Soft-Delete (Grace Period): ${softDeleteCount}\n` +
          `• Hard-Delete (endgültig): ${hardDeleteCount}` +
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
      gracePeriodDays: GRACE_PERIOD_DAYS,
      softDeleted: softDeleteCount,
      hardDeleted: hardDeleteCount,
      hardDeletedIds:
        hardDeletedIds.length > 0 ? hardDeletedIds : undefined,
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
