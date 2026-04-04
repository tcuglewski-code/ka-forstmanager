import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * DSGVO Retention Cron: Audit-Log Bereinigung
 * 
 * Läuft monatlich und löscht alle Audit-Log Einträge älter als 90 Tage.
 * Diese Logs dienen der Nachvollziehbarkeit, müssen aber nicht ewig aufbewahrt werden.
 * 
 * Betroffene Tabellen:
 * - ActivityLog (90 Tage) - Allgemeines Aktivitätsprotokoll
 * - AuftragLog (90 Tage) - Auftrags-Statusänderungen
 * - RechnungAuditLog (90 Tage) - Rechnungs-Änderungsprotokoll
 * - AiAuditLog (90 Tage) - KI-Nutzungsprotokoll (wenn vorhanden)
 * 
 * Hinweis: RechnungVersion wird NICHT gelöscht (GoBD-Compliance erfordert 
 * 10 Jahre Aufbewahrung für Rechnungsdaten)
 * 
 * Trigger: Vercel Cron (monatlich) oder manuell via GET
 */

const RETENTION_DAYS = 90
const TELEGRAM_CHAT_ID = "977688457"

interface CleanupResult {
  table: string
  deletedCount: number
}

export async function GET(req: NextRequest) {
  // Auth prüfen
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

  const results: CleanupResult[] = []
  const errors: string[] = []

  try {
    // 1. ActivityLog bereinigen
    try {
      const activityResult = await prisma.activityLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      })

      results.push({
        table: "ActivityLog",
        deletedCount: activityResult.count
      })
    } catch (e) {
      errors.push(`ActivityLog: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // 2. AuftragLog bereinigen
    try {
      const auftragLogResult = await prisma.auftragLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      })

      results.push({
        table: "AuftragLog",
        deletedCount: auftragLogResult.count
      })
    } catch (e) {
      errors.push(`AuftragLog: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // 3. RechnungAuditLog bereinigen
    try {
      const rechnungAuditResult = await prisma.rechnungAuditLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      })

      results.push({
        table: "RechnungAuditLog",
        deletedCount: rechnungAuditResult.count
      })
    } catch (e) {
      errors.push(`RechnungAuditLog: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // 4. AiAuditLog bereinigen (wenn Modell existiert)
    // TODO: Aktivieren sobald AiAuditLog-Modell in schema.prisma hinzugefügt wird
    // try {
    //   const aiAuditResult = await prisma.aiAuditLog.deleteMany({
    //     where: {
    //       createdAt: { lt: cutoffDate }
    //     }
    //   })
    //   results.push({
    //     table: "AiAuditLog",
    //     deletedCount: aiAuditResult.count
    //   })
    // } catch (e) {
    //   errors.push(`AiAuditLog: ${e instanceof Error ? e.message : "Unknown error"}`)
    // }

    // Ergebnisse zusammenfassen
    const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0)

    // Telegram-Benachrichtigung wenn Löschungen erfolgt sind
    if (totalDeleted > 0) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN
      if (telegramToken) {
        const message = `📋 Audit-Log Cleanup: ${totalDeleted} Einträge gelöscht\n\n` +
          results
            .filter(r => r.deletedCount > 0)
            .map(r => `• ${r.table}: ${r.deletedCount}`)
            .join("\n") +
          (errors.length > 0 ? `\n\n⚠️ Fehler:\n${errors.join("\n")}` : "") +
          `\n\nRetention: ${RETENTION_DAYS} Tage`

        try {
          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: "HTML"
            })
          })
        } catch (telegramError) {
          console.error("Telegram-Fehler:", telegramError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: totalDeleted > 0 
        ? `${totalDeleted} Audit-Log Einträge gelöscht` 
        : "Keine Audit-Log Einträge zur Löschung gefunden",
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: RETENTION_DAYS,
      results,
      errors: errors.length > 0 ? errors : undefined,
      note: "RechnungVersion wird bewusst nicht gelöscht (GoBD: 10 Jahre Aufbewahrungspflicht)"
    })

  } catch (error) {
    console.error("cleanup-audit Fehler:", error)
    return NextResponse.json({ 
      error: "Interner Fehler",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
