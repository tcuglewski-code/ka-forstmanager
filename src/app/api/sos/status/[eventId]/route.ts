import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// ============================================================
// SOS Status API — Sprint JJ (SOS-02+04)
// Gibt den Status eines einzelnen SOS-Events zurück
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { eventId } = await params

  const sosEvent = await prisma.sOSEvent.findUnique({
    where: { eventId },
  })

  if (!sosEvent) {
    return NextResponse.json({ error: "SOS-Event nicht gefunden" }, { status: 404 })
  }

  return NextResponse.json(sosEvent)
}

// PATCH: Status aktualisieren (z.B. acknowledged)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { eventId } = await params
  const body = await req.json()

  const sosEvent = await prisma.sOSEvent.findUnique({
    where: { eventId },
  })

  if (!sosEvent) {
    return NextResponse.json({ error: "SOS-Event nicht gefunden" }, { status: 404 })
  }

  const updateData: any = {}

  if (body.status === "acknowledged") {
    updateData.status = "acknowledged"
    updateData.acknowledgedAt = new Date()
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Keine gültigen Felder zum Aktualisieren" }, { status: 400 })
  }

  const updated = await prisma.sOSEvent.update({
    where: { eventId },
    data: updateData,
  })

  return NextResponse.json(updated)
}
