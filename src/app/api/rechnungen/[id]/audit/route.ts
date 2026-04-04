import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/permissions"

/**
 * GET /api/rechnungen/[id]/audit
 * Sprint GB-01: Audit-Trail für Rechnungen abrufen (GoBD-Compliance)
 * Nur für Admins zugänglich
 */
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  
  try {
    const { id } = await params
    
    // Prüfe ob Rechnung existiert
    const rechnung = await prisma.rechnung.findUnique({
      where: { id },
      select: { id: true, nummer: true },
    })
    
    if (!rechnung) {
      return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 })
    }
    
    // Audit-Log abrufen, sortiert nach Datum (neueste zuerst)
    const auditLog = await prisma.rechnungAuditLog.findMany({
      where: { rechnungId: id },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({
      rechnungId: id,
      rechnungNummer: rechnung.nummer,
      entries: auditLog.map(entry => ({
        id: entry.id,
        action: entry.action,
        field: entry.field,
        oldValue: entry.oldValue ? JSON.parse(entry.oldValue) : null,
        newValue: entry.newValue ? JSON.parse(entry.newValue) : null,
        userId: entry.userId,
        userName: entry.userName,
        ip: entry.ip,
        userAgent: entry.userAgent,
        timestamp: entry.createdAt,
      })),
      totalEntries: auditLog.length,
    })
  } catch (error) {
    console.error("[RECHNUNG AUDIT GET]", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}
