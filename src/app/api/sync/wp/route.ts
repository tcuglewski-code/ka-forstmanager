import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { wpSyncEngine } from "@/lib/sync/wp-sync"

// GET: Sync-Status abrufen
export async function GET() {
  try {
    // Aufträge mit ausstehenden lokalen Änderungen
    const pendingSync = await prisma.auftrag.count({
      where: {
        wpProjektId: { not: null },
        syncStatus: "local_changes"
      }
    })
    
    // Letzte Sync-Logs
    const recentLogs = await prisma.syncLog.findMany({
      take: 5,
      orderBy: { timestamp: "desc" }
    })
    
    // Fehlerquote der letzten 24h
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const [total, errors] = await Promise.all([
      prisma.syncLog.count({
        where: { timestamp: { gte: yesterday } }
      }),
      prisma.syncLog.count({
        where: { 
          timestamp: { gte: yesterday },
          status: "ERROR"
        }
      })
    ])
    
    return NextResponse.json({
      pendingSync,
      errorRate: total > 0 ? (errors / total * 100).toFixed(1) : "0",
      recentLogs,
      lastSync: recentLogs[0]?.timestamp || null
    })
  } catch (error) {
    console.error("Fehler beim Status-Abruf:", error)
    return NextResponse.json({ error: "Fehler" }, { status: 500 })
  }
}

// POST: Sync auslösen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, auftragId } = body
    
    if (action === "sync_all") {
      // Alle Aufträge synchronisieren
      const results = await wpSyncEngine.syncAlle()
      
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      return NextResponse.json({
        synced: successful,
        failed,
        results
      })
    }
    
    if (action === "sync_one" && auftragId) {
      // Einzelnen Auftrag synchronisieren
      const result = await wpSyncEngine.syncAuftrag(auftragId)
      
      return NextResponse.json(result)
    }
    
    if (action === "pull" && body.wpId) {
      // Von WordPress holen
      await wpSyncEngine.pullFromWP(body.wpId)
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 })
  } catch (error) {
    console.error("Sync-Fehler:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
