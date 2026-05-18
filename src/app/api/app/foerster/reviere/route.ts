/**
 * GET /api/app/foerster/reviere — Reviere/Aufträge des authentifizierten Försters
 *
 * Bündelt alle Aufträge mit Abnahmen des Försters zu Revieren
 * (gruppiert nach Auftrag).
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = typeof appUser.sub === "string" ? appUser.sub : null
  let mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  let email: string | null = null
  if (mitarbeiterId) {
    const ma = await prisma.mitarbeiter.findUnique({
      where: { id: mitarbeiterId },
      select: { email: true },
    })
    email = ma?.email ?? null
  } else if (sub) {
    const linked = await prisma.mitarbeiter.findFirst({
      where: { userId: sub },
      select: { id: true, email: true },
    })
    mitarbeiterId = linked?.id ?? null
    email = linked?.email ?? null
  }

  if (!mitarbeiterId && !email) {
    return NextResponse.json({ reviere: [], count: 0 })
  }

  const abnahmen = await prisma.abnahme.findMany({
    where: {
      OR: [
        ...(mitarbeiterId ? [{ foersterId: mitarbeiterId }] : []),
        ...(email ? [{ foersterEmail: email }] : []),
      ],
    },
    include: {
      auftrag: {
        select: {
          id: true,
          titel: true,
          waldbesitzer: true,
          standort: true,
          bundesland: true,
          lat: true,
          lng: true,
          status: true,
        },
      },
    },
    orderBy: { datum: "desc" },
  })

  // Gruppiere nach Auftrag (= Revier)
  const reviereMap = new Map<string, {
    id: string
    auftragId: string
    name: string
    waldbesitzer: string | null
    standort: string | null
    bundesland: string | null
    lat: number | null
    lng: number | null
    abnahmenGesamt: number
    abnahmenOffen: number
    letzteAbnahme: string | null
  }>()

  for (const a of abnahmen) {
    if (!a.auftrag) continue
    const key = a.auftrag.id
    const existing = reviereMap.get(key)
    if (existing) {
      existing.abnahmenGesamt += 1
      if (a.status === "offen") existing.abnahmenOffen += 1
    } else {
      reviereMap.set(key, {
        id: key,
        auftragId: a.auftrag.id,
        name: a.auftrag.titel,
        waldbesitzer: a.auftrag.waldbesitzer ?? null,
        standort: a.auftrag.standort ?? null,
        bundesland: a.auftrag.bundesland ?? null,
        lat: a.auftrag.lat ?? null,
        lng: a.auftrag.lng ?? null,
        abnahmenGesamt: 1,
        abnahmenOffen: a.status === "offen" ? 1 : 0,
        letzteAbnahme: a.datum.toISOString(),
      })
    }
  }

  const reviere = Array.from(reviereMap.values())
  return NextResponse.json({ reviere, count: reviere.length })
}
