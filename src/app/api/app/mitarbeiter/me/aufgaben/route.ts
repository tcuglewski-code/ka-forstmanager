/**
 * GET /api/app/mitarbeiter/me/aufgaben — eigene zugewiesene Aufgaben
 *
 * Liefert eine Liste von Aufgaben (Aufträge in Gruppen, in denen der
 * Mitarbeiter Mitglied oder Gruppenführer ist), die "anstehen" oder
 * "in Bearbeitung" sind.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  if (!mitarbeiterId) {
    return NextResponse.json({ aufgaben: [] })
  }

  const [leadGruppen, memberGruppen] = await Promise.all([
    prisma.gruppe.findMany({
      where: { gruppenfuehrerId: mitarbeiterId },
      select: { id: true },
    }),
    prisma.gruppeMitglied.findMany({
      where: { mitarbeiterId },
      select: { gruppeId: true },
    }),
  ])

  const gruppenIds = Array.from(
    new Set<string>([
      ...leadGruppen.map((g: { id: string }) => g.id),
      ...memberGruppen.map((m: { gruppeId: string }) => m.gruppeId),
    ])
  )

  if (gruppenIds.length === 0) {
    return NextResponse.json({ aufgaben: [] })
  }

  const auftraege = await prisma.auftrag.findMany({
    where: {
      gruppeId: { in: gruppenIds },
      status: { in: ["geplant", "in_bearbeitung", "in_arbeit", "anstehend", "offen"] },
    },
    orderBy: { startDatum: "asc" },
    take: 50,
    select: {
      id: true,
      titel: true,
      typ: true,
      status: true,
      startDatum: true,
      endDatum: true,
      waldbesitzer: true,
      bundesland: true,
      gruppeId: true,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aufgaben = auftraege.map((a: any) => ({
    id: a.id,
    typ: a.typ ?? "auftrag",
    bezeichnung: a.titel,
    datum: a.startDatum ? new Date(a.startDatum).toISOString().slice(0, 10) : null,
    status: a.status === "in_bearbeitung" || a.status === "in_arbeit" ? "begonnen" : "zugewiesen",
    flaeche: a.bundesland ?? a.waldbesitzer ?? null,
    auftrag_id: a.id,
    gruppe_id: a.gruppeId,
  }))

  return NextResponse.json({ aufgaben })
}
