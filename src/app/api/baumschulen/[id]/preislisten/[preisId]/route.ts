// Sprint AI: Einzelne Preisliste bearbeiten / löschen

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"


// PATCH: Preisliste aktualisieren
export const PATCH = withErrorHandler(async (req: Request,
  { params }: { params: Promise<{ id: string; preisId: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId, preisId } = await params
  const body = await req.json()

  const eintrag = await prisma.baumschulPreisliste.findFirst({
    where: { id: preisId, baumschuleId },
  })
  if (!eintrag) {
    return NextResponse.json({ error: "Preiseintrag nicht gefunden" }, { status: 404 })
  }

  const aktualisiert = await prisma.baumschulPreisliste.update({
    where: { id: preisId },
    data: {
      baumart: body.baumart?.trim() ?? undefined,
      preis: body.preis != null ? parseFloat(body.preis) : undefined,
      einheit: body.einheit?.trim() ?? undefined,
      saison: body.saison !== undefined ? (body.saison?.trim() ?? null) : undefined,
      aktiv: body.aktiv !== undefined ? Boolean(body.aktiv) : undefined,
      notizen: body.notizen !== undefined ? (body.notizen?.trim() ?? null) : undefined,
    },
  })

  return NextResponse.json(aktualisiert)
})

// DELETE: Preisliste löschen
export const DELETE = withErrorHandler(async (_: Request,
  { params }: { params: Promise<{ id: string; preisId: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId, preisId } = await params

  const eintrag = await prisma.baumschulPreisliste.findFirst({
    where: { id: preisId, baumschuleId },
  })
  if (!eintrag) {
    return NextResponse.json({ error: "Preiseintrag nicht gefunden" }, { status: 404 })
  }

  await prisma.baumschulPreisliste.delete({ where: { id: preisId } })

  return NextResponse.json({ message: "Preiseintrag gelöscht" })
})
