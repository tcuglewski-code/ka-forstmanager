import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * DSGVO Retention Cron: Soft-Delete → Hard-Delete Pipeline
 * 
 * Läuft wöchentlich und löscht alle Datensätze mit deletedAt > 30 Tage
 * unwiderruflich aus der Datenbank. Dokumentiert jede Löschung im DeletionLog.
 * 
 * Betroffene Tabellen:
 * - User (30 Tage)
 * - Mitarbeiter (30 Tage)
 * - Auftrag (30 Tage)
 * - Dokument (30 Tage)
 * - Kontakt (30 Tage)
 * - LagerArtikel (30 Tage)
 * 
 * Trigger: Vercel Cron (wöchentlich) oder manuell via GET
 */

const RETENTION_DAYS = 30
const TELEGRAM_CHAT_ID = "977688457"

interface DeletionResult {
  entityType: string
  count: number
  ids: string[]
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

  const results: DeletionResult[] = []
  const errors: string[] = []

  try {
    // 1. User Hard-Delete
    try {
      const usersToDelete = await prisma.user.findMany({
        where: {
          deletedAt: { not: null, lt: cutoffDate }
        },
        select: { id: true, email: true }
      })

      if (usersToDelete.length > 0) {
        // Lösch-Log erstellen
        await prisma.deletionLog.createMany({
          data: usersToDelete.map(u => ({
            entityType: "User",
            entityId: u.id,
            entitySummary: `User ${u.id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "RETENTION_POLICY",
            retentionDays: RETENTION_DAYS
          }))
        })

        // Hard-Delete
        await prisma.user.deleteMany({
          where: { id: { in: usersToDelete.map(u => u.id) } }
        })

        results.push({
          entityType: "User",
          count: usersToDelete.length,
          ids: usersToDelete.map(u => u.id)
        })
      }
    } catch (e) {
      errors.push(`User: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // 2. Mitarbeiter Hard-Delete
    try {
      const mitarbeiterToDelete = await prisma.mitarbeiter.findMany({
        where: {
          deletedAt: { not: null, lt: cutoffDate }
        },
        select: { id: true, vorname: true, nachname: true }
      })

      if (mitarbeiterToDelete.length > 0) {
        await prisma.deletionLog.createMany({
          data: mitarbeiterToDelete.map(m => ({
            entityType: "Mitarbeiter",
            entityId: m.id,
            entitySummary: `Mitarbeiter ${m.id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "RETENTION_POLICY",
            retentionDays: RETENTION_DAYS
          }))
        })

        await prisma.mitarbeiter.deleteMany({
          where: { id: { in: mitarbeiterToDelete.map(m => m.id) } }
        })

        results.push({
          entityType: "Mitarbeiter",
          count: mitarbeiterToDelete.length,
          ids: mitarbeiterToDelete.map(m => m.id)
        })
      }
    } catch (e) {
      errors.push(`Mitarbeiter: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // 3. Auftrag Hard-Delete
    try {
      const auftraegeToDelete = await prisma.auftrag.findMany({
        where: {
          deletedAt: { not: null, lt: cutoffDate }
        },
        select: { id: true, nummer: true }
      })

      if (auftraegeToDelete.length > 0) {
        await prisma.deletionLog.createMany({
          data: auftraegeToDelete.map(a => ({
            entityType: "Auftrag",
            entityId: a.id,
            entitySummary: `Auftrag ${a.nummer || a.id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "RETENTION_POLICY",
            retentionDays: RETENTION_DAYS
          }))
        })

        await prisma.auftrag.deleteMany({
          where: { id: { in: auftraegeToDelete.map(a => a.id) } }
        })

        results.push({
          entityType: "Auftrag",
          count: auftraegeToDelete.length,
          ids: auftraegeToDelete.map(a => a.id)
        })
      }
    } catch (e) {
      errors.push(`Auftrag: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // 4. Dokument Hard-Delete
    try {
      const dokumenteToDelete = await prisma.dokument.findMany({
        where: {
          deletedAt: { not: null, lt: cutoffDate }
        },
        select: { id: true, name: true }
      })

      if (dokumenteToDelete.length > 0) {
        await prisma.deletionLog.createMany({
          data: dokumenteToDelete.map(d => ({
            entityType: "Dokument",
            entityId: d.id,
            entitySummary: `Dokument ${d.id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "RETENTION_POLICY",
            retentionDays: RETENTION_DAYS
          }))
        })

        await prisma.dokument.deleteMany({
          where: { id: { in: dokumenteToDelete.map(d => d.id) } }
        })

        results.push({
          entityType: "Dokument",
          count: dokumenteToDelete.length,
          ids: dokumenteToDelete.map(d => d.id)
        })
      }
    } catch (e) {
      errors.push(`Dokument: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // 5. Kontakt Hard-Delete
    try {
      const kontakteToDelete = await prisma.kontakt.findMany({
        where: {
          deletedAt: { not: null, lt: cutoffDate }
        },
        select: { id: true, name: true }
      })

      if (kontakteToDelete.length > 0) {
        await prisma.deletionLog.createMany({
          data: kontakteToDelete.map(k => ({
            entityType: "Kontakt",
            entityId: k.id,
            entitySummary: `Kontakt ${k.id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "RETENTION_POLICY",
            retentionDays: RETENTION_DAYS
          }))
        })

        await prisma.kontakt.deleteMany({
          where: { id: { in: kontakteToDelete.map(k => k.id) } }
        })

        results.push({
          entityType: "Kontakt",
          count: kontakteToDelete.length,
          ids: kontakteToDelete.map(k => k.id)
        })
      }
    } catch (e) {
      errors.push(`Kontakt: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // 6. LagerArtikel Hard-Delete
    try {
      const artikelToDelete = await prisma.lagerArtikel.findMany({
        where: {
          deletedAt: { not: null, lt: cutoffDate }
        },
        select: { id: true, name: true }
      })

      if (artikelToDelete.length > 0) {
        await prisma.deletionLog.createMany({
          data: artikelToDelete.map(a => ({
            entityType: "LagerArtikel",
            entityId: a.id,
            entitySummary: `Artikel ${a.id.slice(-6)}`,
            deletedBy: "SYSTEM_CRON",
            reason: "RETENTION_POLICY",
            retentionDays: RETENTION_DAYS
          }))
        })

        await prisma.lagerArtikel.deleteMany({
          where: { id: { in: artikelToDelete.map(a => a.id) } }
        })

        results.push({
          entityType: "LagerArtikel",
          count: artikelToDelete.length,
          ids: artikelToDelete.map(a => a.id)
        })
      }
    } catch (e) {
      errors.push(`LagerArtikel: ${e instanceof Error ? e.message : "Unknown error"}`)
    }

    // Telegram-Benachrichtigung wenn Löschungen erfolgt sind
    const totalDeleted = results.reduce((sum, r) => sum + r.count, 0)
    
    if (totalDeleted > 0) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN
      if (telegramToken) {
        const message = `🗑️ DSGVO Retention: ${totalDeleted} Datensätze gelöscht\n\n` +
          results.map(r => `• ${r.entityType}: ${r.count}`).join("\n") +
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
        ? `${totalDeleted} Datensätze hard-deleted` 
        : "Keine Datensätze zur Löschung gefunden",
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: RETENTION_DAYS,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("cleanup-soft-delete Fehler:", error)
    return NextResponse.json({ 
      error: "Interner Fehler",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
