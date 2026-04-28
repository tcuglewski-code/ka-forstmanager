import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getAppUser } from "@/lib/app-auth"
import { withErrorHandler } from "@/lib/api-handler"

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  // Support both session and bearer auth
  const appUser = await getAppUser(req)
  const session = await auth()
  if (!appUser && !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const gruppe = await prisma.gruppe.findUnique({
    where: { id },
    include: { _count: { select: { mitglieder: true } } },
  })
  if (!gruppe) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const mitglieder = await prisma.gruppeMitglied.findMany({
    where: { gruppeId: id },
    include: { mitarbeiter: { select: { id: true, vorname: true, nachname: true } } },
  })

  const mitarbeiterIds = mitglieder.map((m) => m.mitarbeiterId)

  const [protokolle, stunden] = await Promise.all([
    prisma.tagesprotokoll.findMany({
      where: { gruppeId: id },
      select: {
        id: true,
        datum: true,
        gepflanztGesamt: true,
        flaecheBearbeitetHa: true,
        status: true,
        auftrag: { select: { id: true, titel: true, typ: true } },
      },
      orderBy: { datum: "desc" },
    }),
    prisma.stundeneintrag.findMany({
      where: { mitarbeiterId: { in: mitarbeiterIds } },
      select: { mitarbeiterId: true, stunden: true },
    }),
  ])

  const stundenGesamt = stunden.reduce((s, e) => s + (e.stunden ?? 0), 0)
  const gepflanztGesamt = protokolle.reduce((s, p) => s + (p.gepflanztGesamt ?? 0), 0)
  const haGesamt = protokolle.reduce((s, p) => s + (p.flaecheBearbeitetHa ?? 0), 0)

  // Per Mitarbeiter
  const perMA = mitglieder.map((m) => {
    const maStunden = stunden.filter((e) => e.mitarbeiterId === m.mitarbeiterId)
    return {
      id: m.mitarbeiterId,
      name: `${m.mitarbeiter.vorname} ${m.mitarbeiter.nachname}`,
      stunden: maStunden.reduce((s, e) => s + (e.stunden ?? 0), 0),
    }
  })

  // Per Auftrag
  const auftragsMap = new Map<string, { titel: string; typ: string; protokolleCount: number; gepflanzt: number; ha: number }>()
  for (const p of protokolle) {
    if (!p.auftrag) continue
    const cur = auftragsMap.get(p.auftrag.id) ?? { titel: p.auftrag.titel, typ: p.auftrag.typ, protokolleCount: 0, gepflanzt: 0, ha: 0 }
    auftragsMap.set(p.auftrag.id, {
      ...cur,
      protokolleCount: cur.protokolleCount + 1,
      gepflanzt: cur.gepflanzt + (p.gepflanztGesamt ?? 0),
      ha: cur.ha + (p.flaecheBearbeitetHa ?? 0),
    })
  }

  return NextResponse.json({
    gruppe: { id: gruppe.id, name: gruppe.name, mitarbeiterAnzahl: gruppe._count.mitglieder },
    kpis: {
      stundenGesamt: Math.round(stundenGesamt * 10) / 10,
      gepflanztGesamt,
      haGesamt: Math.round(haGesamt * 100) / 100,
      protokolleCount: protokolle.length,
      genehmigte: protokolle.filter((p) => p.status === "genehmigt").length,
    },
    perMitarbeiter: perMA.sort((a, b) => b.stunden - a.stunden),
    perAuftrag: [...auftragsMap.entries()].map(([aufId, v]) => ({ id: aufId, ...v })),
    letzteProtokolle: protokolle.slice(0, 10),
  })
})
