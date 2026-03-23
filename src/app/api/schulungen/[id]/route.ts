import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const schulung = await prisma.schulung.findUnique({
    where: { id },
    include: {
      teilnehmer: {
        include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true, rolle: true } } },
      },
    },
  })
  if (!schulung) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(schulung)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const schulung = await prisma.schulung.update({
    where: { id },
    data: {
      ...(body.titel && { titel: body.titel }),
      ...(body.typ && { typ: body.typ }),
      ...(body.beschreibung !== undefined && { beschreibung: body.beschreibung }),
      ...(body.datum && { datum: new Date(body.datum) }),
      ...(body.ort !== undefined && { ort: body.ort }),
      ...(body.maxTeilnehmer !== undefined && { maxTeilnehmer: body.maxTeilnehmer }),
      ...(body.status && { status: body.status }),
    },
  })
  return NextResponse.json(schulung)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.schulung.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
