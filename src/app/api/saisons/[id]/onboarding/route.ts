import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"

export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const userRole = (session.user as any)?.role as string

  const schritte = await prisma.saisonOnboardingSchritt.findMany({
    where: { saisonId: id },
    orderBy: { reihenfolge: "asc" },
    include: {
      abschluesse: {
        include: {
          mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
        },
      },
    },
  })

  // Admins see full data, others see only their own
  if (["admin", "ka_admin"].includes(userRole)) {
    return NextResponse.json({ saisonId: id, schritte })
  }

  // Non-admin: strip other mitarbeiter data
  return NextResponse.json({
    saisonId: id,
    schritte: schritte.map((s) => ({
      ...s,
      abschluesse: s.abschluesse.length,
    })),
  })
})

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userRole = (session.user as any)?.role as string
  if (!["admin", "ka_admin"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const maxOrder = await prisma.saisonOnboardingSchritt.aggregate({
    where: { saisonId: id },
    _max: { reihenfolge: true },
  })

  const schritt = await prisma.saisonOnboardingSchritt.create({
    data: {
      saisonId: id,
      typ: body.typ ?? "bestaetigung",
      titel: body.titel,
      beschreibung: body.beschreibung ?? null,
      reihenfolge: (maxOrder._max.reihenfolge ?? 0) + 1,
      pflicht: body.pflicht ?? true,
      dokumentVorlageUrl: body.dokumentVorlageUrl ?? null,
      formularFelder: body.formularFelder ?? null,
    },
  })

  return NextResponse.json(schritt, { status: 201 })
})

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userRole = (session.user as any)?.role as string
  if (!["admin", "ka_admin"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const schrittId = body.schrittId as string
  if (!schrittId) return NextResponse.json({ error: "schrittId required" }, { status: 400 })

  await prisma.saisonOnboardingSchritt.delete({ where: { id: schrittId } })
  return NextResponse.json({ success: true })
})
