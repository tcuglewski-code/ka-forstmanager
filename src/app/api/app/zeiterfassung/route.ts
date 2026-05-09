import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

const ACTIVE_TYPE = "stempeluhr_aktiv"

/**
 * GET /api/app/zeiterfassung
 * Check if there's an active time tracking session
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mitarbeiterId = appUser.mitarbeiterId as string | null
  if (!mitarbeiterId) return NextResponse.json({ error: "No mitarbeiter profile" }, { status: 400 })

  const activeSession = await prisma.stundeneintrag.findFirst({
    where: {
      mitarbeiterId,
      typ: ACTIVE_TYPE,
    },
    orderBy: { createdAt: "desc" },
  })

  if (activeSession) {
    const startTime = activeSession.createdAt
    const now = new Date()
    const elapsedMs = now.getTime() - startTime.getTime()
    const elapsedHours = elapsedMs / (1000 * 60 * 60)

    return NextResponse.json({
      active: true,
      sessionId: activeSession.id,
      startTime: startTime.toISOString(),
      elapsedHours: Math.round(elapsedHours * 100) / 100,
      auftragId: activeSession.auftragId,
    })
  }

  return NextResponse.json({ active: false })
})

/**
 * POST /api/app/zeiterfassung
 * Start or stop time tracking
 *
 * Body: { action: "start" | "stop", auftragId?: string, notiz?: string }
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mitarbeiterId = appUser.mitarbeiterId as string | null
  if (!mitarbeiterId) return NextResponse.json({ error: "No mitarbeiter profile" }, { status: 400 })

  const body = await req.json()
  const { action, auftragId, notiz } = body

  if (action === "start") {
    // Check if already active
    const existing = await prisma.stundeneintrag.findFirst({
      where: { mitarbeiterId, typ: ACTIVE_TYPE },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Bereits eingestempelt", sessionId: existing.id },
        { status: 409 }
      )
    }

    // Create new active session
    const session = await prisma.stundeneintrag.create({
      data: {
        mitarbeiterId,
        datum: new Date(),
        stunden: 0, // Will be calculated on stop
        typ: ACTIVE_TYPE,
        auftragId: auftragId ?? null,
        notiz: notiz ?? null,
        genehmigt: false,
      },
    })

    return NextResponse.json({
      success: true,
      action: "started",
      sessionId: session.id,
      startTime: session.createdAt.toISOString(),
    }, { status: 201 })
  }

  if (action === "stop") {
    // Find active session
    const activeSession = await prisma.stundeneintrag.findFirst({
      where: { mitarbeiterId, typ: ACTIVE_TYPE },
      orderBy: { createdAt: "desc" },
    })

    if (!activeSession) {
      return NextResponse.json({ error: "Keine aktive Stempeluhr" }, { status: 404 })
    }

    // Calculate hours
    const startTime = activeSession.createdAt
    const endTime = new Date()
    const elapsedMs = endTime.getTime() - startTime.getTime()
    const elapsedHours = elapsedMs / (1000 * 60 * 60)
    const roundedHours = Math.round(elapsedHours * 4) / 4 // Round to 15min

    // Update the entry to completed
    const updated = await prisma.stundeneintrag.update({
      where: { id: activeSession.id },
      data: {
        typ: "arbeit",
        stunden: roundedHours,
        notiz: notiz ?? activeSession.notiz,
        auftragId: auftragId ?? activeSession.auftragId,
      },
    })

    return NextResponse.json({
      success: true,
      action: "stopped",
      sessionId: updated.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      stunden: roundedHours,
    })
  }

  return NextResponse.json({ error: "Invalid action. Use 'start' or 'stop'" }, { status: 400 })
})
