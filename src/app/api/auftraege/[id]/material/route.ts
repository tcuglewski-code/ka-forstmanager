import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getAppUser } from "@/lib/app-auth"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const appUser = await getAppUser(req)
  const session = await auth()
  if (!appUser && !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Dashboard (web session) expects raw LagerBewegung[] for the Materialzuweisung table.
  // App (Bearer JWT) expects transformed AuftragMaterial[] (geplant vs. verbraucht).
  // Same endpoint serves both consumers — branch on auth type.
  if (session) {
    const bewegungen = await prisma.lagerBewegung.findMany({
      where: { auftragId: id },
      include: {
        artikel: { select: { id: true, name: true, einheit: true } },
        mitarbeiter: { select: { id: true, vorname: true, nachname: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(bewegungen)
  }

  // App path: aggregate reservierungen + bewegungen → AuftragMaterial[]
  const [bewegungen, reservierungen] = await Promise.all([
    prisma.lagerBewegung.findMany({
      where: { auftragId: id },
      include: { artikel: { select: { id: true, name: true, einheit: true } } },
    }),
    prisma.lagerReservierung.findMany({
      where: { auftragId: id },
      include: { artikel: { select: { id: true, name: true, einheit: true } } },
    }),
  ])

  const materialMap = new Map<string, { geplant: number; verbraucht: number; name: string; einheit: string }>()
  for (const r of reservierungen) {
    const key = r.artikel?.id ?? r.artikelId
    const existing = materialMap.get(key) || { geplant: 0, verbraucht: 0, name: r.artikel?.name ?? "Unbekannt", einheit: r.artikel?.einheit ?? "Stk" }
    existing.geplant += r.menge ?? 0
    materialMap.set(key, existing)
  }
  for (const b of bewegungen) {
    if (b.typ !== "entnahme") continue
    const key = b.artikel?.id ?? b.artikelId
    const existing = materialMap.get(key) || { geplant: 0, verbraucht: 0, name: b.artikel?.name ?? "Unbekannt", einheit: b.artikel?.einheit ?? "Stk" }
    existing.verbraucht += Math.abs(b.menge ?? 0)
    materialMap.set(key, existing)
  }

  const auftragMaterial = Array.from(materialMap.entries()).map(([material_id, data]) => ({
    material_id: parseInt(material_id) || 0,
    material_name: data.name,
    einheit: data.einheit,
    geplant: data.geplant,
    verbraucht: data.verbraucht,
  }))

  return NextResponse.json(auftragMaterial)
})
