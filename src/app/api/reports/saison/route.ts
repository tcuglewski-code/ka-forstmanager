import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const saisonId = searchParams.get("saisonId")
  if (!saisonId) {
    const saisons = await prisma.saison.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json({ saisons })
  }
  const saison = await prisma.saison.findUnique({ where: { id: saisonId } })
  if (!saison) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const auftraege = await prisma.auftrag.findMany({ where: { saisonId } })
  const protokolle = await prisma.tagesprotokoll.findMany({ where: { auftrag: { saisonId } } })
  const gruppen = await prisma.gruppe.findMany({ where: { saisonId }, include: { mitglieder: true } })
  const anmeldungen = await prisma.saisonAnmeldung.count({ where: { saisonId, status: "bestaetigt" } })
  const gepflanzt = protokolle.reduce((s, p) => s + (p.gepflanzt ?? 0), 0)
  const flaeche = auftraege.reduce((s, a) => s + (a.flaeche_ha ?? 0), 0)
  return NextResponse.json({
    saison,
    stats: {
      auftraege: auftraege.length,
      gepflanzt,
      flaeche: flaeche.toFixed(2),
      gruppen: gruppen.length,
      mitarbeiter: anmeldungen,
      protokolle: protokolle.length,
    },
    auftraege,
    gruppen,
  })
}
