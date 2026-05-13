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

  // FIX 3: Idempotency — same mitarbeiter + auftrag + same day returns existing
  const mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null
  const auftragId = body.auftragId ?? null
  const datumInput = body.datum ? new Date(body.datum) : new Date()

  if (mitarbeiterId && auftragId && !Number.isNaN(datumInput.getTime())) {
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

  const proto = await prisma.tagesprotokoll.create({
    data: {
      auftragId: body.auftragId ?? null,
      gruppeId: body.gruppeId ?? null,
      datum: datumInput,
      ersteller: body.ersteller ?? String(appUser.email ?? ""),
      erstellerId: mitarbeiterId,
      bericht: body.bericht ?? null,
      gepflanzt: body.gepflanzt ? parseInt(body.gepflanzt) : null,
      witterung: body.witterung ?? null,
      fotos: body.fotos ?? null,
    },
  })
  // KA-Bot: Protokoll eingereicht (fire-and-forget)
  sendKANotification({
    event: "protokoll_eingereicht",
    data: { auftrag: body.auftragId ?? "—", ersteller: body.ersteller ?? String(appUser.email ?? "App") },
  }).catch(() => {})

  return NextResponse.json(proto, { status: 201 })
})
