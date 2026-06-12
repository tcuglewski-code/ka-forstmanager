import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { wpSyncEngine } from "@/lib/sync/wp-sync"
import { verifyToken, isAdminRole } from "@/lib/auth-helpers"

// GET: Sync-Status abrufen
// AUDIT-FIX T-006: Auth + Admin-Check — Sync-Status/Fehlerquoten waren öffentlich lesbar
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdminRole((user as { role?: string }).role)) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

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
    const { action, auftragId, type, data } = body

    // Bug-Reports vom WP-Widget an Mission Control weiterleiten
    if (type === "wizard_bug_report" && data) {
      const mcApiKey = process.env.MC_API_KEY
      const mcUrl = "https://mission-control-tawny-omega.vercel.app/api/debug-reports"
      if (!mcApiKey) {
        console.error("[sync/wp] MC_API_KEY env not set")
        return NextResponse.json({ error: "Forwarding not configured" }, { status: 500 })
      }
      const truncate = (s: unknown, n: number) =>
        typeof s === "string" ? s.slice(0, n) : ""
      const wizard = truncate(data.wizard, 100)
      const message = truncate(data.message, 5000)
      const title = `WP-Wizard Bug: ${wizard} (Step ${data.step ?? "?"})`
      const payload = {
        productKey: "wp-website",
        productName: "Koch Aufforstung Website",
        type: "bug",
        severity: "mittel",
        title,
        description: message || "(kein Text)",
        route: wizard || null,
        browserInfo: {
          url: data.url || null,
          userAgent: data.ua || null,
          timestamp: data.timestamp || null,
        },
        environment: "production",
      }
      const mcResp = await fetch(mcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mcApiKey}`,
        },
        body: JSON.stringify(payload),
      })
      const mcBody = await mcResp.json().catch(() => ({}))
      if (!mcResp.ok) {
        console.error("[sync/wp] MC forwarding failed", mcResp.status, mcBody)
        return NextResponse.json(
          { error: "Forwarding failed", status: mcResp.status, mc: mcBody },
          { status: 502 }
        )
      }
      return NextResponse.json({ ok: true, debugReportId: mcBody.id })
    }

    // AUDIT-FIX T-006: Sync-Aktionen (sync_all/sync_one/pull) nur für Admins —
    // der wizard_bug_report-Pfad oben bleibt bewusst offen (öffentliches WP-Widget, nur Forwarding)
    const user = await verifyToken(req)
    if (!user || !isAdminRole((user as { role?: string }).role)) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

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
