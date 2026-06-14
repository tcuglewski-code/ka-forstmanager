import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"

export const PATCH = withErrorHandler(async (req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const data = await prisma.preisbuchKategorie.update({
    where: { id },
    data: {
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.beschreibung !== undefined ? { beschreibung: body.beschreibung } : {}),
      ...(body.reihenfolge !== undefined ? { reihenfolge: Number(body.reihenfolge) } : {}),
      ...(body.aktiv !== undefined ? { aktiv: Boolean(body.aktiv) } : {}),
    },
  })
  return NextResponse.json(data)
})

// DELETE: soft-deaktivieren statt löschen (Referenzen schützen)
export const DELETE = withErrorHandler(async (_req: Request,
  { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  await prisma.preisbuchKategorie.update({ where: { id }, data: { aktiv: false } })
  return NextResponse.json({ ok: true })
})
