/**
 * POST /api/zeiterfassung/stop — Stempeluhr Ausstempeln (App-Alias)
 * Body: { user_id?: string, session_id?: string, timestamp?: number, pausen_minuten?: number, notiz?: string }
 * Response: { success: true, stunden: number }
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"

const ACTIVE_TYPE = "stempeluhr_aktiv"

export async function POST(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mitarbeiterId = appUser.mitarbeiterId as string | null
  if (!mitarbeiterId) return NextResponse.json({ error: "No mitarbeiter profile" }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const { session_id, pausen_minuten, notiz } = body as {
    session_id?: string
    pausen_minuten?: number
    notiz?: string
  }

  // Find active session by ID or latest
  const where: { mitarbeiterId: string; typ: string; id?: string } = {
    mitarbeiterId,
    typ: ACTIVE_TYPE,
  }
  if (session_id && !session_id.startsWith("local_")) {
    where.id = session_id
  }

  const activeSession = await prisma.stundeneintrag.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  })

  if (!activeSession) {
    return NextResponse.json({ error: "Keine aktive Stempeluhr" }, { status: 404 })
  }

  const startTime = activeSession.createdAt
  const endTime = new Date()
  const elapsedMs = endTime.getTime() - startTime.getTime()
  const pauseMs = (pausen_minuten ?? 0) * 60_000
  const elapsedHours = Math.max(0, (elapsedMs - pauseMs) / (1000 * 60 * 60))
  const roundedHours = Math.round(elapsedHours * 4) / 4

  const updated = await prisma.stundeneintrag.update({
    where: { id: activeSession.id },
    data: {
      typ: "arbeit",
      stunden: roundedHours,
      notiz: notiz ?? activeSession.notiz,
    },
  })

  return NextResponse.json({
    success: true,
    session_id: updated.id,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    stunden: roundedHours,
    pausen_minuten: pausen_minuten ?? 0,
  })
}
