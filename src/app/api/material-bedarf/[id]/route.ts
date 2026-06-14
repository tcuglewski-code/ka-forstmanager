/**
 * A2 — GET /api/material-bedarf/[id] (MAT-009) — Detail + Positionen + Lager-Abgleich.
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"
import { withErrorHandler } from "@/lib/api-handler"

export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminOrGF(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const bedarf = await prisma.materialBedarf.findUnique({
      where: { id },
      include: {
        positionen: { orderBy: { reihenfolge: "asc" } },
        bestellVorschlaege: true,
        angebot: { select: { id: true, nummer: true } },
        auftrag: { select: { id: true, nummer: true, titel: true } },
      },
    })

    if (!bedarf) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 })
    return NextResponse.json(bedarf)
  }
)
