/**
 * A2 — GET /api/material-bedarf (MAT-008) — Liste der Materialbedarfe.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"

export const GET = withErrorHandler(async (_req: Request) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const liste = await prisma.materialBedarf.findMany({
    orderBy: { erstelltAm: "desc" },
    take: 100,
    include: {
      angebot: { select: { id: true, nummer: true } },
      auftrag: { select: { id: true, nummer: true, titel: true } },
      _count: { select: { positionen: true, bestellVorschlaege: true } },
    },
  })

  return NextResponse.json(liste)
})
