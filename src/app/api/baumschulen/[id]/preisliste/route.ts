import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/baumschulen/[id]/preisliste — public Sortiment einer Baumschule (für WP Wizard)
export const GET = withErrorHandler(async (_: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id: baumschuleId } = await params

  const baumschule = await prisma.baumschule.findUnique({
    where: { id: baumschuleId },
    select: { id: true, name: true, ort: true, aktiv: true },
  })
  if (!baumschule || !baumschule.aktiv) {
    return NextResponse.json({ error: "Baumschule nicht gefunden" }, { status: 404 })
  }

  const preisliste = await prisma.baumschulPreisliste.findMany({
    where: { baumschuleId, aktiv: true, verfuegbar: true },
    select: {
      id: true,
      baumart: true,
      sorte: true,
      hkg: true,
      fovg: true,
      preis: true,
      preis_pro_100: true,
      einheit: true,
      menge: true,
      min_bestellung: true,
      saison: true,
      notizen: true,
    },
    orderBy: { baumart: "asc" },
  })

  return NextResponse.json({ baumschule, preisliste })
})
