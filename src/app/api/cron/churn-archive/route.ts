import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Churn Archive Cron
 * 
 * Läuft täglich um 02:30 UTC und archiviert Tenants nach Grace Period:
 * - Findet Tenants mit status='grace_period' UND graceEndDate <= heute
 * - Archiviert steuerrelevante Daten (Rechnungen, Aufträge)
 * - Löscht GPS-Rohdaten (Datenschutz-Minimierung)
 * - Setzt status auf 'archived'
 * 
 * GoBD-Compliance: Rechnungen + Aufträge werden ARCHIVIERT, nicht gelöscht
 * DSGVO-Compliance: GPS-Rohdaten werden GELÖSCHT (nicht steuerrelevant)
 * 
 * Trigger: Vercel Cron (täglich 02:30 UTC)
 */

const TELEGRAM_CHAT_ID = "977688457"

interface ArchiveResult {
  tenantId: string
  tenantName: string
  graceEndDate: string
  rechnungenArchived: number
  auftraegeArchived: number
  gpsTracksDeleted: number
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

  const results: ArchiveResult[] = []
  const errors: string[] = []

  try {
    // Finde Tenants deren Grace Period abgelaufen ist
    const tenantsToArchive = await prisma.tenant.findMany({
      where: {
        status: "grace_period",
        graceEndDate: {
          not: null,
          lte: today
        }
      }
    })

    if (tenantsToArchive.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine Tenants für Archivierung gefunden",
        date: today.toISOString(),
        archived: 0
      })
    }

    // Archiviere jeden Tenant
    for (const tenant of tenantsToArchive) {
      const runId = `churn-archive-${tenant.id}-${Date.now()}`
      let rechnungenArchived = 0
      let auftraegeArchived = 0
      let gpsTracksDeleted = 0

      try {
        // =====================================================
        // PHASE 1: Steuerrelevante Daten archivieren (GoBD)
        // =====================================================

        // 1a. Rechnungen archivieren (10 Jahre Aufbewahrungspflicht)
        const rechnungen = await prisma.rechnung.findMany({
          include: {
            positionen: true,
            auditLog: true,
            versionen: true
          }
        })

        for (const rechnung of rechnungen) {
          // Prüfen ob bereits archiviert
          const existingArchive = await prisma.archivedRechnung.findUnique({
            where: { id: rechnung.id }
          })
          if (existingArchive) continue

          await prisma.archivedRechnung.create({
            data: {
              id: rechnung.id,
              originalCreatedAt: rechnung.createdAt,
              archiveReason: "CHURN_ARCHIVE",
              nummer: rechnung.nummer,
              auftragId: rechnung.auftragId,
              betrag: rechnung.betrag,
              bruttoBetrag: rechnung.bruttoBetrag,
              mwst: rechnung.mwst,
              status: rechnung.status,
              rechnungsDatum: rechnung.rechnungsDatum,
              fullSnapshot: {
                ...rechnung,
                positionen: rechnung.positionen,
                auditLog: rechnung.auditLog,
                versionen: rechnung.versionen
              }
            }
          })
          rechnungenArchived++
        }

        // 1b. Aufträge archivieren (mit Rechnungsreferenz wichtig)
        const auftraege = await prisma.auftrag.findMany({
          include: {
            flaechen: true,
            rechnungen: true,
            protokolle: true
          }
        })

        for (const auftrag of auftraege) {
          // Prüfen ob bereits archiviert
          const existingArchive = await prisma.archivedAuftrag.findUnique({
            where: { id: auftrag.id }
          })
          if (existingArchive) continue

          await prisma.archivedAuftrag.create({
            data: {
              id: auftrag.id,
              originalCreatedAt: auftrag.createdAt,
              archiveReason: "CHURN_ARCHIVE",
              nummer: auftrag.nummer,
              kundeId: auftrag.kundeId,
              status: auftrag.status,
              startDatum: auftrag.startDatum,
              endDatum: auftrag.endDatum,
              fullSnapshot: {
                ...auftrag,
                flaechen: auftrag.flaechen,
                rechnungen: auftrag.rechnungen.map(r => ({ id: r.id, nummer: r.nummer })),
                protokolleCount: auftrag.protokolle?.length || 0
              }
            }
          })
          auftraegeArchived++
        }

        // =====================================================
        // PHASE 2: GPS-Rohdaten löschen (DSGVO - nicht steuerrelevant)
        // =====================================================

        // GPS-Tracks aus Tagesprotokollen löschen
        const protokolleResult = await prisma.tagesprotokoll.updateMany({
          where: {
            gpsTrack: { not: null }
          },
          data: {
            gpsTrack: null
          }
        })
        gpsTracksDeleted += protokolleResult.count

        // GPS-Tracks aus ErnteEinsätzen löschen
        const einsaetzeResult = await prisma.ernteEinsatz.updateMany({
          where: {
            gpsTrack: { not: null }
          },
          data: {
            gpsTrack: null
          }
        })
        gpsTracksDeleted += einsaetzeResult.count

        // =====================================================
        // PHASE 3: Tenant-Status aktualisieren
        // =====================================================

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            status: "archived",
            archivedAt: new Date()
          }
        })

        // Archive-Log erstellen
        await prisma.archiveLog.create({
          data: {
            runId,
            entityType: "CHURN_ARCHIVE",
            entityCount: rechnungenArchived + auftraegeArchived,
            cutoffDate: today,
            completedAt: new Date(),
            status: "SUCCESS"
          }
        })

        // ActivityLog eintragen
        await prisma.activityLog.create({
          data: {
            action: "CHURN_ARCHIVE",
            entityType: "Tenant",
            entityId: tenant.id,
            entityName: tenant.name,
            userId: "SYSTEM_CRON",
            metadata: JSON.stringify({
              previousStatus: "grace_period",
              newStatus: "archived",
              graceEndDate: tenant.graceEndDate?.toISOString(),
              archivedAt: new Date().toISOString(),
              rechnungenArchived,
              auftraegeArchived,
              gpsTracksDeleted
            })
          }
        })

        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          graceEndDate: tenant.graceEndDate?.toISOString() || "unbekannt",
          rechnungenArchived,
          auftraegeArchived,
          gpsTracksDeleted
        })

      } catch (e) {
        const errorMsg = `Tenant ${tenant.id}: ${e instanceof Error ? e.message : "Unknown error"}`
        errors.push(errorMsg)
        console.error(errorMsg)

        // Failed Archive-Log
        await prisma.archiveLog.create({
          data: {
            runId,
            entityType: "CHURN_ARCHIVE",
            entityCount: 0,
            cutoffDate: today,
            completedAt: new Date(),
            status: "FAILED",
            error: errorMsg
          }
        })
      }
    }

    // Telegram-Benachrichtigung bei Archivierungen
    if (results.length > 0) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN
      if (telegramToken) {
        const message = `📦 <b>Churn Archive abgeschlossen</b>\n\n` +
          `${results.length} Tenant(s) archiviert:\n\n` +
          results.map(r => 
            `• <b>${r.tenantName}</b>\n` +
            `  Grace Ende: ${new Date(r.graceEndDate).toLocaleDateString("de-DE")}\n` +
            `  📄 ${r.rechnungenArchived} Rechnungen archiviert\n` +
            `  📋 ${r.auftraegeArchived} Aufträge archiviert\n` +
            `  🗑️ ${r.gpsTracksDeleted} GPS-Tracks gelöscht`
          ).join("\n\n") +
          (errors.length > 0 ? `\n\n❌ Fehler:\n${errors.join("\n")}` : "") +
          `\n\n✅ Steuerrelevante Daten gesichert | GPS gelöscht`

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
      message: `${results.length} Tenant(s) archiviert`,
      date: today.toISOString(),
      archived: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("churn-archive Fehler:", error)
    return NextResponse.json({ 
      error: "Interner Fehler",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
