/**
 * GET /api/app/foerster/abnahmen
 * Liefert alle Abnahmen, die dem authentifizierten Förster zugewiesen sind.
 * Match-Regel: foersterId == mitarbeiterId ODER foersterEmail == mitarbeiter.email
 * Query-Param `status` (offen|bestätigt|abgelehnt|mängel) optional.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = typeof appUser.sub === "string" ? appUser.sub : null
  let mitarbeiterId = (appUser.mitarbeiterId as string | null) ?? null

  let email: string | null = null
  if (mitarbeiterId) {
    const ma = await prisma.mitarbeiter.findUnique({
      where: { id: mitarbeiterId },
      select: { email: true },
    })
    email = ma?.email ?? null
  } else if (sub) {
    const linked = await prisma.mitarbeiter.findFirst({
      where: { userId: sub },
      select: { id: true, email: true },
    })
    mitarbeiterId = linked?.id ?? null
    email = linked?.email ?? null
  }

  if (!mitarbeiterId && !email) {
    return NextResponse.json({ abnahmen: [], count: 0 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const orClauses: Array<Record<string, unknown>> = []
  if (mitarbeiterId) orClauses.push({ foersterId: mitarbeiterId })
  if (email) orClauses.push({ foersterEmail: email })

  const where: Record<string, unknown> = { OR: orClauses }
  if (status) where.status = status

  const abnahmen = await prisma.abnahme.findMany({
    where,
    include: { auftrag: { select: { id: true, titel: true } } },
    orderBy: { datum: "desc" },
  })

  return NextResponse.json({ abnahmen, count: abnahmen.length })
}
