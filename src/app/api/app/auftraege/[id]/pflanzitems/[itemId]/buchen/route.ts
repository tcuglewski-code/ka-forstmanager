import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { withErrorHandler } from "@/lib/api-handler"

// PATCH /api/app/auftraege/[id]/pflanzitems/[itemId]/buchen — Gruppenführer bucht Ist-Menge
export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: auftragId, itemId } = await params
  const body = await req.json()

  const istMenge = parseInt(body.istMenge)
  if (!Number.isFinite(istMenge) || istMenge < 0) {
    return NextResponse.json({ error: "istMenge muss eine positive Zahl sein" }, { status: 400 })
  }

  const item = await prisma.auftragPflanzItem.findUnique({ where: { id: itemId } })
  if (!item || item.auftragId !== auftragId) {
    return NextResponse.json({ error: "PflanzItem nicht gefunden" }, { status: 404 })
  }

  const updated = await prisma.auftragPflanzItem.update({
    where: { id: itemId },
    data: {
      istMenge,
      gebuchtAt: new Date(),
      gebuchtVon: typeof appUser.sub === "string" ? appUser.sub : null,
      notizen: body.notizen?.trim() ?? item.notizen,
    },
  })

  return NextResponse.json(updated)
})
