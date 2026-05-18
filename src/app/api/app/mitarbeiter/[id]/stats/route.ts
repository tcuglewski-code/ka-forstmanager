/**
 * GET /api/app/mitarbeiter/[id]/stats — Mitarbeiter-Statistiken (Bearer-Auth)
 * Liefert grundlegende Kennzahlen für den App-Profil-Screen.
 *
 * Zugriff:
 *  - Admin: jeder Mitarbeiter
 *  - Eigene Stats: immer
 *  - GF: nur Mitarbeiter eigener Gruppen
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"

  // Access check
  if (!isAdmin && ownId !== id) {
    if (!ownId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const sameGroup = await prisma.gruppeMitglied.findFirst({
      where: {
        mitarbeiterId: id,
        gruppe: {
          OR: [
            { gruppenfuehrerId: ownId },
            { mitglieder: { some: { mitarbeiterId: ownId } } },
          ],
        },
      },
      select: { gruppeId: true },
    })
    if (!sameGroup) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const monatStart = new Date()
  monatStart.setDate(1)
  monatStart.setHours(0, 0, 0, 0)

  const [stundenAgg, protokolleCount, auftraegeCount] = await Promise.all([
    prisma.stundeneintrag.aggregate({
      where: { mitarbeiterId: id, datum: { gte: monatStart } },
      _sum: { stunden: true },
    }),
    prisma.tagesprotokoll.count({ where: { erstellerId: id } }),
    prisma.tagesprotokoll.findMany({
      where: { erstellerId: id },
      select: { auftragId: true },
      distinct: ["auftragId"],
    }),
  ])

  return NextResponse.json({
    mitarbeiterId: id,
    stunden_monat: stundenAgg._sum.stunden ?? 0,
    stundenMonat: stundenAgg._sum.stunden ?? 0,
    protokolle_count: protokolleCount,
    auftraege_count: auftraegeCount.length,
    stand: new Date().toISOString(),
  })
}
