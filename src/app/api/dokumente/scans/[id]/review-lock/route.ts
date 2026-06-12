/**
 * Review-Lock (Sprint 4): verhindert, dass zwei Benutzer denselben Scan
 * gleichzeitig reviewen. Audit-basiert (kein Schema-Change):
 * POST registriert REVIEW_GESTARTET; antwortet mit Lock-Info, falls ein
 * ANDERER Benutzer in den letzten 10 Minuten den Review geöffnet hat.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const LOCK_MINUTEN = 10

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const userId = (session.user as { id?: string }).id || session.user.email || "unbekannt"

  const scan = await prisma.dokumentenScan.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  })
  if (!scan) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
  if (scan.status !== "REVIEW_ERFORDERLICH") {
    return NextResponse.json({ locked: false })
  }

  const grenze = new Date(Date.now() - LOCK_MINUTEN * 60 * 1000)
  const fremderLock = await prisma.dokumentenAudit.findFirst({
    where: {
      scanId: id,
      aktion: "REVIEW_GESTARTET",
      erstelltAm: { gte: grenze },
      userId: { not: userId },
      systemAktion: false,
    },
    orderBy: { erstelltAm: "desc" },
    select: { userId: true, erstelltAm: true },
  })

  // Eigenen Lock registrieren (höchstens 1× pro Lock-Fenster)
  const eigenerLock = await prisma.dokumentenAudit.findFirst({
    where: {
      scanId: id,
      aktion: "REVIEW_GESTARTET",
      erstelltAm: { gte: grenze },
      userId,
    },
    select: { id: true },
  })
  if (!eigenerLock) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
    await prisma.dokumentenAudit.create({
      data: {
        scanId: id,
        aktion: "REVIEW_GESTARTET",
        userId,
        ipAdresse: ip,
        details: { lockMinuten: LOCK_MINUTEN },
      },
    })
  }

  return NextResponse.json({
    locked: !!fremderLock,
    von: fremderLock?.userId ?? null,
    seit: fremderLock?.erstelltAm ?? null,
  })
}
