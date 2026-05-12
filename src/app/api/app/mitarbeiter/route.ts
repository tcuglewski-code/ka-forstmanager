/**
 * GET /api/app/mitarbeiter — App (Bearer-Auth) Mitarbeiter-Liste
 * Liefert aktive Mitarbeiter mit eingeschränktem, sicherem Feld-Set.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

const SAFE_SELECT = {
  id: true,
  vorname: true,
  nachname: true,
  email: true,
  telefon: true,
  mobil: true,
  rolle: true,
  qualifikationen: true,
  fuehrerschein: true,
  status: true,
  eintrittsdatum: true,
} as const

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const mitarbeiterId = appUser.mitarbeiterId as string | null
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF = role === "ka_gruppenführer" || role === "ka_gruppenfuhrer" || role === "gruppenfuehrer" || role === "gruppenführer"

  // Admin: alle aktiven Mitarbeiter
  if (isAdmin) {
    const mitarbeiter = await prisma.mitarbeiter.findMany({
      where: { status: "aktiv", deletedAt: null },
      select: SAFE_SELECT,
      orderBy: [{ nachname: "asc" }, { vorname: "asc" }],
    })
    return NextResponse.json(mitarbeiter)
  }

  // Ohne Mitarbeiter-Verknüpfung kein Zugriff
  if (!mitarbeiterId) return NextResponse.json([])

  // Erlaubte Gruppen ermitteln (GF: geführte + Mitgliedschaften, MA: nur Mitgliedschaften)
  const [leadGruppen, memberGruppen] = await Promise.all([
    isGF
      ? prisma.gruppe.findMany({ where: { gruppenfuehrerId: mitarbeiterId }, select: { id: true } })
      : Promise.resolve([] as { id: string }[]),
    prisma.gruppeMitglied.findMany({ where: { mitarbeiterId }, select: { gruppeId: true } }),
  ])
  const gruppenIds = Array.from(new Set<string>([
    ...leadGruppen.map((g: { id: string }) => g.id),
    ...memberGruppen.map((g: { gruppeId: string }) => g.gruppeId),
  ]))

  // Alle Mitglieder in den erlaubten Gruppen + selbst
  const allMembers = await prisma.gruppeMitglied.findMany({
    where: { gruppeId: { in: gruppenIds } },
    select: { mitarbeiterId: true },
  })
  const erlaubteIds = Array.from(new Set<string>([
    mitarbeiterId,
    ...allMembers.map((m: { mitarbeiterId: string }) => m.mitarbeiterId),
  ]))

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    where: { id: { in: erlaubteIds }, status: "aktiv", deletedAt: null },
    select: SAFE_SELECT,
    orderBy: [{ nachname: "asc" }, { vorname: "asc" }],
  })

  return NextResponse.json(mitarbeiter)
}
