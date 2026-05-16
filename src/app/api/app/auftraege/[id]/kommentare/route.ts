import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

// Liefert true wenn der App-User Zugriff auf den Auftrag hat (DSGVO Gruppen-Check)
async function userHasAuftragAccess(
  appUser: Record<string, unknown>,
  auftragId: string
): Promise<{ ok: boolean; status?: number; isAdmin: boolean; isGF: boolean }> {
  const role =
    (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin =
    role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF =
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"

  const auftrag = await prisma.auftrag.findUnique({
    where: { id: auftragId },
    select: { id: true, gruppeId: true },
  })
  if (!auftrag) return { ok: false, status: 404, isAdmin, isGF }

  if (isAdmin) return { ok: true, isAdmin, isGF }

  const mitarbeiterId = appUser.mitarbeiterId as string | null
  if (!mitarbeiterId || !auftrag.gruppeId) {
    return { ok: false, status: 403, isAdmin, isGF }
  }

  if (isGF) {
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
      return { ok: false, status: 403, isAdmin, isGF }
    }
  } else {
    const member = await prisma.gruppeMitglied.findFirst({
      where: { mitarbeiterId, gruppeId: auftrag.gruppeId },
      select: { gruppeId: true },
    })
    if (!member) return { ok: false, status: 403, isAdmin, isGF }
  }

  return { ok: true, isAdmin, isGF }
}

// GET /api/app/auftraege/[id]/kommentare
// Liefert alle Kommentare (AuftragLog mit aktion='kommentar') zum Auftrag,
// neuestes zuerst, mit Autor-Namen aus User/Mitarbeiter.
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const access = await userHasAuftragAccess(appUser, id)
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 404 ? "Not found" : "Forbidden" },
      { status: access.status ?? 403 }
    )
  }

  const logs = await prisma.auftragLog.findMany({
    where: { auftragId: id, aktion: "kommentar" },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const userIds = Array.from(
    new Set(
      logs.map((l: { userId: string | null }) => l.userId).filter((u: string | null): u is string => !!u)
    )
  )
  const users: Array<{ id: string; name: string }> = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    : []
  const userMap = new Map<string, string>(
    users.map((u: { id: string; name: string }) => [u.id, u.name])
  )

  const result = logs.map((l: { id: string; nach: string | null; createdAt: Date; userId: string | null }) => ({
    id: l.id,
    text: l.nach ?? "",
    created_at: l.createdAt,
    createdAt: l.createdAt,
    autor_id: l.userId,
    autor_name: l.userId ? userMap.get(l.userId) ?? null : null,
  }))

  return NextResponse.json(result)
})

// POST /api/app/auftraege/[id]/kommentare
// Body: { text: string }
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const access = await userHasAuftragAccess(appUser, id)
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 404 ? "Not found" : "Forbidden" },
      { status: access.status ?? 403 }
    )
  }

  const body = (await req.json().catch(() => null)) as { text?: unknown } | null
  const text = typeof body?.text === "string" ? body.text.trim() : ""
  if (!text) {
    return NextResponse.json(
      { error: "text ist erforderlich" },
      { status: 400 }
    )
  }

  const userId = typeof appUser.sub === "string" ? appUser.sub : null
  const log = await prisma.auftragLog.create({
    data: {
      auftragId: id,
      aktion: "kommentar",
      nach: text,
      userId,
    },
  })

  let autorName: string | null = null
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })
    autorName = u?.name ?? null
  }

  return NextResponse.json(
    {
      id: log.id,
      text: log.nach ?? "",
      created_at: log.createdAt,
      createdAt: log.createdAt,
      autor_id: log.userId,
      autor_name: autorName,
    },
    { status: 201 }
  )
})
