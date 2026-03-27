// Sprint AO: Einzelner Wochenplan — GET/PATCH/DELETE

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id } = await params

  const wochenplan = await prisma.wochenplan.findUnique({
    where: { id },
    include: {
      gruppe: { select: { id: true, name: true } },
      positionen: {
        orderBy: [{ datum: "asc" }, { dienstleistungstyp: "asc" }],
      },
    },
  })

  if (!wochenplan) {
    return NextResponse.json({ error: "Wochenplan nicht gefunden" }, { status: 404 })
  }

  return NextResponse.json(wochenplan)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const aktualisiert = await prisma.wochenplan.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      gruppeId: body.gruppeId !== undefined ? (body.gruppeId ?? null) : undefined,
      notizen: body.notizen !== undefined ? (body.notizen ?? null) : undefined,
    },
    include: {
      gruppe: { select: { id: true, name: true } },
      positionen: true,
    },
  })

  return NextResponse.json(aktualisiert)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const { id } = await params

  await prisma.wochenplan.delete({ where: { id } })

  return NextResponse.json({ message: "Wochenplan gelöscht" })
}
