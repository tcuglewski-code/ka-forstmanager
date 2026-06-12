import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken, isAdminRole } from "@/lib/auth-helpers"

// GET: Sync-Logs abrufen
// AUDIT-FIX T-005: Auth + Admin-Check — Sync-Logs waren öffentlich lesbar (Informationsleck)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdminRole((user as { role?: string }).role)) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100")
    const entityType = req.nextUrl.searchParams.get("entityType")
    
    const where = entityType ? { entityType } : {}
    
    const logs = await prisma.syncLog.findMany({
      where,
      take: limit,
      orderBy: { timestamp: "desc" }
    })
    
    return NextResponse.json(logs)
  } catch (error) {
    console.error("Fehler beim Laden der Sync-Logs:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

// DELETE: Alte Logs löschen (älter als X Tage)
// AUDIT-FIX T-005: Auth + Admin-Check — Audit-Trail war ohne Login löschbar (Manipulation)
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyToken(req)
    if (!user || !isAdminRole((user as { role?: string }).role)) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const days = parseInt(req.nextUrl.searchParams.get("days") || "30")
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    
    const result = await prisma.syncLog.deleteMany({
      where: {
        timestamp: { lt: cutoff }
      }
    })
    
    return NextResponse.json({ 
      deleted: result.count,
      message: `${result.count} Logs älter als ${days} Tage gelöscht`
    })
  } catch (error) {
    console.error("Fehler beim Löschen:", error)
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 })
  }
}
