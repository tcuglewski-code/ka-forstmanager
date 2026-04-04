import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Cron: GoBD 10-Jahres-Retention Cleanup
 * 
 * Sprint GB-04: Physische Löschung von Rechnungen die vor >10 Jahren soft-deleted wurden.
 * 
 * GoBD-Compliance:
 * - Rechnungen müssen 10 Jahre aufbewahrt werden (§147 AO, §257 HGB)
 * - Nach 10 Jahren ab deletedAt: physische Löschung erlaubt
 * - Jede Löschung wird im DeletionLog protokolliert
 * 
 * Schedule: Jährlich (in vercel.json konfiguriert)
 * Security: Nur via Vercel Cron (CRON_SECRET) aufrufbar
 */

const RETENTION_YEARS = 10

export async function GET(req: NextRequest) {
  // Security: Vercel Cron Protection
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[CRON cleanup-invoices-10y] Unauthorized access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const startTime = Date.now()
  console.log('[CRON cleanup-invoices-10y] Starting 10-year retention cleanup...')
  
  try {
    // Berechne Stichtag: Heute minus 10 Jahre
    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - RETENTION_YEARS)
    
    // Finde alle Rechnungen die vor >10 Jahren soft-deleted wurden
    const rechnungenToDelete = await prisma.rechnung.findMany({
      where: {
        deletedAt: {
          not: null,
          lt: cutoffDate, // deletedAt älter als 10 Jahre
        },
      },
      select: {
        id: true,
        nummer: true,
        deletedAt: true,
        deletedBy: true,
        betrag: true,
        bruttoBetrag: true,
        createdAt: true,
      },
    })
    
    if (rechnungenToDelete.length === 0) {
      console.log('[CRON cleanup-invoices-10y] No invoices eligible for hard-delete')
      return NextResponse.json({
        ok: true,
        message: 'Keine Rechnungen zur Löschung gefunden',
        cutoffDate: cutoffDate.toISOString(),
        deletedCount: 0,
        durationMs: Date.now() - startTime,
      })
    }
    
    console.log(`[CRON cleanup-invoices-10y] Found ${rechnungenToDelete.length} invoices for hard-delete`)
    
    // Protokolliere und lösche jede Rechnung
    const deletionResults: Array<{ id: string; nummer: string; success: boolean; error?: string }> = []
    
    for (const rechnung of rechnungenToDelete) {
      try {
        // 1. Protokolliere im DeletionLog (DSGVO-Nachweis)
        await prisma.deletionLog.create({
          data: {
            entityType: 'Rechnung',
            entityId: rechnung.id,
            entitySummary: `Rechnung ${rechnung.nummer} (${rechnung.bruttoBetrag ?? rechnung.betrag}€, erstellt: ${rechnung.createdAt.toISOString().split('T')[0]})`,
            deletedBy: 'SYSTEM_CRON',
            reason: 'RETENTION_POLICY_10Y',
            retentionDays: Math.floor((Date.now() - rechnung.deletedAt!.getTime()) / (1000 * 60 * 60 * 24)),
            metadata: {
              softDeletedAt: rechnung.deletedAt,
              softDeletedBy: rechnung.deletedBy,
              cronRunAt: new Date().toISOString(),
              retentionYears: RETENTION_YEARS,
            },
          },
        })
        
        // 2. Lösche zugehörige Daten (Positionen, Audit-Log, Versionen werden via Cascade gelöscht)
        await prisma.rechnung.delete({
          where: { id: rechnung.id },
        })
        
        deletionResults.push({ id: rechnung.id, nummer: rechnung.nummer, success: true })
        console.log(`[CRON cleanup-invoices-10y] Hard-deleted: ${rechnung.nummer}`)
        
      } catch (error: any) {
        console.error(`[CRON cleanup-invoices-10y] Error deleting ${rechnung.nummer}:`, error.message)
        deletionResults.push({ id: rechnung.id, nummer: rechnung.nummer, success: false, error: error.message })
      }
    }
    
    const successCount = deletionResults.filter(r => r.success).length
    const failCount = deletionResults.filter(r => !r.success).length
    
    console.log(`[CRON cleanup-invoices-10y] Completed: ${successCount} deleted, ${failCount} failed`)
    
    return NextResponse.json({
      ok: true,
      message: `10-Jahres-Retention-Cleanup abgeschlossen`,
      cutoffDate: cutoffDate.toISOString(),
      deletedCount: successCount,
      failedCount: failCount,
      results: deletionResults,
      durationMs: Date.now() - startTime,
    })
    
  } catch (error: any) {
    console.error('[CRON cleanup-invoices-10y] Fatal error:', error)
    return NextResponse.json({
      ok: false,
      error: error.message,
      durationMs: Date.now() - startTime,
    }, { status: 500 })
  }
}
