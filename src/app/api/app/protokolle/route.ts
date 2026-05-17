import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { sendKANotification } from "@/lib/telegram-notify"
import { withErrorHandler } from "@/lib/api-handler"


// GET /api/app/protokolle
// Role-based listing:
//   - Admin: all Protokolle
//   - GF: Protokolle of own groups (as leader or member)
//   - MA/other: own Protokolle (erstellerId = current mitarbeiterId)
// Query params:
//   - auftragId?: filter by Auftrag
//   - limit?: max rows (default 100, capped at 500)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const auftragIdParam = url.searchParams.get("auftragId") || url.searchParams.get("auftrag_id")
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "100", 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100

  const mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF =
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"

  // Build where-clause based on role
  const where: any = {}
  if (auftragIdParam) where.auftragId = auftragIdParam

  if (!isAdmin) {
    if (!mitarbeiterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (isGF) {
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
      const groupIds = Array.from(
        new Set([
          ...leadGruppen.map((g) => g.id),
          ...memberGruppen.map((m) => m.gruppeId),
        ]),
      )
      if (groupIds.length === 0) {
        return NextResponse.json([])
      }
      where.OR = [
        { gruppeId: { in: groupIds } },
        { erstellerId: mitarbeiterId },
      ]
    } else {
      // MA: only own Protokolle
      where.erstellerId = mitarbeiterId
    }
  }

  const rows = await prisma.tagesprotokoll.findMany({
    where,
    orderBy: { datum: "desc" },
    take: limit,
  })

  return NextResponse.json(rows)
})


export const POST = withErrorHandler(async (req: NextRequest) => {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()

  // Akzeptiere snake_case und camelCase aus App-Payload
  const mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  let auftragId: string | null = body.auftragId ?? body.auftrag_id ?? null
  const gruppeId: string | null = body.gruppeId ?? body.gruppe_id ?? null

  if (!auftragId) {
    return NextResponse.json(
      { error: "Ungültige Daten", detail: "auftrag_id ist erforderlich" },
      { status: 400 },
    )
  }

  const datumInput = body.datum ? new Date(body.datum) : new Date()
  if (Number.isNaN(datumInput.getTime())) {
    return NextResponse.json(
      { error: "Ungültige Daten", detail: "datum ist ungültig" },
      { status: 400 },
    )
  }

  // Idempotency — gleicher Mitarbeiter + Auftrag + Tag → bestehendes Protokoll
  if (mitarbeiterId) {
    const dayStart = new Date(
      datumInput.getFullYear(),
      datumInput.getMonth(),
      datumInput.getDate(),
    )
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const existing = await prisma.tagesprotokoll.findFirst({
      where: {
        auftragId,
        erstellerId: mitarbeiterId,
        datum: { gte: dayStart, lt: dayEnd },
      },
    })
    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }
  }

  // Map snake_case → camelCase für gängige Felder
  const pauseMinutenRaw = body.pauseMinuten ?? body.pause_minuten
  const pauseMinuten =
    pauseMinutenRaw !== undefined && pauseMinutenRaw !== null
      ? parseInt(String(pauseMinutenRaw), 10) || 0
      : null

  const gepflanztRaw = body.gepflanzt ?? body.gepflanzt_gesamt ?? body.gepflanztGesamt
  const gepflanzt =
    gepflanztRaw !== undefined && gepflanztRaw !== null
      ? parseInt(String(gepflanztRaw), 10) || null
      : null

  const bericht =
    body.bericht ??
    body.notizen ??
    body.notes ??
    null

  const witterung = body.witterung ?? body.wetter ?? body.wetter_beschreibung ?? null

  // Fotos: array oder count — sicher als JSON ablegen
  const fotosValue =
    body.fotos ??
    (body.fotos_count !== undefined
      ? {
          count: body.fotos_count,
          kategorien: body.fotos_kategorien ?? [],
          koordinaten: body.fotos_koordinaten ?? [],
        }
      : null)

  // Baumarten- + Material-Verbrauch (vom App-Protokollformular)
  const baumartenVerbrauch = Array.isArray(body.baumarten_verbrauch)
    ? body.baumarten_verbrauch
    : null
  const materialVerbrauch = Array.isArray(body.material_verbrauch)
    ? body.material_verbrauch
    : null

  // pflanzDetails: bestehende Leistungsblöcke + baumarten_verbrauch zusammenführen
  const pflanzDetailsValue =
    baumartenVerbrauch || body.leistungsbloecke
      ? {
          ...(body.leistungsbloecke
            ? { leistungsbloecke: body.leistungsbloecke }
            : {}),
          ...(baumartenVerbrauch
            ? { baumarten_verbrauch: baumartenVerbrauch }
            : {}),
        }
      : null

  const proto = await prisma.tagesprotokoll.create({
    data: {
      auftragId,
      gruppeId,
      datum: datumInput,
      ersteller: body.ersteller ?? String(appUser.email ?? ""),
      erstellerId: mitarbeiterId,
      arbeitsbeginn: body.arbeitsbeginn ?? null,
      arbeitsende: body.arbeitsende ?? null,
      pauseMinuten,
      bericht: bericht ?? "",
      gepflanzt,
      witterung,
      fotos: fotosValue,
      pflanzDetails: pflanzDetailsValue ?? undefined,
      materialVerbraucht: materialVerbrauch ?? undefined,
      mitarbeiterListe:
        body.mitarbeiter_namen ?? body.mitarbeiterListe ?? null,
      mitarbeiterAnzahl:
        body.mitarbeiter_ids?.length ?? body.mitarbeiterAnzahl ?? null,
      gpsStartLat: body.gps_lat ?? body.gpsStartLat ?? null,
      gpsStartLon: body.gps_lng ?? body.gpsStartLon ?? null,
    },
  })

  // LagerBewegung pro verbrauchtem Material erzeugen
  if (materialVerbrauch && materialVerbrauch.length > 0) {
    for (const mv of materialVerbrauch) {
      const menge = Number(mv?.menge)
      const artikelId = mv?.material_id ? String(mv.material_id) : null
      if (!artikelId || !Number.isFinite(menge) || menge <= 0) continue
      try {
        await prisma.lagerBewegung.create({
          data: {
            artikelId,
            menge,
            typ: "VERBRAUCH",
            auftragId,
            mitarbeiterId: mitarbeiterId ?? null,
            referenz: proto.id,
            notiz: `Tagesprotokoll ${proto.datum.toISOString().slice(0, 10)}`,
          },
        })
      } catch (e) {
        // Einzelne Buchungsfehler dürfen Protokoll-Create nicht abbrechen
        console.error("[protokolle.POST] LagerBewegung-Fehler:", e)
      }
    }
  }

  // KA-Bot: Protokoll eingereicht (fire-and-forget)
  sendKANotification({
    event: "protokoll_eingereicht",
    data: { auftrag: body.auftragId ?? "—", ersteller: body.ersteller ?? String(appUser.email ?? "App") },
  }).catch(() => {})

  return NextResponse.json(proto, { status: 201 })
})
