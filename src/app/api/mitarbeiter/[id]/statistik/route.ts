import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const url = new URL(req.url)
  const saisonId = url.searchParams.get("saisonId")

  // Stundeneintrag hat keine direkte Saison-Relation → erst Auftrags-IDs laden
  let auftragIdFilter: { in: string[] } | undefined
  if (saisonId) {
    const auftraege = await prisma.auftrag.findMany({
      where: { saisonId },
      select: { id: true },
    })
    auftragIdFilter = { in: auftraege.map((a) => a.id) }
  }

  const stundenWhere = {
    mitarbeiterId: id,
    ...(auftragIdFilter ? { auftragId: auftragIdFilter } : {}),
  }

  const [stunden, vorschuesse, abrechnungen] = await Promise.all([
    prisma.stundeneintrag.findMany({ where: stundenWhere }),
    prisma.vorschuss.findMany({ where: { mitarbeiterId: id } }),
    prisma.lohnabrechnung.findMany({
      where: { mitarbeiterId: id, ...(saisonId ? { saisonId } : {}) },
    }),
  ])

  const gesamtStunden = stunden.reduce((s, e) => s + (e.stunden ?? 0), 0)
  const maschinenStunden = stunden
    .filter((e) => (e.maschinenzuschlag ?? 0) > 0)
    .reduce((s, e) => s + (e.stunden ?? 0), 0)
  const vorschussGesamt = vorschuesse.reduce((s, v) => s + (v.betrag ?? 0), 0)

  // Nach Typ gruppieren
  const nachTyp: Record<string, number> = {}
  for (const e of stunden) {
    const typ = e.typ ?? "arbeit"
    nachTyp[typ] = (nachTyp[typ] ?? 0) + (e.stunden ?? 0)
  }

  return NextResponse.json({
    gesamtStunden,
    maschinenStunden,
    arbeitsTage: new Set(stunden.map((e) => e.datum?.toISOString().slice(0, 10))).size,
    vorschussGesamt,
    abrechnungenAnzahl: abrechnungen.length,
    nachTyp,
  })
}
