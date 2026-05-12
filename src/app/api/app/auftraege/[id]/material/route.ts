import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/app/auftraege/[id]/material
// Returns materials assigned to an Auftrag with planned vs consumed amounts
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: auftragId } = await params

  // Get all LagerReservierungen for this Auftrag
  const reservierungen = await prisma.lagerReservierung.findMany({
    where: { auftragId },
    include: {
      artikel: {
        select: {
          id: true,
          name: true,
          einheit: true,
        },
      },
    },
  })

  // Get consumed amounts from LagerBewegung
  const verbrauch = await prisma.lagerBewegung.groupBy({
    by: ['artikelId'],
    where: {
      auftragId,
      typ: 'VERBRAUCH',
    },
    _sum: {
      menge: true,
    },
  })

  const verbrauchMap = new Map(
    verbrauch.map(v => [v.artikelId, v._sum.menge ?? 0])
  )

  // Map to response format expected by app
  // Artikel-IDs sind CUIDs (Strings) — kein parseInt, das würde NaN erzeugen
  const material = reservierungen.map(r => ({
    material_id: r.artikel.id,
    material_name: r.artikel.name,
    einheit: r.artikel.einheit,
    geplant: r.menge,
    verbraucht: verbrauchMap.get(r.artikelId) ?? 0,
  }))

  return NextResponse.json(material)
})
