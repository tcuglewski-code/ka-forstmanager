import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"


export const GET = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const mitarbeiterId = appUser.mitarbeiterId as string | null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isGF = role === "ka_gruppenführer" || role === "ka_gruppenfuehrer" || role === "gruppenfuehrer" || role === "gruppenführer"
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"

  let auftraege
  if (isAdmin) {
    // Admin: alle Aufträge (offen + in_arbeit + bereit etc., aber nicht abgeschlossen)
    auftraege = await prisma.auftrag.findMany({
      where: { status: { notIn: ["abgeschlossen"] } },
      include: { saison: { select: { id: true, name: true } }, gruppe: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    })
  } else if (mitarbeiterId && isGF) {
    // GF: Gruppen wo sie Gruppenführer sind + Gruppen wo sie Mitglied sind
    const [leadGruppen, memberGruppen] = await Promise.all([
      prisma.gruppe.findMany({ where: { gruppenfuehrerId: mitarbeiterId }, select: { id: true } }),
      prisma.gruppeMitglied.findMany({ where: { mitarbeiterId }, select: { gruppeId: true } }),
    ])
    const gruppenIds = Array.from(new Set<string>([
      ...leadGruppen.map((g: { id: string }) => g.id),
      ...memberGruppen.map((g: { gruppeId: string }) => g.gruppeId),
    ]))
    auftraege = await prisma.auftrag.findMany({
      where: { gruppeId: { in: gruppenIds }, status: { notIn: ["abgeschlossen"] } },
      include: { saison: { select: { id: true, name: true } }, gruppe: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    })
  } else if (mitarbeiterId) {
    // MA: alle Aufträge der eigenen Gruppen, die noch nicht abgeschlossen sind
    // Bewusst KEIN strikter status-Filter auf ['aktiv','geplant'] —
    // MA sollen auch 'offen', 'in_arbeit', 'bereit', 'pausiert', 'nacharbeit' sehen.
    const memberGruppen = await prisma.gruppeMitglied.findMany({
      where: { mitarbeiterId },
      select: { gruppeId: true },
    })
    const gruppenIds = memberGruppen.map((g: { gruppeId: string }) => g.gruppeId)
    auftraege = await prisma.auftrag.findMany({
      where: { gruppeId: { in: gruppenIds }, status: { notIn: ["abgeschlossen", "storniert"] } },
      include: { saison: { select: { id: true, name: true } }, gruppe: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    })
  } else {
    // Kein Mitarbeiter-Datensatz verknüpft → keine Aufträge
    auftraege = []
  }

  // App-Mapping: flaeche_ha → gesamt_ha + flaechen_count + alias title/kunde
  const mapped = (auftraege as any[]).map((a) => {
    const ha = typeof a.flaeche_ha === "number" ? a.flaeche_ha : null
    return {
      id: a.id,
      title: a.titel,
      titel: a.titel,
      typ: a.typ,
      status: a.status,
      beschreibung: a.beschreibung ?? null,
      flaeche_ha: ha,
      gesamt_ha: ha ?? 0,
      flaechen_count: ha != null && ha > 0 ? 1 : 0,
      kunde: a.waldbesitzer ?? null,
      waldbesitzer: a.waldbesitzer ?? null,
      standort: a.standort ?? null,
      bundesland: a.bundesland ?? null,
      baumarten: a.baumarten ?? null,
      nummer: a.nummer ?? null,
      notizen: a.notizen ?? null,
      wizardDaten: a.wizardDaten ?? null,
      saisonId: a.saisonId ?? null,
      saison: a.saison ?? null,
      gruppeId: a.gruppeId ?? null,
      gruppe_id: a.gruppeId ?? null,
      gruppe_name: a.gruppe?.name ?? null,
      start_datum: a.startDatum ? new Date(a.startDatum).toISOString().slice(0, 10) : null,
      end_datum: a.endDatum ? new Date(a.endDatum).toISOString().slice(0, 10) : null,
      startDatum: a.startDatum,
      endDatum: a.endDatum,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }
  })

  return NextResponse.json(mapped)
})
