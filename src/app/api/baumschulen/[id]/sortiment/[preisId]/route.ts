import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withErrorHandler } from "@/lib/api-handler"


// PATCH: Sortiment-Eintrag aktualisieren
export const PATCH = withErrorHandler(async (req: Request,
  { params }: { params: Promise<{ id: string; preisId: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId, preisId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true, userId: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const userRole = (session.user as any).role
  if (userRole === "baumschule" && baumschule.userId !== session.user.id) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const eintrag = await prisma.baumschulPreisliste.findFirst({
    where: { id: preisId, baumschuleId },
  })
  if (!eintrag) {
    return NextResponse.json({ error: "Sortiment-Eintrag nicht gefunden" }, { status: 404 })
  }

  const body = await req.json()

  const aktualisiert = await prisma.baumschulPreisliste.update({
    where: { id: preisId },
    data: {
      baumart: body.baumart?.trim() ?? undefined,
      preis: body.preis != null ? parseFloat(body.preis) : undefined,
      einheit: body.einheit?.trim() ?? undefined,
      saison: body.saison !== undefined ? (body.saison?.trim() ?? null) : undefined,
      aktiv: body.aktiv !== undefined ? Boolean(body.aktiv) : undefined,
      notizen: body.notizen !== undefined ? (body.notizen?.trim() ?? null) : undefined,
      menge: body.menge !== undefined ? (body.menge != null ? parseInt(body.menge) : null) : undefined,
      verfuegbar: body.verfuegbar !== undefined ? Boolean(body.verfuegbar) : undefined,
      sorte: body.sorte !== undefined ? (body.sorte?.trim() || null) : undefined,
      hkg: body.hkg !== undefined ? (body.hkg?.trim() || null) : undefined,
      fovg: body.fovg !== undefined ? Boolean(body.fovg) : undefined,
      preis_pro_100: body.preis_pro_100 !== undefined
        ? (body.preis_pro_100 != null && body.preis_pro_100 !== "" ? parseFloat(body.preis_pro_100) : null)
        : undefined,
      min_bestellung: body.min_bestellung !== undefined
        ? (body.min_bestellung != null && body.min_bestellung !== "" ? parseInt(body.min_bestellung) : null)
        : undefined,
    },
  })

  return NextResponse.json(aktualisiert)
})

// DELETE: Sortiment-Eintrag löschen
export const DELETE = withErrorHandler(async (_: Request,
  { params }: { params: Promise<{ id: string; preisId: string }> }) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const { id: baumschuleId, preisId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true, userId: true },
  })
  if (!baumschule) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const userRole = (session.user as any).role
  if (userRole === "baumschule" && baumschule.userId !== session.user.id) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  const eintrag = await prisma.baumschulPreisliste.findFirst({
    where: { id: preisId, baumschuleId },
  })
  if (!eintrag) {
    return NextResponse.json({ error: "Sortiment-Eintrag nicht gefunden" }, { status: 404 })
  }

  await prisma.baumschulPreisliste.delete({ where: { id: preisId } })

  return NextResponse.json({ message: "Sortiment-Eintrag gelöscht" })
})
