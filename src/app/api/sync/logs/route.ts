import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Sync-Logs abrufen
export async function GET(req: NextRequest) {
  try {
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
export async function DELETE(req: NextRequest) {
  try {
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
