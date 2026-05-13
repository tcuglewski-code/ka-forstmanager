import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/app/auftraege/[id]
// Returns single Auftrag with role-based access:
//   - Admin: any Auftrag
//   - GF: only Aufträge of own groups (lead or member)
//   - MA/Förster: only Aufträge of own member-groups
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const mitarbeiterId = appUser.mitarbeiterId as string | null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF =
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"

  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    include: {
      saison: { select: { id: true, name: true } },
      gruppe: { select: { id: true, name: true } },
    },
  })

  if (!auftrag) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Authorization check (DSGVO: non-admin must belong to the Auftrag's Gruppe)
  if (!isAdmin) {
    if (!mitarbeiterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const auftragGruppeId = auftrag.gruppeId
    if (!auftragGruppeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (isGF) {
      const [leadGruppen, memberGruppen] = await Promise.all([
        prisma.gruppe.findMany({
          where: { gruppenfuehrerId: mitarbeiterId, id: auftragGruppeId },
          select: { id: true },
        }),
        prisma.gruppeMitglied.findMany({
          where: { mitarbeiterId, gruppeId: auftragGruppeId },
          select: { gruppeId: true },
        }),
      ])
      if (leadGruppen.length === 0 && memberGruppen.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      const member = await prisma.gruppeMitglied.findFirst({
        where: { mitarbeiterId, gruppeId: auftragGruppeId },
        select: { gruppeId: true },
      })
      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
  }

  const a = auftrag as any
  const ha = typeof a.flaeche_ha === "number" ? a.flaeche_ha : null

  return NextResponse.json({
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
    waldbesitzerEmail: a.waldbesitzerEmail ?? null,
    waldbesitzerTelefon: a.waldbesitzerTelefon ?? null,
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
    gruppe: a.gruppe ?? null,
    gruppe_name: a.gruppe?.name ?? null,
    start_datum: a.startDatum ? new Date(a.startDatum).toISOString().slice(0, 10) : null,
    end_datum: a.endDatum ? new Date(a.endDatum).toISOString().slice(0, 10) : null,
    startDatum: a.startDatum,
    endDatum: a.endDatum,
    lat: a.lat ?? null,
    lng: a.lng ?? null,
    plusCode: a.plusCode ?? null,
    flaecheGeojson: a.flaecheGeojson ?? null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  })
})
