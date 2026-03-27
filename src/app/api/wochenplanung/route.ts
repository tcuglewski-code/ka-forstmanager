// Sprint AO: Wochenplan-System — Haupt-API
// GET: Wochenpläne abrufen (mit Filter nach KW/Jahr/Gruppe)
// POST: Neuen Wochenplan erstellen

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdminOrGF } from "@/lib/permissions"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const url = new URL(req.url)
  const kalenderwoche = url.searchParams.get("kw") ? parseInt(url.searchParams.get("kw")!) : undefined
  const jahr = url.searchParams.get("jahr") ? parseInt(url.searchParams.get("jahr")!) : undefined
  const gruppeId = url.searchParams.get("gruppeId") ?? undefined

  const wochenplaene = await prisma.wochenplan.findMany({
    where: {
      ...(kalenderwoche ? { kalenderwoche } : {}),
      ...(jahr ? { jahr } : {}),
      ...(gruppeId ? { gruppeId } : {}),
    },
    include: {
      gruppe: { select: { id: true, name: true } },
      positionen: {
        orderBy: [{ datum: "asc" }, { dienstleistungstyp: "asc" }],
      },
    },
    orderBy: [{ jahr: "desc" }, { kalenderwoche: "desc" }],
  })

  return NextResponse.json(wochenplaene)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  if (!isAdminOrGF(session)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })

  const body = await req.json()
  const { kalenderwoche, jahr, gruppeId, notizen } = body

  if (!kalenderwoche || !jahr) {
    return NextResponse.json({ error: "Kalenderwoche und Jahr sind Pflichtfelder" }, { status: 400 })
  }

  // Prüfen ob bereits ein Plan für diese KW/Gruppe existiert
  const existiert = await prisma.wochenplan.findFirst({
    where: {
      kalenderwoche: parseInt(kalenderwoche),
      jahr: parseInt(jahr),
      ...(gruppeId ? { gruppeId } : { gruppeId: null }),
    },
  })

  if (existiert) {
    return NextResponse.json(
      { error: `Für KW ${kalenderwoche}/${jahr} existiert bereits ein Wochenplan` },
      { status: 409 }
    )
  }

  const wochenplan = await prisma.wochenplan.create({
    data: {
      kalenderwoche: parseInt(kalenderwoche),
      jahr: parseInt(jahr),
      gruppeId: gruppeId ?? null,
      erstelltVon: (session.user as { id?: string })?.id ?? null,
      notizen: notizen ?? null,
    },
    include: {
      gruppe: { select: { id: true, name: true } },
      positionen: true,
    },
  })

  return NextResponse.json(wochenplan, { status: 201 })
}
