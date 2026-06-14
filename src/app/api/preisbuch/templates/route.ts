import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { TemplatePositionenSchema, TemplateBerechnungsLogikSchema } from "@/lib/angebote/zod-schemas"

export const GET = withErrorHandler(async (_req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await prisma.kalkulationsTemplate.findMany({ orderBy: { reihenfolge: "asc" } })
  return NextResponse.json(data)
})

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.name || !body.leistungsTyp) {
    return NextResponse.json({ error: "name, leistungsTyp erforderlich" }, { status: 400 })
  }
  const positionen = TemplatePositionenSchema.safeParse(body.positionenJson ?? [])
  if (!positionen.success) return NextResponse.json({ error: "Ungültige Positionen" }, { status: 400 })
  const logik = TemplateBerechnungsLogikSchema.safeParse(body.berechnungsLogikJson ?? {})
  if (!logik.success) return NextResponse.json({ error: "Ungültige Berechnungslogik" }, { status: 400 })

  const data = await prisma.kalkulationsTemplate.create({
    data: {
      name: String(body.name),
      beschreibung: body.beschreibung ?? null,
      leistungsTyp: String(body.leistungsTyp),
      positionenJson: positionen.data,
      berechnungsLogikJson: logik.data,
      reihenfolge: body.reihenfolge != null ? Number(body.reihenfolge) : 0,
    },
  })
  return NextResponse.json(data, { status: 201 })
})

// PATCH per Query-Param ?id= zum Aktivieren/Deaktivieren
export const PATCH = withErrorHandler(async (req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: "id erforderlich" }, { status: 400 })
  const data = await prisma.kalkulationsTemplate.update({
    where: { id: body.id },
    data: { ...(body.aktiv !== undefined ? { aktiv: Boolean(body.aktiv) } : {}) },
  })
  return NextResponse.json(data)
})
