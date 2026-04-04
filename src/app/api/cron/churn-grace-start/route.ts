import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Churn Grace Period Start Cron
 * 
 * Läuft täglich um 02:00 UTC und setzt Tenants in Grace Period:
 * - Findet Tenants mit status='active' oder 'cancelled' UND contractEndDate <= heute
 * - Setzt status auf 'grace_period'
 * - Berechnet graceEndDate = heute + 30 Tage
 * 
 * Während Grace Period:
 * - 30 Tage Lesezugriff
 * - Möglichkeit zum Datenexport
 * - Keine Schreiboperationen mehr
 * 
 * Trigger: Vercel Cron (täglich 02:00 UTC)
 */

const GRACE_PERIOD_DAYS = 30
const TELEGRAM_CHAT_ID = "977688457"

interface GraceResult {
  tenantId: string
  tenantName: string
  contractEndDate: string
  graceEndDate: string
}

export async function GET(req: NextRequest) {
  // Auth prüfen
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const results: GraceResult[] = []
  const errors: string[] = []

  try {
    // Finde Tenants deren Vertrag heute oder früher ausläuft
    // und die noch nicht in grace_period sind
    const tenantsToTransition = await prisma.tenant.findMany({
      where: {
        OR: [
          { status: "active" },
          { status: "cancelled" }
        ],
        contractEndDate: {
          not: null,
          lte: today
        }
      }
    })

    if (tenantsToTransition.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine Tenants für Grace Period Übergang gefunden",
        date: today.toISOString(),
        transitioned: 0
      })
    }

    // Berechne Grace Period Ende (heute + 30 Tage)
    const graceEndDate = new Date(today)
    graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS)

    // Setze jeden Tenant auf Grace Period
    for (const tenant of tenantsToTransition) {
      try {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            status: "grace_period",
            graceEndDate: graceEndDate
          }
        })

        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          contractEndDate: tenant.contractEndDate?.toISOString() || "unbekannt",
          graceEndDate: graceEndDate.toISOString()
        })

        // ActivityLog eintragen
        await prisma.activityLog.create({
          data: {
            action: "CHURN_GRACE_START",
            entityType: "Tenant",
            entityId: tenant.id,
            entityName: tenant.name,
            userId: "SYSTEM_CRON",
            metadata: JSON.stringify({
              previousStatus: tenant.status,
              newStatus: "grace_period",
              contractEndDate: tenant.contractEndDate?.toISOString(),
              graceEndDate: graceEndDate.toISOString(),
              gracePeriodDays: GRACE_PERIOD_DAYS
            })
          }
        })

      } catch (e) {
        const errorMsg = `Tenant ${tenant.id}: ${e instanceof Error ? e.message : "Unknown error"}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Telegram-Benachrichtigung bei Übergängen
    if (results.length > 0) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN
      if (telegramToken) {
        const message = `⚠️ <b>Churn Grace Period gestartet</b>\n\n` +
          `${results.length} Tenant(s) in Grace Period versetzt:\n\n` +
          results.map(r => 
            `• <b>${r.tenantName}</b>\n` +
            `  Vertragsende: ${new Date(r.contractEndDate).toLocaleDateString("de-DE")}\n` +
            `  Grace Ende: ${new Date(r.graceEndDate).toLocaleDateString("de-DE")}`
          ).join("\n\n") +
          (errors.length > 0 ? `\n\n❌ Fehler:\n${errors.join("\n")}` : "") +
          `\n\n📅 30 Tage Lesezugriff + Export-Möglichkeit`

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
      message: `${results.length} Tenant(s) in Grace Period versetzt`,
      date: today.toISOString(),
      graceEndDate: graceEndDate.toISOString(),
      gracePeriodDays: GRACE_PERIOD_DAYS,
      transitioned: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("churn-grace-start Fehler:", error)
    return NextResponse.json({ 
      error: "Interner Fehler",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
