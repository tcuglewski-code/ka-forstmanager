import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: gruppeId } = await params
  const mitglieder = await prisma.gruppeMitglied.findMany({
    where: { gruppeId },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true, stundenlohn: true } } },
  })
  return NextResponse.json(mitglieder)
})

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: gruppeId } = await params
  const { mitarbeiterId, rolle } = await req.json()
  const mitglied = await prisma.gruppeMitglied.upsert({
    where: { gruppeId_mitarbeiterId: { gruppeId, mitarbeiterId } },
    create: { gruppeId, mitarbeiterId, rolle: rolle ?? "mitarbeiter" },
    update: { rolle: rolle ?? "mitarbeiter" },
  })
  return NextResponse.json(mitglied, { status: 201 })
})

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: gruppeId } = await params
  const { mitarbeiterId } = await req.json()
  await prisma.gruppeMitglied.delete({
    where: { gruppeId_mitarbeiterId: { gruppeId, mitarbeiterId } },
  })
  return NextResponse.json({ ok: true })
})
