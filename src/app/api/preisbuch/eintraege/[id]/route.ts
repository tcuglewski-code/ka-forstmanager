import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"
import { PreisbuchMetadatenSchema } from "@/lib/angebote/zod-schemas"

export const PATCH = withErrorHandler(async (req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  let metadatenJson = undefined
  if (body.metadatenJson !== undefined) {
    const parsed = PreisbuchMetadatenSchema.safeParse(body.metadatenJson)
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Metadaten" }, { status: 400 })
    metadatenJson = parsed.data
  }

  const data = await prisma.preisbuchEintrag.update({
    where: { id },
    data: {
      ...(body.bezeichnung !== undefined ? { bezeichnung: String(body.bezeichnung) } : {}),
      ...(body.einheit !== undefined ? { einheit: body.einheit } : {}),
      ...(body.basispreis !== undefined ? { basispreis: Number(body.basispreis) } : {}),
      ...(body.mwstSatz !== undefined ? { mwstSatz: Number(body.mwstSatz) } : {}),
      ...(body.beschreibung !== undefined ? { beschreibung: body.beschreibung } : {}),
      ...(body.lieferantTyp !== undefined ? { lieferantTyp: body.lieferantTyp } : {}),
      ...(body.gueltigVon !== undefined ? { gueltigVon: body.gueltigVon ? new Date(body.gueltigVon) : null } : {}),
      ...(body.gueltigBis !== undefined ? { gueltigBis: body.gueltigBis ? new Date(body.gueltigBis) : null } : {}),
      ...(body.reihenfolge !== undefined ? { reihenfolge: Number(body.reihenfolge) } : {}),
      ...(body.aktiv !== undefined ? { aktiv: Boolean(body.aktiv) } : {}),
      ...(metadatenJson !== undefined ? { metadatenJson } : {}),
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
  await prisma.preisbuchEintrag.update({ where: { id }, data: { aktiv: false } })
  return NextResponse.json({ ok: true })
})
