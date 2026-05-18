/**
 * POST /api/app/mitarbeiter/[id]/ausleihe — Mitarbeiter zwischen Gruppen ausleihen
 *
 * Speichert eine temporäre Zuordnung in SystemConfig (Key: mitarbeiter_ausleihe_<id>_<von_datum>).
 * Nur Admin oder Gruppenführer der Quell- bzw. Ziel-Gruppe darf ausleihen.
 *
 * Body:
 *  - ziel_gruppe_id: string
 *  - von_datum: ISO-Datum
 *  - bis_datum: ISO-Datum
 */
import { NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const appUser = await getAppUser(req)
  if (!appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const role = (appUser.role as string | undefined) ?? (appUser.rolle as string | undefined)
  const ownId = (appUser.mitarbeiterId as string | null) ?? null
  const isAdmin = role === "ka_admin" || role === "admin" || role === "administrator"
  const isGF =
    role === "ka_gruppenführer" ||
    role === "ka_gruppenfuehrer" ||
    role === "gruppenfuehrer" ||
    role === "gruppenführer"

  if (!isAdmin && !isGF) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const zielGruppeId: string | undefined = body.ziel_gruppe_id ?? body.zielGruppeId
  const vonDatum: string | undefined = body.von_datum ?? body.vonDatum
  const bisDatum: string | undefined = body.bis_datum ?? body.bisDatum

  if (!zielGruppeId || !vonDatum || !bisDatum) {
    return NextResponse.json(
      { error: "Ungültige Daten", detail: "ziel_gruppe_id, von_datum und bis_datum sind erforderlich" },
      { status: 400 }
    )
  }

  // GF darf nur Mitarbeiter aus eigener Gruppe ausleihen
  if (!isAdmin && ownId) {
    const allowed = await prisma.gruppe.findFirst({
      where: {
        OR: [
          { gruppenfuehrerId: ownId, id: zielGruppeId },
          { gruppenfuehrerId: ownId, mitglieder: { some: { mitarbeiterId: id } } },
        ],
      },
      select: { id: true },
    })
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const key = `mitarbeiter_ausleihe_${id}_${vonDatum}`
  const value = JSON.stringify({
    mitarbeiterId: id,
    zielGruppeId,
    vonDatum,
    bisDatum,
    erstelltVon: ownId,
    erstelltAm: new Date().toISOString(),
  })

  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  return NextResponse.json({ success: true, key }, { status: 201 })
}
