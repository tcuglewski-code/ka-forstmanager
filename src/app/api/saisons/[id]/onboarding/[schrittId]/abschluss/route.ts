import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getAppUser } from "@/lib/app-auth"
import { withErrorHandler } from "@/lib/api-handler"

// POST: MA reicht Abschluss ein
export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string; schrittId: string }> }) => {
  // Support both app and session auth
  const appUser = await getAppUser(req)
  const session = await auth()
  if (!appUser && !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { schrittId } = await params
  const body = await req.json()

  let mitarbeiterId: string
  if (appUser) {
    mitarbeiterId = (appUser as any).mitarbeiterId
    if (!mitarbeiterId) return NextResponse.json({ error: "Kein Mitarbeiter-Profil" }, { status: 403 })
  } else {
    mitarbeiterId = body.mitarbeiterId
    if (!mitarbeiterId) return NextResponse.json({ error: "mitarbeiterId required" }, { status: 400 })
  }

  const abschluss = await prisma.saisonOnboardingAbschluss.upsert({
    where: { schrittId_mitarbeiterId: { schrittId, mitarbeiterId } },
    update: {
      status: "eingereicht",
      antwortDaten: body.antwortDaten ?? null,
      eingereichtAm: new Date(),
    },
    create: {
      schrittId,
      mitarbeiterId,
      status: "eingereicht",
      antwortDaten: body.antwortDaten ?? null,
      eingereichtAm: new Date(),
    },
  })

  return NextResponse.json(abschluss, { status: 201 })
})

// PATCH: Admin genehmigt/lehnt ab
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string; schrittId: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userRole = (session.user as any)?.role as string
  if (!["admin", "ka_admin"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { schrittId } = await params
  const body = await req.json()
  const { mitarbeiterId, status, kommentar } = body as {
    mitarbeiterId: string
    status: "genehmigt" | "abgelehnt"
    kommentar?: string
  }

  if (!mitarbeiterId || !status) {
    return NextResponse.json({ error: "mitarbeiterId and status required" }, { status: 400 })
  }

  const abschluss = await prisma.saisonOnboardingAbschluss.update({
    where: { schrittId_mitarbeiterId: { schrittId, mitarbeiterId } },
    data: {
      status,
      genehmigungsKommentar: kommentar ?? null,
    },
  })

  return NextResponse.json(abschluss)
})
