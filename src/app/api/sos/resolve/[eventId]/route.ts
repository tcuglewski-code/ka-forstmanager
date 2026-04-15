import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


// ============================================================
// SOS Resolve API — Sprint JJ (SOS-02+04)
// Markiert ein SOS-Event als aufgelöst
// ============================================================

interface ResolveRequest {
  resolvedBy?: string
  resolvedAt?: string
  notes?: string
  resolutionNotes?: string // Alternative field name
}

export const POST = withErrorHandler(async (req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }) => {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { eventId } = await params
  const body: ResolveRequest = await req.json()

  // Use session user as resolvedBy fallback
  const resolvedBy = body.resolvedBy || (session.user as any)?.name || (session.user as any)?.email || "System"
  const resolutionNotes = body.notes || body.resolutionNotes || null

  const sosEvent = await prisma.sOSEvent.findUnique({
    where: { eventId },
  })

  if (!sosEvent) {
    return NextResponse.json({ error: "SOS-Event nicht gefunden" }, { status: 404 })
  }

  if (sosEvent.status === "resolved") {
    return NextResponse.json({ error: "SOS-Event bereits aufgelöst" }, { status: 400 })
  }

  const updated = await prisma.sOSEvent.update({
    where: { eventId },
    data: {
      status: "resolved",
      resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : new Date(),
      resolvedBy,
      resolutionNotes,
    },
  })

  console.log(`[SOS] Event ${eventId} aufgelöst von ${resolvedBy}`)

  return NextResponse.json({
    success: true,
    event: updated,
  })
})
