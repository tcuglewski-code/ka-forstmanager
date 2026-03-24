import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: gruppeId } = await params
  const { mitarbeiterId } = await req.json()
  await prisma.gruppeMitglied.delete({
    where: { gruppeId_mitarbeiterId: { gruppeId, mitarbeiterId } },
  })
  return NextResponse.json({ ok: true })
}
