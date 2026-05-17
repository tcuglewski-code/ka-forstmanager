import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/app/auftraege/[id]/material
// Returns LagerBewegung records assigned to an Auftrag
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: auftragId } = await params

  const bewegungen = await prisma.lagerBewegung.findMany({
    where: { auftragId },
    include: {
      artikel: { select: { id: true, name: true, einheit: true } },
      mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const material = bewegungen.map(b => ({
    id: b.id,
    datum: b.createdAt,
    artikel_name: b.artikel.name,
    einheit: b.artikel.einheit,
    menge: b.menge,
    typ: b.typ,
    mitarbeiter: b.mitarbeiter ? b.mitarbeiter.vorname + ' ' + b.mitarbeiter.nachname : null,
  }))

  return NextResponse.json(material)
})
