import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const teilnehmer = await prisma.mitarbeiterSchulung.findMany({
    where: { schulungId: id },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
  })
  return NextResponse.json(teilnehmer)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: schulungId } = await params
  const body = await req.json()
  // Handle "abschliessen" action
  if (body.action === "abschliessen") {
    await prisma.mitarbeiterSchulung.updateMany({
      where: { schulungId, status: "angemeldet" },
      data: { status: "abgeschlossen", abgeschlossenAm: new Date() },
    })
    await prisma.schulung.update({ where: { id: schulungId }, data: { status: "abgeschlossen" } })
    return NextResponse.json({ ok: true })
  }
  // Add participant
  const entry = await prisma.mitarbeiterSchulung.upsert({
    where: { mitarbeiterId_schulungId: { mitarbeiterId: body.mitarbeiterId, schulungId } },
    create: { mitarbeiterId: body.mitarbeiterId, schulungId, status: "angemeldet" },
    update: { status: body.status ?? "angemeldet" },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
  })
  return NextResponse.json(entry, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: schulungId } = await params
  const { searchParams } = new URL(req.url)
  const mitarbeiterId = searchParams.get("mitarbeiterId")
  if (!mitarbeiterId) return NextResponse.json({ error: "mitarbeiterId required" }, { status: 400 })
  await prisma.mitarbeiterSchulung.delete({
    where: { mitarbeiterId_schulungId: { mitarbeiterId, schulungId } },
  })
  return NextResponse.json({ ok: true })
}
