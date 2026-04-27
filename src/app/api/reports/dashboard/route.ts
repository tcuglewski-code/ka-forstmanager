import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  const user = await verifyToken(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const [
      offeneAuftraege,
      offeneAuftraegeWoche,
      aktiveSaison,
      gruppenAktiv,
      wartungenFaellig,
      qualiAblaufend,
      offeneAbnahmen,
      gesamtFlaeche,
    ] = await Promise.all([
      // Offene Auftraege gesamt
      prisma.auftrag.aggregate({
        where: { status: { in: ["anfrage", "geplant", "aktiv", "in_bearbeitung"] } },
        _count: { _all: true },
        _sum: { flaeche_ha: true },
      }),
      // Offene Auftraege diese Woche
      prisma.auftrag.aggregate({
        where: {
          status: { in: ["anfrage", "geplant", "aktiv", "in_bearbeitung"] },
          createdAt: { gte: startOfWeek, lte: endOfWeek },
        },
        _count: { _all: true },
        _sum: { flaeche_ha: true },
      }),
      // Aktive Saison
      prisma.saison.findFirst({
        where: { status: "aktiv" },
        select: { id: true, name: true, startDatum: true, endDatum: true, status: true },
        orderBy: { startDatum: "desc" },
      }).catch(() => null),
      // Gruppen mit Status aktiv
      prisma.gruppe.count({
        where: { status: "aktiv" },
      }).catch(() => 0),
      // Wartungen nicht erledigt (faellig = datum in Vergangenheit + nicht erledigt)
      prisma.wartung.count({
        where: { datum: { lte: now }, erledigt: false },
      }).catch(() => 0),
      // Qualifikationen ablaufend (30 Tage)
      prisma.mitarbeiterQualifikation.count({
        where: {
          ablaufDatum: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: now },
        },
      }).catch(() => 0),
      // Offene Abnahmen
      prisma.abnahme.aggregate({
        where: { status: { in: ["offen", "mängel"] } },
        _count: { _all: true },
      }).catch(() => ({ _count: { _all: 0 } })),
      // Gesamte Flaeche in Bearbeitung
      prisma.auftrag.aggregate({
        where: { status: { in: ["aktiv", "in_bearbeitung"] } },
        _sum: { flaeche_ha: true },
      }),
    ])

    return NextResponse.json({
      offene_auftraege: {
        anzahl: offeneAuftraege._count._all,
        flaeche_ha: offeneAuftraege._sum.flaeche_ha?.toFixed(1) ?? "0",
      },
      offene_auftraege_diese_woche: {
        anzahl: offeneAuftraegeWoche._count._all,
        flaeche_ha: offeneAuftraegeWoche._sum.flaeche_ha?.toFixed(1) ?? "0",
      },
      aktive_saison: aktiveSaison
        ? {
            id: aktiveSaison.id,
            name: aktiveSaison.name,
            start_datum: aktiveSaison.startDatum?.toISOString().split("T")[0] ?? "",
            end_datum: aktiveSaison.endDatum?.toISOString().split("T")[0] ?? null,
            status: aktiveSaison.status,
          }
        : null,
      aktive_gruppen_heute: gruppenAktiv,
      wartungen_faellig: wartungenFaellig,
      quali_ablaufend: qualiAblaufend,
      offene_abnahmen: {
        anzahl: offeneAbnahmen._count._all,
      },
      gesamte_flaeche_in_bearbeitung_ha: gesamtFlaeche._sum.flaeche_ha?.toFixed(1) ?? "0",
    })
  } catch (error) {
    console.error("[reports/dashboard] Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
