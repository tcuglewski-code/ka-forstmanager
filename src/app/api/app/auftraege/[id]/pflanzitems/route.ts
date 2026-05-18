import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/app/auftraege/[id]/pflanzitems
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: auftragId } = await params

  const items = await prisma.auftragPflanzItem.findMany({
    where: { auftragId },
    include: {
      preisliste: {
        select: {
          id: true,
          baumschuleId: true,
          baumschule: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(items)
})

// POST /api/app/auftraege/[id]/pflanzitems — neues PflanzItem anlegen (Soll-Menge)
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: auftragId } = await params
  const body = await req.json()

  const baumart = (body.baumart ?? "").trim()
  if (!baumart) {
    return NextResponse.json({ error: "baumart Pflichtfeld" }, { status: 400 })
  }

  const sollMenge = Number.isFinite(parseInt(body.sollMenge)) ? parseInt(body.sollMenge) : 0
  const istMenge = Number.isFinite(parseInt(body.istMenge)) ? parseInt(body.istMenge) : 0

  const auftrag = await prisma.auftrag.findUnique({ where: { id: auftragId }, select: { id: true } })
  if (!auftrag) return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 })

  const item = await prisma.auftragPflanzItem.create({
    data: {
      auftragId,
      baumart,
      sorte: body.sorte?.trim() ?? null,
      hkg: body.hkg?.trim() ?? null,
      fovg: body.fovg === true,
      sollMenge,
      istMenge,
      preisProStk: body.preisProStk != null ? parseFloat(body.preisProStk) : null,
      preislisteId: body.preislisteId ?? null,
      notizen: body.notizen?.trim() ?? null,
    },
  })

  return NextResponse.json(item, { status: 201 })
})
