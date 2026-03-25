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

  // Bug B3: Mitarbeiter korrekt zählen — über Gruppen-Mitgliedschaften in dieser Saison
  // (nicht über SaisonAnmeldungen die oft leer sind)
  const mitarbeiterCount = await prisma.mitarbeiter.count({
    where: {
      OR: [
        {
          // Mitarbeiter die einer Gruppe in dieser Saison angehören
          gruppen: {
            some: {
              gruppe: { saisonId }
            }
          }
        },
        {
          // Mitarbeiter die über SaisonAnmeldung registriert sind
          saisonAnmeldungen: {
            some: { saisonId, status: "bestaetigt" }
          }
        }
      ]
    }
  })

  const gepflanzt = protokolle.reduce((s, p) => s + (p.gepflanzt ?? 0), 0)
  const flaeche = auftraege.reduce((s, a) => s + (a.flaeche_ha ?? 0), 0)
  return NextResponse.json({
    saison,
    stats: {
      auftraege: auftraege.length,
      gepflanzt,
      flaeche: flaeche.toFixed(2),
      gruppen: gruppen.length,
      mitarbeiter: mitarbeiterCount,
      protokolle: protokolle.length,
    },
    auftraege,
    gruppen,
  })
}
