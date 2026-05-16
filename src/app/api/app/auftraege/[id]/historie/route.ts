import { prisma } from "@/lib/prisma"
import { getAppUser } from "@/lib/app-auth"
import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-handler"

// GET /api/app/auftraege/[id]/historie
// Liefert AuftragLog-Einträge (neueste zuerst) mit Autor-Namen.
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const appUser = await getAppUser(req)
  if (!appUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

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
    where: { id },
    select: { id: true, gruppeId: true },
  })
  if (!auftrag) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!isAdmin) {
    const mitarbeiterId = appUser.mitarbeiterId as string | null
    if (!mitarbeiterId || !auftrag.gruppeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      const member = await prisma.gruppeMitglied.findFirst({
        where: { mitarbeiterId, gruppeId: auftrag.gruppeId },
        select: { gruppeId: true },
      })
      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
  }

  const logs = await prisma.auftragLog.findMany({
    where: { auftragId: id },
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

  return NextResponse.json(
    logs.map((l: { id: string; aktion: string; von: string | null; nach: string | null; userId: string | null; createdAt: Date }) => ({
      id: l.id,
      aktion: l.aktion,
      von: l.von,
      nach: l.nach,
      userId: l.userId,
      autor_name: l.userId ? userMap.get(l.userId) ?? null : null,
      createdAt: l.createdAt,
      created_at: l.createdAt,
    }))
  )
})
