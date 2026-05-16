import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

const ALLOWED_STATUS = [
  "offen",
  "in_arbeit",
  "bereit",
  "geprueft",
  "abgeschlossen",
  "nacharbeit",
  "abrechnungsbereit",
  "pausiert",
] as const

// PUT /api/app/auftraege/[id]/status
// Body: { status: string, notiz?: string }
// Auth: Bearer Token. Nur Admin und GF dürfen Status ändern (MA: 403).
export const PUT = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role =
    (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin =
    role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF =
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"

  if (!isAdmin && !isGF) {
    return NextResponse.json(
      { error: "Nur Gruppenführer und Admins dürfen den Status ändern" },
      { status: 403 }
    )
  }

  const body = (await req.json().catch(() => null)) as
    | { status?: unknown; notiz?: unknown }
    | null
  const status = typeof body?.status === "string" ? body.status.trim() : ""
  const notiz = typeof body?.notiz === "string" ? body.notiz.trim() : ""

  if (!status || !ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
    return NextResponse.json(
      {
        error: "Ungültiger Status",
        allowed: ALLOWED_STATUS,
      },
      { status: 400 }
    )
  }

  const { id } = await params

  const auftrag = await prisma.auftrag.findUnique({
    where: { id },
    select: { id: true, gruppeId: true, status: true },
  })
  if (!auftrag) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // DSGVO-/Gruppen-Check (Admin sieht alles; GF muss Mitglied/Leiter der Gruppe sein)
  if (!isAdmin) {
    const mitarbeiterId = appUser.mitarbeiterId as string | null
    if (!mitarbeiterId || !auftrag.gruppeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const [leadGruppen, memberGruppen] = await Promise.all([
      prisma.gruppe.findMany({
        where: { gruppenfuehrerId: mitarbeiterId, id: auftrag.gruppeId },
        select: { id: true },
      }),
      prisma.gruppeMitglied.findMany({
        where: { mitarbeiterId, gruppeId: auftrag.gruppeId },
        select: { gruppeId: true },
      }),
    ])
    if (leadGruppen.length === 0 && memberGruppen.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const userId = typeof appUser.sub === "string" ? appUser.sub : null
  const previousStatus = auftrag.status

  const [updated] = await prisma.$transaction([
    prisma.auftrag.update({
      where: { id },
      data: { status },
    }),
    prisma.auftragLog.create({
      data: {
        auftragId: id,
        aktion: "status_geaendert",
        von: previousStatus,
        nach: status,
        userId,
      },
    }),
    ...(notiz
      ? [
          prisma.auftragLog.create({
            data: {
              auftragId: id,
              aktion: "status_notiz",
              nach: notiz,
              userId,
            },
          }),
        ]
      : []),
  ])

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    previousStatus,
  })
})
