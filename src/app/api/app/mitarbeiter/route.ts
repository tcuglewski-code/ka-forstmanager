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

  const mitarbeiter = await prisma.mitarbeiter.findMany({
    where: { status: "aktiv", deletedAt: null },
    select: SAFE_SELECT,
    orderBy: [{ nachname: "asc" }, { vorname: "asc" }],
  })

  return NextResponse.json(mitarbeiter)
}
