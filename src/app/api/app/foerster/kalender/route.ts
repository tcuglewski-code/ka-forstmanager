/**
 * GET /api/app/foerster/kalender — Kalender-Events für Förster (Bearer-Auth)
 *
 * Liefert geplante Abnahmen für den authentifizierten Förster im angegebenen
 * Zeitraum als Kalender-Items.
 *
 * Query-Params:
 *  - von: ISO-Datum (default: heute -30 Tage)
 *  - bis: ISO-Datum (default: heute +90 Tage)
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
    return NextResponse.json({ events: [], count: 0 })
  }

  const { searchParams } = new URL(req.url)
  const heute = new Date()
  const defaultVon = new Date(heute.getTime() - 30 * 86400000)
  const defaultBis = new Date(heute.getTime() + 90 * 86400000)
  const vonParam = searchParams.get("von")
  const bisParam = searchParams.get("bis")
  const von = vonParam ? new Date(vonParam) : defaultVon
  const bis = bisParam ? new Date(bisParam) : defaultBis

  const abnahmen = await prisma.abnahme.findMany({
    where: {
      datum: { gte: von, lte: bis },
      OR: [
        ...(mitarbeiterId ? [{ foersterId: mitarbeiterId }] : []),
        ...(email ? [{ foersterEmail: email }] : []),
      ],
    },
    orderBy: { datum: "asc" },
    include: {
      auftrag: { select: { id: true, titel: true, waldbesitzer: true, standort: true } },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = abnahmen.map((a: any) => ({
    id: a.id,
    titel: a.auftrag?.titel ?? "Abnahme",
    datum: a.datum.toISOString(),
    typ: "abnahme",
    status: a.status,
    auftragId: a.auftragId,
    auftrag: a.auftrag,
    notizen: a.notizen ?? null,
    gpsLat: a.gpsLat ?? null,
    gpsLon: a.gpsLon ?? null,
  }))

  return NextResponse.json({ events, count: events.length })
}
