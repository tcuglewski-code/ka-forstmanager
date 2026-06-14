import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { AufschlagBedingungSchema } from "@/lib/angebote/zod-schemas"

export const PATCH = withErrorHandler(async (req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  let bedingung = undefined
  if (body.bedingung !== undefined) {
    const parsed = AufschlagBedingungSchema.safeParse(body.bedingung)
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Bedingung" }, { status: 400 })
    bedingung = parsed.data
  }
  const data = await prisma.preisbuchAufschlag.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.typ !== undefined ? { typ: body.typ } : {}),
      ...(body.faktor !== undefined ? { faktor: Number(body.faktor) } : {}),
      ...(body.beschreibung !== undefined ? { beschreibung: body.beschreibung } : {}),
      ...(body.aktiv !== undefined ? { aktiv: Boolean(body.aktiv) } : {}),
      ...(body.reihenfolge !== undefined ? { reihenfolge: Number(body.reihenfolge) } : {}),
      ...(bedingung !== undefined ? { bedingung } : {}),
    },
  })
  return NextResponse.json(data)
})

export const DELETE = withErrorHandler(async (_req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  await prisma.preisbuchAufschlag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
