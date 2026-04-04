import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

/**
 * Churn Notification Cron
 * 
 * Läuft täglich um 09:00 UTC (11:00 Sommerzeit / 10:00 Winterzeit DE)
 * Sendet E-Mail-Reminder an Tenants in Grace Period:
 * - 15 Tage vor Sperre
 * - 3 Tage vor Sperre
 * - Am Tag der Sperre (0 Tage)
 * 
 * Tracking via lastChurnNotifyAt + lastChurnNotifyDays verhindert Doppel-Emails
 * 
 * Trigger: Vercel Cron (täglich 09:00 UTC)
 */

const NOTIFY_DAYS = [15, 3, 0] // Tage vor Sperre an denen benachrichtigt wird
const TELEGRAM_CHAT_ID = "977688457"

interface NotifyResult {
  tenantId: string
  tenantName: string
  daysRemaining: number
  emailSent: boolean
  error?: string
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

  const results: NotifyResult[] = []
  const errors: string[] = []

  try {
    // Finde alle Tenants in Grace Period
    const tenantsInGrace = await prisma.tenant.findMany({
      where: {
        status: "grace_period",
        graceEndDate: { not: null }
      }
    })

    if (tenantsInGrace.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine Tenants in Grace Period",
        date: today.toISOString(),
        notified: 0
      })
    }

    for (const tenant of tenantsInGrace) {
      // Berechne Tage bis Sperre
      const graceEnd = new Date(tenant.graceEndDate!)
      graceEnd.setHours(0, 0, 0, 0)
      const diffTime = graceEnd.getTime() - today.getTime()
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Prüfe ob heute ein Benachrichtigungstag ist
      if (!NOTIFY_DAYS.includes(daysRemaining)) {
        continue
      }

      // Prüfe ob wir diese Benachrichtigung schon gesendet haben
      const lastNotifyDate = tenant.lastChurnNotifyAt ? new Date(tenant.lastChurnNotifyAt) : null
      if (lastNotifyDate) {
        lastNotifyDate.setHours(0, 0, 0, 0)
        // Wenn am selben Tag schon für dieselbe Stufe benachrichtigt → überspringen
        if (lastNotifyDate.getTime() === today.getTime() && tenant.lastChurnNotifyDays === daysRemaining) {
          continue
        }
      }

      const result: NotifyResult = {
        tenantId: tenant.id,
        tenantName: tenant.name,
        daysRemaining,
        emailSent: false
      }

      try {
        // E-Mail senden (wenn contactEmail vorhanden)
        if (tenant.contactEmail) {
          const emailResult = await sendEmail({
            to: tenant.contactEmail,
            subject: getEmailSubject(daysRemaining, tenant.name),
            html: getEmailHtml(tenant.name, daysRemaining, tenant.graceEndDate!)
          })

          result.emailSent = !emailResult.skipped && !emailResult.error
          if (emailResult.error) {
            result.error = emailResult.error
          }
        }

        // Tracking aktualisieren
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            lastChurnNotifyAt: today,
            lastChurnNotifyDays: daysRemaining
          }
        })

        // ActivityLog eintragen
        await prisma.activityLog.create({
          data: {
            action: "CHURN_NOTIFY",
            entityType: "Tenant",
            entityId: tenant.id,
            entityName: tenant.name,
            userId: "SYSTEM_CRON",
            metadata: JSON.stringify({
              daysRemaining,
              graceEndDate: tenant.graceEndDate?.toISOString(),
              emailSent: result.emailSent,
              emailTo: tenant.contactEmail || null
            })
          }
        })

        results.push(result)

      } catch (e) {
        const errorMsg = `Tenant ${tenant.id}: ${e instanceof Error ? e.message : "Unknown error"}`
        errors.push(errorMsg)
        console.error(errorMsg)
        result.error = errorMsg
        results.push(result)
      }
    }

    // Telegram-Benachrichtigung bei Notifications
    if (results.length > 0) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN
      if (telegramToken) {
        const urgentCount = results.filter(r => r.daysRemaining <= 3).length
        const emoji = urgentCount > 0 ? "🚨" : "📧"
        
        const message = `${emoji} <b>Churn-Benachrichtigungen gesendet</b>\n\n` +
          results.map(r => {
            const urgency = r.daysRemaining === 0 ? "⚠️ HEUTE" : 
                           r.daysRemaining === 3 ? "⚠️ 3 Tage" : "15 Tage"
            const status = r.emailSent ? "✅" : (r.error ? "❌" : "⏭️")
            return `• <b>${r.tenantName}</b> — ${urgency}\n  ${status} E-Mail ${r.emailSent ? "gesendet" : (r.error || "übersprungen")}`
          }).join("\n\n") +
          (errors.length > 0 ? `\n\n❌ Fehler:\n${errors.join("\n")}` : "")

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
      message: `${results.length} Benachrichtigung(en) verarbeitet`,
      date: today.toISOString(),
      notifyDays: NOTIFY_DAYS,
      notified: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("churn-notify Fehler:", error)
    return NextResponse.json({ 
      error: "Interner Fehler",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// ─── E-Mail Templates ─────────────────────────────────────────────────────────

function getEmailSubject(daysRemaining: number, tenantName: string): string {
  if (daysRemaining === 0) {
    return `⚠️ ${tenantName}: Ihr Zugang wird heute gesperrt`
  } else if (daysRemaining === 3) {
    return `⚠️ ${tenantName}: Nur noch 3 Tage bis zur Sperrung`
  } else {
    return `${tenantName}: 15 Tage bis zur Kontosperrung - Daten jetzt sichern`
  }
}

function getEmailHtml(tenantName: string, daysRemaining: number, graceEndDate: Date): string {
  const endDateStr = graceEndDate.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  })

  const urgencyBanner = daysRemaining === 0 
    ? `<div style="background:#dc2626;color:white;padding:16px;text-align:center;font-weight:bold;font-size:18px;">
        ⚠️ HEUTE LETZTE MÖGLICHKEIT
       </div>`
    : daysRemaining === 3
    ? `<div style="background:#f59e0b;color:white;padding:16px;text-align:center;font-weight:bold;font-size:18px;">
        ⚠️ Nur noch 3 Tage
       </div>`
    : `<div style="background:#3b82f6;color:white;padding:16px;text-align:center;font-weight:bold;">
        📅 Noch 15 Tage Zeit
       </div>`

  const actionText = daysRemaining === 0
    ? "Heute ist der letzte Tag Ihrer Grace Period. Nach Mitternacht wird Ihr Zugang gesperrt und Sie können Ihre Daten nicht mehr exportieren."
    : daysRemaining === 3
    ? "In 3 Tagen endet Ihre Grace Period. Nutzen Sie die verbleibende Zeit, um Ihre Daten zu sichern."
    : "Ihre Grace Period läuft in 15 Tagen ab. Wir möchten Sie rechtzeitig erinnern, Ihre wichtigen Daten zu exportieren."

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #2C3A1C; color: white; padding: 24px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; }
        .content { padding: 32px 24px; }
        .info-box { background: #f8f9fa; border-left: 4px solid #2C3A1C; padding: 16px; margin: 24px 0; }
        .cta { display: inline-block; background: #2C3A1C; color: white; padding: 14px 28px; 
               text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0; }
        .footer { background: #f8f9fa; padding: 24px; text-align: center; font-size: 12px; color: #666; }
        .countdown { font-size: 48px; font-weight: bold; color: #2C3A1C; text-align: center; margin: 16px 0; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Feldhub</div>
        </div>
        
        ${urgencyBanner}
        
        <div class="content">
          <p>Guten Tag,</p>
          
          <p>${actionText}</p>
          
          <div class="countdown">${daysRemaining} ${daysRemaining === 1 ? "Tag" : "Tage"}</div>
          <p style="text-align:center;color:#666;">bis zur Kontosperrung am ${endDateStr}</p>
          
          <div class="info-box">
            <strong>Was Sie jetzt tun sollten:</strong>
            <ul>
              <li>📦 <strong>Daten exportieren</strong> — Alle Ihre Aufträge, Protokolle und Dokumente als ZIP herunterladen</li>
              <li>🔄 <strong>Vertrag reaktivieren</strong> — Wenn Sie fortfahren möchten, kontaktieren Sie uns</li>
              <li>📋 <strong>Rechnungen sichern</strong> — Alle Rechnungen für Ihre Buchhaltung herunterladen</li>
            </ul>
          </div>
          
          <p style="text-align:center;">
            <a href="https://ka-forstmanager.vercel.app/einstellungen/export" class="cta">
              Jetzt Daten exportieren →
            </a>
          </p>
          
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
          
          <p><strong>Sie möchten weiterhin mit uns arbeiten?</strong></p>
          <p>Kein Problem! Kontaktieren Sie uns und wir reaktivieren Ihren Zugang innerhalb weniger Stunden.</p>
          <p>📧 E-Mail: info@feldhub.de<br>📞 Telefon: +49 (0) XXX XXXXXXX</p>
          
          <p>Mit freundlichen Grüßen<br>
          <strong>Ihr Feldhub-Team</strong></p>
        </div>
        
        <div class="footer">
          <p>
            Diese E-Mail wurde automatisch von Feldhub gesendet.<br>
            <a href="https://ka-forstmanager.vercel.app/einstellungen">Benachrichtigungseinstellungen ändern</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
